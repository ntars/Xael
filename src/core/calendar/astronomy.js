/**
 * src/core/calendar/astronomy.js —— 天文基础算法（自研，零依赖）
 * 算法来源：Jean Meeus 库外《Astronomical Algorithms》(2nd ed.) 太阳黄经/章动/ΔT 级数；
 *   朔与节气高精度解参照寿星万年历（SXTWL）的公开算法思想，代码全部自研重写。
 *
 * 大白话：节气 = 太阳黄经每走 15° 的时刻；农历月初一 = 朔（日月同经）的时刻。
 * 这两个「时刻」都能用天体力学位数展开算出来。本文件实现：
 *   1. 太阳几何黄经（Meeus 库外《Astronomical Algorithms》第 25 章低精度级数，精度 ~0.01°≈15 分钟）
 *   2. 朔日月日（第 49 章级数，精度 ~1 分钟）
 *   3. ΔT（TT−UT 历书时差，Espenak-Meeus 多项式）
 *   4. 儒略日（TT/JDE）与北京时间日序互换
 * 所有级数系数为公开天文常数，代码全新实现。
 */

import { solarToJdn, jdnToSolar } from './julian.js';

const RAD = Math.PI / 180;
const sin = (d) => Math.sin(d * RAD);
const cos = (d) => Math.cos(d * RAD);

/** 儒略世纪数 T（自 J2000.0 TT） */
function jcen(jde) {
  return (jde - 2451545.0) / 36525;
}

/**
 * ΔT = TT − UT1（秒）。Espenak-Meeus 多项式分段（精度数十秒级，对本应用足够）。
 */
export function deltaT(year) {
  const y = year + (year < 0 ? 1 - year / 100 : 0); // 负年修正，一般用不到
  if (y < 1900) {
    const t = (y - 1860) / 100;
    return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t - 0.0004473624 * t ** 4 + t ** 5 / 233174;
  }
  if (y < 1920) {
    const t = y - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (y < 1941) {
    const t = y - 1920;
    return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3;
  }
  if (y < 1961) {
    const t = y - 1950;
    return 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547;
  }
  if (y < 1986) {
    const t = y - 1975;
    return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718;
  }
  if (y < 2005) {
    const t = y - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  }
  if (y < 2050) {
    const t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  if (y < 2150) {
    return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
  }
  const u = (y - 1820) / 100;
  return -20 + 32 * u * u;
}

/**
 * 太阳几何黄经（度，0-360）。Meeus 低精度（式 25.1 系列），精度约 0.01°。
 * @param {Number} jde 儒略日（TT）
 */
export function sunLon(jde) {
  const T = jcen(jde);
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
    (0.019993 - 0.000101 * T) * sin(2 * M) +
    0.000289 * sin(3 * M);
  const omega = 125.04 - 1934.136 * T;
  let lon = L0 + C - 0.00569 - 0.00478 * sin(omega);
  lon %= 360;
  if (lon < 0) lon += 360;
  return lon;
}

/**
 * 第 k 个朔的 JDE（TT）。k 为朔望月序（k=0 为 2000-01-06 朔）。
 * Meeus 第 49 章「新月」级数，精度约 1 分钟。
 */
export function newMoonJDE(k) {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  let jde =
    2451550.09766 + 29.530588861 * k + 0.00015437 * T2 -
    0.000000150 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = 2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3;              // 太阳平近点角
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4; // 月亮平近点角
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
  const O = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;             // 升交点

  jde +=
    -0.40720 * sin(Mp) +
    0.17241 * E * sin(M) +
    0.01608 * sin(2 * Mp) +
    0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) -
    0.00514 * E * sin(Mp + M) +
    0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) -
    0.00057 * sin(Mp + 2 * F) +
    0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) +
    0.00042 * E * sin(M + 2 * F) +
    0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) -
    0.00017 * sin(O) -
    0.00007 * sin(Mp + 2 * M) +
    0.00004 * sin(2 * Mp - 2 * F) +
    0.00004 * sin(3 * M) +
    0.00003 * sin(Mp + M - 2 * F) +
    0.00003 * sin(2 * Mp + 2 * F) -
    0.00003 * sin(Mp + M + 2 * F) +
    0.00003 * sin(Mp - M + 2 * F) -
    0.00002 * sin(Mp - M - 2 * F) -
    0.00002 * sin(3 * Mp + M) +
    0.00002 * sin(4 * Mp);

  // A 项摄动
  const A1 = 299.77 + 0.107408 * k - 0.009173 * T2;
  const A2 = 251.88 + 0.016321 * k;
  const A3 = 251.83 + 20.07020 * k + 0.00129 * T2;
  const A4 = 349.42 + 36.37306 * k + 0.00103 * T2;
  const A5 = 98.36 + 40.91385 * k + 0.00111 * T2;
  const A6 = 135.02 + 47.33867 * k + 0.00191 * T2;
  const A7 = 249.89 + 88.49905 * k + 0.00319 * T2;
  const A8 = 173.97 + 86.61446 * k + 0.00211 * T2;
  const A9 = 233.51 + 100.73609 * k + 0.00220 * T2;
  const A10 = 257.81 + 105.46680 * k + 0.00211 * T2;
  const A11 = 90.06 + 111.56550 * k + 0.00156 * T2;
  const A12 = 330.17 + 118.06831 * k + 0.00408 * T2;
  const A13 = 83.58 + 122.03726 * k + 0.00348 * T2;
  const A14 = 210.19 + 130.05814 * k + 0.00368 * T2;
  jde +=
    0.000325 * sin(A1) + 0.000165 * sin(A2) + 0.000164 * sin(A3) + 0.000126 * sin(A4) +
    0.000110 * sin(A5) + 0.000062 * sin(A6) + 0.000060 * sin(A7) + 0.000056 * sin(A8) +
    0.000047 * sin(A9) + 0.000042 * sin(A10) + 0.000040 * sin(A11) + 0.000037 * sin(A12) +
    0.000035 * sin(A13) + 0.000023 * sin(A14);
  return jde;
}

