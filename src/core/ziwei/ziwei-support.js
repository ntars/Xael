/**
 * src/core/ziwei/ziwei-support.js —— 紫微所用历法适配（复用 calendar 内核，零新依赖）
 */

export { yearGanZhiIndexByLichun, monthZhiIndex, dayGanZhiIndex, hourZhiIndex } from '../calendar/ganzhi.js';
export { solarToLunar } from '../calendar/lunar2.js';

import { solarToLunar } from '../calendar/lunar2.js';

/** 安全取农历（越界年份返回 null） */
export function solarToLunarSafe(y, m, d) {
  try { return solarToLunar(y, m, d); } catch (e) { return null; }
}

/** 农历年干支序（以正月初一为年界，供紫微斗数用）：(农历年 − 4) mod 60 */
export function lunarYearGzIndex(lunarYear) {
  return (((lunarYear - 4) % 60) + 60) % 60;
}
