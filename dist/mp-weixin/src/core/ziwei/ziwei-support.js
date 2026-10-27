// 由 tools/build-mp.js 自 src/core/ziwei/ziwei-support.js 生成，请勿手改
/**
 * src/core/ziwei/ziwei-support.js —— 紫微所用历法适配（复用 calendar 内核，零新依赖）
 */

const __re_1246086130 = require('../calendar/ganzhi.js');
const __re_1905087591 = require('../calendar/lunar2.js');

const { solarToLunar } = require('../calendar/lunar2.js');

/** 安全取农历（越界年份返回 null） */
function solarToLunarSafe(y, m, d) {
  try { return solarToLunar(y, m, d); } catch (e) { return null; }
}

/** 农历年干支序（以正月初一为年界，供紫微斗数用）：(农历年 − 4) mod 60 */
function lunarYearGzIndex(lunarYear) {
  return (((lunarYear - 4) % 60) + 60) % 60;
}


module.exports.yearGanZhiIndexByLichun = __re_1246086130.yearGanZhiIndexByLichun;
module.exports.monthZhiIndex = __re_1246086130.monthZhiIndex;
module.exports.dayGanZhiIndex = __re_1246086130.dayGanZhiIndex;
module.exports.hourZhiIndex = __re_1246086130.hourZhiIndex;
module.exports.solarToLunar = __re_1905087591.solarToLunar;
module.exports.solarToLunarSafe = solarToLunarSafe;
module.exports.lunarYearGzIndex = lunarYearGzIndex;