/**
 * JDE(TT) → 北京时间（UTC+8）日序与时刻。
 * 先减 ΔT 得 UT，再加 8h 得北京时间。
 * @returns {{dayNo: Number, hh: Number, mm: Number}} dayNo= Unix 日序，hh/mm 北京时刻
 */
export function jdeToBeijing(jde, approxYear) {
  const ut = jde - deltaT(approxYear) / 86400;
  const beijing = ut + 8 / 24; // UTC+8
  const jdn = Math.floor(beijing + 0.5);
  const frac = beijing + 0.5 - jdn;
  const day = jdn - solarToJdn(1970, 1, 1);
  const totalMin = Math.round(frac * 1440);
  return { dayNo: day, hh: Math.floor(totalMin / 60) % 24, mm: totalMin % 60 };
}

/** 北京时间日序 + 时刻 → JDE(TT)（供反推，少用） */
export function beijingToJDE(dayNumber, hh, mm, approxYear) {
  const beijing = dayNumber + solarToJdn(1970, 1, 1) - 0.5 + (hh * 60 + mm) / 1440;
  return beijing - 8 / 24 + deltaT(approxYear) / 86400;
}

/** JDE → 公历（忽略时刻，取 TT 当日；供粗略显示） */
export function jdeToSolarDate(jde) {
  return jdnToSolar(Math.floor(jde + 0.5));
}

export { sin, cos, RAD, jcen };

/* ───────────────────────── 高精度太阳黄经（节气求解用） ─────────────────────────
 * 上面的 sunLon 是 Meeus 低精度式，误差可达 10 分钟；节气时刻要与权威万年历对齐到
 * 分钟以内，必须换成 VSOP87 截断级数（6 阶）。系数在 data/astronomy-tables.js。
 * 下面三个函数是同一套级数的三段拼装：
 *   eLon(t, n)        —— 地球黄经（VSOP87 截断，按精度 n 截项）
 *   nutationLon2(t)   —— 章动黄经
 *   gxcSunLon(t)      —— 光行差修正
 * 三者相加再加 π，得「视太阳黄经」，t 的单位是「儒略千年（J2000 起）」。
 */

import { XL0, NUT_B, DT_AT } from './data/astronomy-tables.js';

const SECOND_PER_RAD = 648000 / Math.PI;
const ONE_THIRD = 1 / 3;

/**
 * 地球黄经级数（VSOP87 截断）。
 * @param {Number} t 儒略千年（J2000 起算，即「儒略世纪数 / 10」）
 * @param {Number} n 精度档：0=最省、10=中、-1=全量
 */
