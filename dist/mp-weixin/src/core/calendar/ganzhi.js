// 由 tools/build-mp.js 自 src/core/calendar/ganzhi.js 生成，请勿手改
/**
 * src/core/calendar/ganzhi.js —— 干支纪年纪月纪日纪时（自研，零依赖）
 *
 * 大白话：干支 = 十天干配十二地支的 60 轮转表。
 * 口径（与产品定式一致）：
 *   - 日干支：儒略日 mod 60（锚：JDN%60=11 为甲子日；2000-01-01=戊午、1949-10-01=甲子）
 *   - 年干支（历法展示口径）：以立春交节日换年
 *   - 月干支：以十二节（立春/惊蛰/清明…小寒）交节日换月，月干由年干五虎遁
 *   - 时干支：23:00 起子时且换日（晚子归次日），时干由五鼠遁现算
 */

const { solarToJdn, jdnToSolar, pad2 } = require('./solar.js');
const { jieqiTable } = require('./jieqi2.js');
const { wuShuDun, GAN, ZHI } = require('../common/constants.js');

/** JDN mod 60 = 11 为甲子日。校准锚：2000-01-01=戊午、1949-10-01=甲子、1984-02-02=丙寅。 */
const JDN_MOD_JIAZI = 11;

const GZ = [];
for (let i = 0; i < 60; i++) GZ.push(GAN[i % 10].z + ZHI[i % 12].z);

/** 日干支序（0=甲子 … 59=癸亥），自然日 */
function dayGanZhiIndex(y, m, d) {
  const jdn = solarToJdn(y, m, d);
  return ((jdn - JDN_MOD_JIAZI) % 60 + 60) % 60;
}

function dayGanZhi(y, m, d) {
  return GZ[dayGanZhiIndex(y, m, d)];
}

/**
 * 年干支序（立春口径）：立春交节日前属上一年。
 * @param {Number} y 公历年 m 月 d 日
 */
function yearGanZhiIndexByLichun(y, m, d) {
  const lc = jieqiTable(y)['立春'];
  const effectiveYear = (m < lc.m || (m === lc.m && d < lc.d)) ? y - 1 : y;
  return ((effectiveYear - 4) % 60 + 60) % 60; // 公元 4 年 = 甲子年
}

function yearGanZhiByLichun(y, m, d) {
  return GZ[yearGanZhiIndexByLichun(y, m, d)];
}

/** 十二节（换月用）与公历月的对应：1月小寒、2月立春…12月大雪 */
const MONTH_JIE = {
  1: '小寒', 2: '立春', 3: '惊蛰', 4: '清明', 5: '立夏', 6: '芒种',
  7: '小暑', 8: '立秋', 9: '白露', 10: '寒露', 11: '立冬', 12: '大雪',
};

/** 月支序（0=子…11=亥）：节前属上一月支；1 月小寒前属上年子月 */
function monthZhiIndex(y, m, d) {
  const jie = jieqiTable(y)[MONTH_JIE[m]];
  if (m === 1) return d < jie.d ? 0 : 1;
  return d < jie.d ? (m - 1) % 12 : m % 12;
}

/** 月柱：月支按节气，月干五虎遁（年干立春口径） */
function monthGanZhi(y, m, d) {
  const zhiIdx = monthZhiIndex(y, m, d);
  // 月干由「该节气月所在农历年」的年干定：
  // 丑月（1月小寒后~2月立春前）属上一农历年；其余节气月属本年
  const jie = jieqiTable(y)[MONTH_JIE[m]];
  let yForGan = y;
  if (m === 1) yForGan = y - 1; // 1 月整个月（子月尾+丑月）都属上一农历年
  const lc = jieqiTable(yForGan)['立春'];
  const yGanIdx = yearGanZhiIndexByLichun(yForGan, lc.m, lc.d + 1) % 10; // 立春后一天取年干
  const offFromYin = ((zhiIdx - 2) % 12 + 12) % 12; // 距寅的偏移
  const ganIdx = (((yGanIdx % 5) * 2 + 2) + offFromYin) % 10;
  return GAN[ganIdx].z + ZHI[zhiIdx].z;
}

/** 时支序：23:00-00:59 = 子 */
function hourZhiIndex(h) {
  return Math.floor(((h + 1) % 24) / 2);
}

/** 时柱：由（换日后的）日干五鼠遁现算 */
function hourGanZhi(dayGan, h) {
  const t = hourZhiIndex(h);
  const g = GAN.findIndex((x) => x.z === dayGan);
  const ganIdx = wuShuDun(g, t);
  return GAN[ganIdx].z + ZHI[t].z;
}

/** 晚子换日：h>=23 用次日公历 */
function effectiveDay(y, m, d, h) {
  if (h >= 23) return jdnToSolar(solarToJdn(y, m, d) + 1);
  return { y, m, d };
}

/** 干支序转字 / 字转序 */
function gzText(idx) { return GZ[((idx % 60) + 60) % 60]; }
function gzIndex(text) { return GZ.indexOf(text); }

/** 生肖（立春口径，随年柱支） */
function zodiacByLichun(y, m, d) {
  return ZHI[yearGanZhiIndexByLichun(y, m, d) % 12].sx;
}



/**
 * 按节气判定季节（天赦等用）：立夏前=春、立秋前=夏、立冬前=秋、其余=冬。
 */
function jieqiSeason(y, m, d) {
  const t = jieqiTable(y);
  const target = y * 10000 + m * 100 + d;
  const j = (name) => { const [yy, mm, dd] = t[name].text.split('-').map(Number); return yy * 10000 + mm * 100 + dd; };
  if (target < j('立夏')) return '春';
  if (target < j('立秋')) return '夏';
  if (target < j('立冬')) return '秋';
  return '冬';
}


module.exports.dayGanZhiIndex = dayGanZhiIndex;
module.exports.dayGanZhi = dayGanZhi;
module.exports.yearGanZhiIndexByLichun = yearGanZhiIndexByLichun;
module.exports.yearGanZhiByLichun = yearGanZhiByLichun;
module.exports.monthZhiIndex = monthZhiIndex;
module.exports.monthGanZhi = monthGanZhi;
module.exports.hourZhiIndex = hourZhiIndex;
module.exports.hourGanZhi = hourGanZhi;
module.exports.effectiveDay = effectiveDay;
module.exports.gzText = gzText;
module.exports.gzIndex = gzIndex;
module.exports.zodiacByLichun = zodiacByLichun;
module.exports.jieqiSeason = jieqiSeason;
module.exports.JDN_MOD_JIAZI = JDN_MOD_JIAZI;
module.exports.GZ = GZ;
module.exports.pad2 = pad2;
