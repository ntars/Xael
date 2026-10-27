/**
 * src/core/fengshui/feixing.js —— 玄空飞星（年月日时紫白）（自研，零依赖）
 *
 * 大白话：紫白九星（一白贪狼…九紫右弼）按洛书轨迹「飞布」九宫。
 * 「入中星」落在中宫，其余八星沿固定轨迹逐宫递增（顺飞）或递减（逆飞）。
 *
 * 口径：
 *   · 顺飞轨迹（洛书）：中5→乾6→兑7→艮8→离9→坎1→坤2→震3→巽4；
 *   · 年紫白：入中 = (11 − 年%9) mod 9（0 作 9）；
 *   · 月紫白：子午卯酉年正月起 8、寅申巳亥年起 2、辰戌丑未年起 5，逐月逆推入中，入中后顺飞；
 *   · 日紫白：分段起数（冬至1顺/雨水7顺/谷雨4顺/夏至9逆/处暑3逆/霜降6逆），
 *     起星日=交节后首个甲子日，入中=起星±间隔天 mod 9；
 *   · 时紫白：日支子午卯酉起 1（冬至后）/9（夏至后）、辰戌丑未起 4/6、寅申巳亥起 7/3，
 *     冬至后顺飞、夏至后逆飞；
 *   · 三元九运：1864 起每 20 年一运（2024–2043 = 九运·九紫）。
 */

import { dayNo, solarToJdn } from '../calendar/solar.js';
import { dayGanZhiIndex, jieqiSeason } from '../calendar/ganzhi.js';
import { jieqiTable } from '../calendar/jieqi2.js';
import { ZHI, JIAZI } from '../common/constants.js';

export const STARS = ['一白', '二黑', '三碧', '四绿', '五黄', '六白', '七赤', '八白', '九紫'];
export const STAR_META = {
  一白: { 吉凶: '吉', 宫: '坎', 五行: '水', 专位: '北', 主象: '贪狼·文昌官贵' },
  二黑: { 吉凶: '凶', 宫: '坤', 五行: '土', 专位: '西南', 主象: '巨门·病符' },
  三碧: { 吉凶: '凶', 宫: '震', 五行: '木', 专位: '东', 主象: '禄存·是非' },
  四绿: { 吉凶: '吉', 宫: '巽', 五行: '木', 专位: '东南', 主象: '文昌·科名' },
  五黄: { 吉凶: '大凶', 宫: '中', 五行: '土', 专位: '中', 主象: '廉贞·戊己大煞' },
  六白: { 吉凶: '吉', 宫: '乾', 五行: '金', 专位: '西北', 主象: '武曲·权威' },
  七赤: { 吉凶: '凶', 宫: '兑', 五行: '金', 专位: '西', 主象: '破军·口舌' },
  八白: { 吉凶: '大吉', 宫: '艮', 五行: '土', 专位: '东北', 主象: '左辅·财帛' },
  九紫: { 吉凶: '吉', 宫: '离', 五行: '火', 专位: '南', 主象: '右弼·喜庆' },
};

/** 顺飞轨迹：宫序（0..8 对应 中乾兑艮离坎坤震巽 的飞布路径，以九宫数表示） */
const TRACK = [5, 6, 7, 8, 9, 1, 2, 3, 4];
const GONG_NAME = { 1: '坎(北)', 2: '坤(西南)', 3: '震(东)', 4: '巽(东南)', 5: '中', 6: '乾(西北)', 7: '兑(西)', 8: '艮(东北)', 9: '离(南)' };

function n9(x) { return ((x - 1) % 9 + 9) % 9 + 1; }

/** 飞布：入中星 ruZhong、顺(+)逆(−)，返回 {宫号: 星} */
function feiGong(ruZhong, dir = 1) {
  const out = {};
  TRACK.forEach((gong, i) => {
    const star = dir === 1 ? n9(ruZhong + i) : n9(ruZhong - i);
    out[gong] = star;
  });
  return out;
}

