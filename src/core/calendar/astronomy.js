/**
 * src/core/calendar/astronomy.js —— 天文基础算法（自研，零依赖）
 *
 * 大白话：节气 = 太阳黄经每走 15° 的时刻；农历月初一 = 朔（日月同经）的时刻。
 * 这两个「时刻」都能用天体力学位数展开算出来。本文件实现：
 *   1. 太阳几何黄经（Meeus《Astronomical Algorithms》第 25 章低精度级数，精度 ~0.01°≈15 分钟）
 *   2. 朔日月日（第 49 章级数，精度 ~1 分钟）
 *   3. ΔT（TT−UT 历书时差，Espenak-Meeus 多项式）
 *   4. 儒略日（TT/JDE）与北京时间日序互换
 * 所有级数系数为公开天文常数，代码全新实现。
 */

import { solarToJdn, jdnToSolar } from './solar.js';

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
