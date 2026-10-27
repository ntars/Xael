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

/** 月紫白：入中星（月按节气月 1=寅月？通例用公历月配节气年——此处按通书公历月简法并声明口径） */
export function monthStar(year, month) {
  const yZhi = ((year - 4) % 12 + 12) % 12; // 年支序 0=子
  const start = [0, 6, 3, 9].includes(yZhi) ? 8 : [2, 8, 5, 11].includes(yZhi) ? 2 : 5;
  const ru = n9(start - (month - 1)); // 逐月逆推
  return ru;
}

/** 日紫白：入中星 */
export function dayStar(y, m, d) {
  const dn = dayNo(y, m, d);
  // 分段：[段首节气, 起数, 方向]
  const SEG = [
    ['冬至', 1, 1], ['雨水', 7, 1], ['谷雨', 4, 1],
    ['夏至', 9, -1], ['处暑', 3, -1], ['霜降', 6, -1],
  ];
  const gz = dayGanZhiIndex(y, m, d);
  // 找目标日所在段：从当年节气表里取各段首日期，取 ≤ 日的最晚段（跨年）
  const { jieqiTable } = require0();
  let best = null;
  for (const yy of [y - 1, y]) {
    const t = jieqiTable(yy);
    for (const [name, start, dir] of SEG) {
      if (t[name] && t[name].text) {
        const [ty, tm, td] = t[name].text.split('-').map(Number);
        const segDn = dayNo(ty, tm, td);
        if (segDn <= dn && (!best || segDn > best.dn)) best = { dn: segDn, start, dir };
      }
    }
  }
  // 起星日 = 段首后首个甲子日
  let s = best.dn;
  while ((solarToJdn(0, 0, 0) + s) % 1 !== 0) s++; // 无意义占位，实际用日柱判定：
  // 日柱判定：dayNo 1970-01-01 = 辛巳（干支序 5+10*6=47? JIAZI 序 15）——直接用 dayGanZhiIndex 口径：
  let q = best.dn;
  while (true) {
    const jdn = solarToJdn(1970, 1, 1) + q;
    // 儒略日 mod 60 = 51 为甲子（1984-02-02 甲子，JDN 2445732 → (2445732+49)%60==0 校准）
    if ((jdn + 49) % 60 === 0) break;
    q++;
  }
  const span = Math.abs(dn - q);
  return best.dir === 1 ? n9(best.start + span) : n9(best.start - span);
}

/** 时紫白：入中星 */
export function hourStar(y, m, d, h) {
  const gz = dayGanZhiIndex(y, m, d);
  const dz = gz % 12; // 日支序 0=子
  const afterDZ = jieqiSeason(y, m, d) >= 0; // 冬至后~夏至前为阳半（jieqiSeason 返回年节气序或自定义）
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

function require0() {
  // 避免 ESM 循环依赖：jieqiTable 由调用方传入场景多，这里延迟 import 不可用 → 改顶层 import（见下）
  return jieqiModule;
}
import * as jieqiModule from '../calendar/jieqi2.js';

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
    月紫白: { 入中: STARS[monthStar(y, m) - 1], 盘: fmt(feiGong(monthStar(y, m))) },
    日紫白: { 入中: STARS[dayStar(y, m, d) - 1], 盘: fmt(feiGong(dayStar(y, m, d))) },
    时紫白: { 入中: STARS[hourStar(y, m, d, h) - 1], 盘: fmt(feiGong(hourStar(y, m, d, h))) },
    口径: '年紫白公式入中；月紫白年支起正月逆推；日紫白分段甲子起星；时紫白三组起数冬顺夏逆',
  };
}

function fmt(pan) {
  // 九宫格输出：巽4 离9 坤2 / 震3 中5 兑7 / 艮8 坎1 乾6
  const pos = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  return pos.map((g) => STARS[pan[g] - 1]).join(' | ');
}