/** 年紫白：入中星 */
export function yearStar(year) {
  return n9(9 - ((year - 2000) % 9));
}

/** 三元九运（1864 上元一运起） */
export function yunOf(year) {
  return ((Math.floor((year - 1864) / 20)) % 9) + 1;
}

/** 月紫白：入中星。
 *  口径：按「节气月」计，正月=寅月（立春起）。
 *  子午卯酉年正月起八白、寅申巳亥年起二黑、辰戌丑未年起五黄，逐月逆推入中。
 *  年支取「立春换年」的干支年支（与历法底座一致）。
 *  @param {number} year 公历年
 *  @param {number} yinMonth 节气月序 1..12（1=寅月，即立春所在月）
 */
export function monthStar(year, yinMonth) {
  const yZhi = ((year - 4) % 12 + 12) % 12; // 年支序 0=子
  const start = [0, 6, 3, 9].includes(yZhi) ? 8 : [2, 8, 5, 11].includes(yZhi) ? 2 : 5;
  return n9(start - (yinMonth - 1)); // 逐月逆推
}

/** 由公历日期推节气月序（1=寅月）。
 *  实现：jieqiTable 返回 Y-1 冬至 ~ Y 大雪，因此只需扫 y-1..y+1 三张表，
 *  把其中所有「节」按日期排序，取「≤ 目标日 且 ≥ 目标日前后最近立春」的最大月序即可。
 *  月份名与序号的绑定：立春=寅(1) …… 大雪=子(11)、小寒=丑(12)。
 */
export function yinMonthOf(y, m, d) {
  const JIE = [['立春', 1], ['惊蛰', 2], ['清明', 3], ['立夏', 4], ['芒种', 5], ['小暑', 6],
               ['立秋', 7], ['白露', 8], ['寒露', 9], ['立冬', 10], ['大雪', 11], ['小寒', 12]];
  const dn = dayNo(y, m, d);
  const rows = [];
  for (const yy of [y - 1, y, y + 1]) {
    const t = jieqiTable(yy);
    for (const [name, idx] of JIE) {
      const it = t[name];
      if (!it || !it.text) continue;
      const [ty, tm, td] = it.text.split('-').map(Number);
      rows.push({ sdn: dayNo(ty, tm, td), idx });
    }
  }
  rows.sort((a, b) => a.sdn - b.sdn);
  // 目标日所处节气年的年首＝≤ 目标日的最后一个「立春」
  let lichun = -Infinity;
  for (const r of rows) if (r.idx === 1 && r.sdn <= dn && r.sdn > lichun) lichun = r.sdn;
  let idx = 1;
  for (const r of rows) if (r.sdn <= dn && r.sdn > lichun) idx = r.idx;
  return idx;
}

/** 日紫白：入中星。
 *  口径：以「太阳黄经三十分段」各段首日后的第一个甲子日为起星日，
 *  起星分别为 冬至一白（顺）、雨水七赤（顺）、谷雨四绿（顺）、
 *  夏至九紫（逆）、处暑三碧（逆）、霜降六白（逆）；入中=起星 ± 相隔天数（mod 9）。
 */
export function dayStar(y, m, d) {
  const dn = dayNo(y, m, d);
  const SEG = [
    ['冬至', 1, 1], ['雨水', 7, 1], ['谷雨', 4, 1],
    ['夏至', 9, -1], ['处暑', 3, -1], ['霜降', 6, -1],
  ];
  let best = null;
  for (const yy of [y - 1, y]) {
    const t = jieqiTable(yy);
    for (const [name, start, dir] of SEG) {
      const it = t[name];
      if (!it || !it.text) continue;
      const [ty, tm, td] = it.text.split('-').map(Number);
      const segDn = dayNo(ty, tm, td);
      if (segDn <= dn && (!best || segDn > best.dn)) best = { dn: segDn, start, dir };
    }
  }
  // 起星日＝段首之后（含当天）第一个甲子日
  let q = best.dn;
  while (dayGanZhiIndex(...fromDn(q)) % 60 !== 0) q++;
  const span = Math.abs(dn - q);
  return best.dir === 1 ? n9(best.start + span) : n9(best.start - span);
}