export function eLon(t, n) {
  const tt = t / 10; // 级数内部以「千年」为单位
  let v = 0;
  let tn = 1;
  const pn = 1;
  const m0 = XL0[pn + 1] - XL0[pn];
  for (let i = 0; i < 6; i += 1, tn *= tt) {
    const n1 = Math.floor(XL0[pn + i]);
    const n2 = Math.floor(XL0[pn + 1 + i]);
    const n0 = n2 - n1;
    if (n0 === 0) continue;
    let m;
    if (n < 0) {
      m = n2; // 全量
    } else {
      m = Math.floor(3 * n * n0 / m0 + 0.5) + n1;
      if (i !== 0) m += 3;
      if (m > n2) m = n2;
    }
    let c = 0;
    for (let j = n1; j < m; j += 3) c += XL0[j] * Math.cos(XL0[j + 1] + tt * XL0[j + 2]);
    v += c * tn;
  }
  v /= XL0[0];
  const t2 = tt * tt;
  v += (-0.0728 - 2.7702 * tt - 1.1019 * t2 - 0.0996 * t2 * tt) / SECOND_PER_RAD;
  return v;
}

/** 章动黄经（弧度）。t 单位同上 */
export function nutationLon2(t) {
  let a = -1.742 * t;
  const t2 = t * t;
  let dl = 0;
  for (let i = 0; i < NUT_B.length; i += 5) {
    dl += (NUT_B[i + 3] + a) * Math.sin(NUT_B[i] + NUT_B[i + 1] * t + NUT_B[i + 2] * t2);
    a = 0;
  }
  return dl / 100 / SECOND_PER_RAD;
}

/** 光行差修正（弧度） */
export function gxcSunLon(t) {
  const t2 = t * t;
  const v = -0.043126 + 628.301955 * t - 0.000002732 * t2;
  const e = 0.016708634 - 0.000042037 * t - 0.0000001267 * t2;
  return -20.49552 * (1 + e * Math.cos(v)) / SECOND_PER_RAD;
}

/** 视太阳黄经（弧度，含章动与光行差） */
export function saLon(t, n) {
  return eLon(t, n) + nutationLon2(t) + gxcSunLon(t) + Math.PI;
}

/** 太阳黄经变化率（弧度/日），用于牛顿迭代 */
function evOf(t) {
  const f = 628.307585 * t;
  return 628.332 + 21 * Math.sin(1.527 + f) + 0.44 * Math.sin(1.48 + f * 2)
    + 0.129 * Math.sin(5.82 + f) * t + 0.00055 * Math.sin(4.21 + f) * t * t;
}

/**
 * 解「视太阳黄经 = w（弧度）」的时刻，返回儒略千年（J2000 起）。
 * 三步牛顿：粗解 → 中精度修正 → 高精度修正。
 */
export function saLonT(w) {
  const v0 = 628.3319653318;
  let t = (w - 1.75347 - Math.PI) / v0;
  t += (w - saLon(t, 10)) / evOf(t);
  t += (w - saLon(t, -1)) / evOf(t);
  return t;
}

/** ΔT 分段表插值（秒），比上面的 deltaT 更贴近实测表 */
export function dtTable(year) {
  const size = DT_AT.length;
  const y0 = DT_AT[size - 2];
  const t0 = DT_AT[size - 1];
  if (year >= y0) {
    const jsd = 31;
    const ext = (y) => { const dy = (y - 1820) / 100; return -20 + jsd * dy * dy; };
    if (year > y0 + 100) return ext(year);
    return ext(year) - (ext(y0) - t0) * (y0 + 100 - year) / 100;
  }
  let i = 0;
  for (; i < size; i += 5) if (year < DT_AT[i + 5]) break;
  const t1 = (year - DT_AT[i]) / (DT_AT[i + 5] - DT_AT[i]) * 10;
  const t2 = t1 * t1;
  const t3 = t2 * t1;
  return DT_AT[i + 1] + DT_AT[i + 2] * t1 + DT_AT[i + 3] * t2 + DT_AT[i + 4] * t3;
}

/** 儒略千年 → ΔT（天） */
function dtT(t) {
  return dtTable(t / 365.2425 + 2000) / 86400;
}

/**
 * 求「视黄经 = w」的气时刻，返回「自 J2000 起的天数（北京时）」。
 * 这个数与 solar-terms.js 的日序换算方式配套：J2000 起点 + 天数 → 北京日期时刻。
 */
export function qiAccurate(w) {
  const t = saLonT(w) * 36525;
  return t - dtT(t) + ONE_THIRD; // +1/3 天 = 东八区
}

/** 节气序号 → 相对天数（给 solar-terms.js 用）：w 为弧度，一档 15° */
export function qiAt(w) {
  return qiAccurate(w);
}

export { SECOND_PER_RAD, ONE_THIRD };
