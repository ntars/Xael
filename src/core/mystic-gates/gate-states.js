/**
 * src/core/mystic-gates/gate-states.js —— 八门与三奇的「得时 / 得地」旺衰（自研，零依赖）
 *
 * 大白话：奇门里「开门是吉门」「乙奇是吉奇」这种说法只管门奇本身的性情，
 *   落到某张具体的盘上还得看它**此刻旺不旺**——旺了吉门才真吉，衰了吉门也办不成事。
 *
 * 依据（库内原文直证）：《奇门宝鉴·释义四十四则》第三则——
 *   「奇门选择，最重衰旺休囚。如开门本吉，但其性属金，如临土宫金位，及当季夏三秋，
 *     所谓得时得地，时之最吉者也。如在春夏，而临于木火，则金气大衰，岂得为吉。
 *     **凡八门皆然，三奇亦然**。」
 *
 * 于是拆成两把尺子，原文都点到了：
 *   ① **得时**＝季节上旺相（该五行在本季节属「旺」或「相」）。
 *      原文「当季夏三秋」是金得时（秋金旺、季夏土生金），「春夏」是金失时（春木旺火相，金囚）。
 *      季节旺衰表用《三命通会·论五行旺相休囚死》：当令者旺、我生者相、生我者休、克我者囚、我克者死。
 *   ② **得地**＝所在洛书宫的五行对它是生扶或同气。原文「临土宫金位」＝土宫生金、金位同气，故得地；
 *      「临于木火」＝火克金、木耗金，故失地。
 *
 * 门与奇的五行：
 *   · 八门属五行取「门之本位宫」（休坎水、生艮土、伤震木、杜巽木、景离火、死坤土、惊兑金、开乾金）；
 *     原文「开门本吉，但其性属金」与「开＝乾金」一致，可反证这张表。
 *   · 三奇即乙、丙、丁三天干，五行随干（乙木、丙火、丁火）。
 *
 * 不做的事（不臆造）：
 *   · 不给「旺则吉几分、衰则凶几分」这类分数——原文只说「岂得为吉」，没给权重；
 *   · 不改门本身的原吉凶（吉门/凶门仍按《奇门宝鉴·释门》等原有判法），只在旁边标旺衰；
 *   · 门迫（门克宫）另有专篇《奇门宝鉴·释迫》，本模块不重复承担，只在「得地」里区分泄、制、迫三种关系。
 */

import { SEASON_OF, SEASON_STATE } from '../common/season.js';

/** 八门五行（按门之本位宫：坎水、艮土、震木、巽木、离火、坤土、兑金、乾金） */
export const GATE_ELEMENT = {
  休门: '水', 生门: '土', 伤门: '木', 杜门: '木', 景门: '火', 死门: '土', 惊门: '金', 开门: '金',
};

/** 洛书九宫五行（1 坎水、2 坤土、3 震木、4 巽木、5 中土、6 乾金、7 兑金、8 艮土、9 离火） */
export const PALACE_ELEMENT = { 1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火' };

/** 三奇五行 */
export const QI_ELEMENT = { 乙: '木', 丙: '火', 丁: '火' };

const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/**
 * 季节旺衰（《三命通会·论五行旺相休囚死》）。
 * @param {string} wx 五行
 * @param {string} monthZhi 月支（寅…丑）
 */
export function seasonStateOf(wx, monthZhi) {
  const season = SEASON_OF[monthZhi];
  if (!season) return '';
  return (SEASON_STATE[season] || {})[wx] || '';
}

/**
 * 得时：本季节属旺或相。
 * 原文「当季夏三秋」为金得时、「春夏」为金失时——正是「旺/相」与「休/囚/死」的分界。
 */
export function timelyOf(wx, monthZhi) {
  const st = seasonStateOf(wx, monthZhi);
  if (!st) return { 得时: false, 态: '', 依据: '' };
  return {
    得时: st === '旺' || st === '相',
    态: st,
    依据: `${wx}在${SEASON_OF[monthZhi]}为「${st}」`,
  };
}

/**
 * 得地：所在洛书宫五行对它是「生我」或「同气」。
 * 同时分出泄（我生宫）、制（宫克我）、迫（我克宫，门迫另见《奇门宝鉴·释迫》）三种失地形态。
 */
export function groundedOf(wx, palace) {
  const gw = PALACE_ELEMENT[palace];
  if (!gw) return { 得地: false, 关系: '', 依据: '' };
  let 关系;
  if (gw === wx) 关系 = '同气';
  else if (SHENG[gw] === wx) 关系 = '宫生门';
  else if (SHENG[wx] === gw) 关系 = '门生宫（泄）';
  else if (KE[gw] === wx) 关系 = '宫克门（制）';
  else 关系 = '门克宫（迫）';
  return {
    得地: 关系 === '同气' || 关系 === '宫生门',
    关系,
    依据: `${palace}宫属${gw}，与${wx}${关系}`,
  };
}

/**
 * 八门（或三奇）的旺衰总判。
 * 只做四档定性，不给分值：
 *   得时 + 得地 → 「最吉」（原文「时之最吉者也」）
 *   得其一      → 「减力」
 *   皆失        → 「大衰」（原文「金气大衰，岂得为吉」）
 */
export function gateStateOf(name, palace, monthZhi) {
  const wx = GATE_ELEMENT[name] || QI_ELEMENT[name];
  if (!wx) return null;
  const t = timelyOf(wx, monthZhi);
  const g = groundedOf(wx, palace);
  const 判 = (t.得时 && g.得地) ? '最吉' : (t.得时 || g.得地) ? '减力' : '大衰';
  const 说明 = 判 === '最吉'
    ? '得时得地，原文称「时之最吉者也」'
    : 判 === '减力'
      ? `只得一头（${t.得时 ? '得时' : '失时'}、${g.得地 ? '得地' : `失地`}），力有折损`
      : '既失时又失地，原文「气大衰，岂得为吉」';
  return {
    名: name, 五行: wx, 宫: palace,
    得时: t.得时, 时态: t.态, 得地: g.得地, 地关系: g.关系,
    判, 说明,
    依据: `《奇门宝鉴·释义四十四则》——「凡八门皆然，三奇亦然」（${t.依据}；${g.依据}）`,
  };
}

/**
 * 整盘汇总：给出盘上每个八门与三奇的旺衰，按宫序。
 * @param {Array<{宫:number,门?:string,天盘干?:string}>} cells hour-chart / quarter-chart 的 cells
 * @param {string} monthZhi 月支
 */
export function gateStatesOf(cells, monthZhi) {
  const 门 = [];
  const 奇 = [];
  (cells || []).forEach((c) => {
    const p = +c.宫;
    if (c.门 && GATE_ELEMENT[c.门]) {
      const s = gateStateOf(c.门, p, monthZhi);
      if (s) 门.push(s);
    }
    const g = c['天盘干'];
    if (g && QI_ELEMENT[g]) {
      const s = gateStateOf(g, p, monthZhi);
      if (s) 奇.push(s);
    }
  });
  return { 月令: monthZhi, 门, 奇, 依据: '八门与三奇的得时得地按《奇门宝鉴·释义四十四则》第三则' };
}