/** 日序 → [y,m,d] */
function fromDn(dn) {
  // 以 1970-01-01 为基准反推（dayNo 与儒略日同日序原点）
  const jdn = JDN_1970 + dn;
  const a = jdn + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
  const dd = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * dd / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * mm + 2) / 5) + 1;
  const month = mm + 3 - 12 * Math.floor(mm / 10);
  const year = 100 * b + dd - 4800 + Math.floor(mm / 10);
  return [year, month, day];
}
const JDN_1970 = 2440588;

/** 时紫白：入中星 */
export function hourStar(y, m, d, h) {
  const gz = dayGanZhiIndex(y, m, d);
  const dz = gz % 12; // 日支序 0=子
  // 阳半＝冬至后至夏至前（顺）；阴半＝夏至后至冬至前（逆）
  const afterDZ = yangHalf(y, m, d);
  const grp = [0, 6, 3, 9].includes(dz) ? 'zheng' : [2, 8, 5, 11].includes(dz) ? 'mu' : 'sheng';
  const START = {
    zheng: { shun: 1, ni: 9 },
    mu: { shun: 4, ni: 6 },
    sheng: { shun: 7, ni: 3 },
  };
  const start = afterDZ ? START[grp].shun : START[grp].ni;
  const dir = afterDZ ? 1 : -1;
  const hourZhi = Math.floor(((h + 1) % 24) / 2); // 0=子
  const span = hourZhi;
  return dir === 1 ? n9(start + span) : n9(start - span);
}

/** 判定是否处于「阳半」（冬至后至夏至前），用于日月时紫白顺逆 */
function yangHalf(y, m, d) {
  const dn = dayNo(y, m, d);
  const pick = (t, name) => {
    const it = t[name];
    if (!it || !it.text) return null;
    const [ty, tm, td] = it.text.split('-').map(Number);
    return dayNo(ty, tm, td);
  };
  const tPrev = jieqiTable(y - 1), tCur = jieqiTable(y);
  const dongzhi = pick(tPrev, '冬至'), xiazhi = pick(tCur, '夏至');
  return dn >= dongzhi && dn < xiazhi;
}

/**
 * 全套飞星。
 */
export function feixingChart(input) {
  const { y, m, d, h = 12 } = input;
  const yun = yunOf(y);
  return {
    input,
    三元九运: { 运: yun, 星: STARS[yun - 1], 年份: yun === 9 ? '2024–2043' : '' },
    年紫白: { 入中: STARS[yearStar(y) - 1], 盘: fmt(feiGong(yearStar(y))) },
    月紫白: { 入中: STARS[monthStar(y, yinMonthOf(y, m, d)) - 1], 盘: fmt(feiGong(monthStar(y, yinMonthOf(y, m, d)))) },
    日紫白: { 入中: STARS[dayStar(y, m, d) - 1], 盘: fmt(feiGong(dayStar(y, m, d))) },
    时紫白: { 入中: STARS[hourStar(y, m, d, h) - 1], 盘: fmt(feiGong(hourStar(y, m, d, h))) },
    口径: '年紫白=(11−年数字和)入中；月紫白按节气月（正月=寅月）逆推；日紫白以六段节气后首个甲子日起星、顺逆飞；时紫白三组起数、冬至后顺夏至后逆',
  };
}

function fmt(pan) {
  // 九宫格输出：巽4 离9 坤2 / 震3 中5 兑7 / 艮8 坎1 乾6
  const pos = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  return pos.map((g) => STARS[pan[g] - 1]).join(' | ');
}
