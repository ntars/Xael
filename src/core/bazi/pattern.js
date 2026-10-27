/**
 * src/core/bazi/pattern.js —— 八字格局判定（自研，零依赖）
 *
 * 大白话：格局是给八字「定个主调」——日主在月令里是旺是弱、月令透出什么十神，
 * 据此给出一个粗略的格局名。本模块只做结构化判定，不作吉凶断语。
 *
 * 口径（详见 docs/CALIBER-NOTES.md「八字」节）：
 *   · 月令本气透干者，取该十神为格（正官格、偏财格、食神格……）；
 *   · 月令本气不透、中气或余气透干者，取透出者；
 *   · 皆不透时以月令本气十神为「月令格」，并标注「不透」；
 *   · 日主强弱按「得令/得地/得势」三要素打分：月令生扶 +2、通根月支 +1、
 *     天干比劫印星各 +1，克泄耗各 −1，结果分「偏强/中和/偏弱」三档。
 * 这是本项目自定的简化评估办法，属展示性指标，不是命理定论。
 */

import { GAN, ZHI, CANGGAN, SHENG, KE, shiShen } from '../common/constants.js';
import { chart } from './bazi.js';

/** 五行关系：a 对 b 是「生/克/同」 */
function rel(a, b) {
  if (a === b) return '同';
  if (SHENG[a] === b) return '生'; // a 生 b
  if (KE[a] === b) return '克'; // a 克 b
  if (SHENG[b] === a) return '被生';
  return '被克';
}

/** 十神 → 属于「扶身」还是「泄耗」 */
const SUPPORT = ['比肩', '劫财', '正印', '偏印'];
const DRAIN = ['食神', '伤官', '正财', '偏财', '正官', '七杀'];

/**
 * 格局判定。
 * @param {object} input {y,m,d,h,gender}
 * @returns {object} { 日主, 月令, 月令十神, 透干, 格局, 强弱, 依据[], 评分 }
 */
export function patternOf(input) {
  const c = chart(input);
  const dayGan = c.pillars.日.干;
  const monthZhi = c.pillars.月.支;
  const zhiObj = ZHI.find((z) => z.z === monthZhi);
  const cangList = CANGGAN[monthZhi] || []; // 本气、中气、余气
  const stems = [c.pillars.年.干, c.pillars.月.干, c.pillars.时.干];

  // 1) 月令透干：按本气→中气→余气顺序找第一个透出的
  let 透干 = null;
  for (const g of cangList) {
    if (stems.includes(g)) {
      透干 = g;
      break;
    }
  }
  const 本气 = cangList[0];
  const 取干 = 透干 || 本气;
  const 月令十神 = shiShen(dayGan, 取干);
  const 格局 = 月令十神 ? `${月令十神}格` : '月令格';

  // 2) 强弱评分
  let score = 0;
  const 依据 = [];
  const dayWuXing = GAN.find((g) => g.z === dayGan).wx;
  const monthWuXing = zhiObj.wx;

  // 得令
  const r1 = rel(monthWuXing, dayWuXing);
  if (r1 === '同' || r1 === '生') {
    score += 2;
    依据.push(`月令${monthZhi}（${monthWuXing}）${r1 === '同' ? '同气' : '生扶'}日主，得令 +2`);
  } else {
    score -= 1;
    依据.push(`月令${monthZhi}（${monthWuXing}）${r1 === '克' ? '克制' : '泄耗'}日主，失令 −1`);
  }

  // 得地：月支藏干是否含日主同类或印
  const sameOrSource = cangList.some((g) => {
    const w = GAN.find((x) => x.z === g).wx;
    return w === dayWuXing || SHENG[w] === dayWuXing;
  });
  if (sameOrSource) {
    score += 1;
    依据.push(`日主${dayGan}在月支${monthZhi}有根，得地 +1`);
  }

  // 得势：天干三个位置
  for (const g of stems) {
    const ss = shiShen(dayGan, g);
    if (SUPPORT.includes(ss)) {
      score += 1;
      依据.push(`天干${g}为${ss}，扶身 +1`);
    } else if (DRAIN.includes(ss)) {
      score -= 1;
      依据.push(`天干${g}为${ss}，泄耗 −1`);
    }
  }

  const 强弱 = score >= 3 ? '偏强' : score <= -1 ? '偏弱' : '中和';

  return {
    日主: `${dayGan}${dayWuXing}`,
    月令: `${monthZhi}${monthWuXing}`,
    月令藏干: cangList.join('、'),
    月令十神,
    透干: 透干 || '不透（以月令本气论）',
    格局: 透干 ? 格局 : `${格局}（不透）`,
    强弱,
    评分: score,
    依据,
    说明: '强弱为本项目按得令/得地/得势三要素自定的简化评分，仅作结构化展示。',
  };
}
