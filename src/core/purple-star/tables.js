/**
 * src/core/purple-star/tables.js —— 紫微所用历法适配（复用 calendar 内核，零新依赖）
 * 本文件只是历法适配（转调 calendar 内核），不含紫微安星规则（见 chart.js 文件头）。
 *
 * 历法口径：斗数用「农历正月初一换年」的年干（lunarYearGzIndex），与子平八字
 *   「立春换年」两套并行——斗数以农历年为岁首是通行口径，其历法依据见
 *   《紫微斗数全书》诸星问答论（岁首依农历），本文件只做换算不做规则判定。
 */

export { yearSexagenaryIndex, monthBranchIndex, daySexagenaryIndex, hourBranchIndex } from '../calendar/sexagenary.js';
export { solarToLunisolar } from '../calendar/lunisolar.js';

import { solarToLunisolar } from '../calendar/lunisolar.js';

/** 安全取农历（越界年份返回 null） */
export function solarToLunarSafe(y, m, d) {
  try { return solarToLunisolar(y, m, d); } catch (e) { return null; }
}

/** 农历年干支序（以正月初一为年界，供紫微斗数用）：(农历年 − 4) mod 60 */
export function lunarYearGzIndex(lunarYear) {
  return (((lunarYear - 4) % 60) + 60) % 60;
}
