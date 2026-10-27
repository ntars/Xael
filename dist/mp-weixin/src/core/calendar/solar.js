// 由 tools/build-mp.js 自 src/core/calendar/solar.js 生成，请勿手改
/**
 * src/core/calendar/solar.js —— 公历/儒略日/日序工具（自研，零依赖）
 *
 * 大白话：术数演算的第一步是把公历日期变成一个可做加减的「天序号」。
 * 这里用天文历法标准公式把公历 y-m-d 换成儒略日（Julian Day, JD），
 * 之后所有「隔多少天」「往前推 N 天」都用整数天序号做，天然规避时区/夏令时坑。
 */

/** 公历 y-m-d 是否闰年 */
function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** 公历某年某月天数 */
function daysInMonth(y, m) {
  const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return m === 2 && isLeap(y) ? 29 : dim[m - 1];
}

/** 公历 y-m-d 转儒略日（当日中午，即 JDN 整数天号）。支持任意年份。 */
function solarToJdn(y, m, d) {
  // Fliegel-Van Flandern 公式（公历标准算法）
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** 儒略日天号反推公历 y-m-d */
function jdnToSolar(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const m2 = Math.floor((5 * e + 2) / 153);
  return {
    y: 100 * b + d2 - 4800 + Math.floor(m2 / 10),
    m: m2 + 3 - 12 * Math.floor(m2 / 10),
    d: e - Math.floor((153 * m2 + 2) / 5) + 1,
  };
}

/** 公历日期差（天）：a - b 的天数 */
function dayDiff(a, b) {
  return solarToJdn(a.y, a.m, a.d) - solarToJdn(b.y, b.m, b.d);
}

/** 公历日序（Unix 日序，等价 Date.UTC(y,m-1,d)/86400000），用于查表 */
function dayNo(y, m, d) {
  return solarToJdn(y, m, d) - solarToJdn(1970, 1, 1);
}

/** 日序反推公历 */
function fromDayNo(n) {
  return jdnToSolar(n + solarToJdn(1970, 1, 1));
}

/** 某日是星期几（0=日 … 6=六） */
function weekday(y, m, d) {
  return (solarToJdn(y, m, d) + 1) % 7;
}

/** 补零 */
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function pad4(n) { return n < 1000 ? ('000' + n).slice(-4) : '' + n; }


module.exports.isLeap = isLeap;
module.exports.daysInMonth = daysInMonth;
module.exports.solarToJdn = solarToJdn;
module.exports.jdnToSolar = jdnToSolar;
module.exports.dayDiff = dayDiff;
module.exports.dayNo = dayNo;
module.exports.fromDayNo = fromDayNo;
module.exports.weekday = weekday;
module.exports.pad2 = pad2;
module.exports.pad4 = pad4;
