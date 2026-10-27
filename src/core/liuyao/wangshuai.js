/**
 * src/core/bazi/wangshuai.js —— 六爻旺衰（自研，零依赖）
 *
 * 大白话：六爻断卦先看「爻旺不旺」——月建、日建对每一爻是生扶还是克泄，
 * 再叠加动爻、旬空、月破、日冲，给每一爻一个强弱评级。
 *
 * 口径（docs/CALIBER-NOTES.md「六爻」节）：
 *   · 月建：以节气月的地支为月建（寅月即正月建寅）；
 *   · 日建：当日地支；
 *   · 生扶：同我（比和）+2、生我 +1.5、我生 −1、克我 −1.5、我克 −0.5；
 *   · 月破（月建冲爻）直接判「破」；旬空判「空」；日冲判「暗动」；
 *   · 动爻自身 +1（主动），被日建克且动者降级。
 * 评级：≥3 旺、1.5–3 相、0–1.5 平、<0 休囚、破/空单列。
 */

import { ZHI, SHENG, KE } from '../common/constants.js';
import { liuyaoChart } from '../liuyao/liuyao.js';
import { monthZhiIndex, dayGanZhi } from '../calendar/ganzhi.js';

/** 五行关系打分 */
function score(me, other) {
  if (me === other) return { v: 2, 关系: '比和' };
  if (SHENG[other] === me) return { v: 1.5, 关系: '月日生爻' };
  if (SHENG[me] === other) return { v: -1, 关系: '爻生月日' };
  if (KE[other] === me) return { v: -1.5, 关系: '月日克爻' };
  return { v: -0.5, 关系: '爻克月日' };
}

/**
 * 六爻旺衰。
 * @param {object} input {y,m,d,h,coins?,gua?}
 */
export function wangshuaiOf(input) {
  const chart = liuyaoChart(input);
  const monthZ = ZHI[monthZhiIndex(input.y, input.m, input.d)].z;
  const dayZ = dayGanZhi(input.y, input.m, input.d)[1];
  const monthWx = ZHI.find((z) => z.z === monthZ).wx;
  const dayWx = ZHI.find((z) => z.z === dayZ).wx;

  const 爻 = chart.本卦.爻.map((y) => {
    const wx = ZHI.find((z) => z.z === y.纳甲[1]).wx;
    const m = score(wx, monthWx);
    const d = score(wx, dayWx);
    let total = m.v + d.v + (y.动爻 ? 1 : 0);
    const flags = [];
    if (y.月破) flags.push('月破');
    if (y.旬空) flags.push('旬空');
    if (y.日冲) flags.push('日冲');
    if (y.动爻) flags.push('动爻');
    if (y.月破) total -= 2;
    if (y.旬空) total -= 1;

    const 评级 = flags.includes('月破') ? '破' : flags.includes('旬空') ? '空' : total >= 3 ? '旺' : total >= 1.5 ? '相' : total >= 0 ? '平' : '休囚';

    return {
      位: y.位,
      纳甲: y.纳甲,
      五行: wx,
      六亲: y.六亲,
      世应: y.世应 || '—',
      月建关系: m.关系,
      日建关系: d.关系,
      标记: flags.join('、') || '—',
      得分: Number(total.toFixed(1)),
      评级,
    };
  });

  return {
    卦名: chart.本卦.卦名,
    月建: `${monthZ}（${monthWx}）`,
    日建: `${dayZ}（${dayWx}）`,
    六亲: chart.本卦.宫 + '宫' + chart.本卦.五行 + '，以宫五行为我',
    爻,
    说明: '旺衰评分是本项目按生克关系自定的量化口径，用于结构化比较，不作吉凶断语。',
  };
}
