/**
 * src/core/mystic-gates/mirror-chart.js —— 奇门遁甲·宝鉴日奇（自研，零依赖）
 *
 * 大白话：《奇门宝鉴》一系的「日奇」起例，与 180 日一元轮派的日家奇门是两套系统：
 *   ① 局数 = 日支定局表（子午 2、丑未 6、寅申 1、卯酉 8、辰戌 4、巳亥 9，不分遁式）；
 *   ② 地盘三奇六仪按阴阳遁顺/逆布九宫（含中五，与时家同法）；
 *   ③ 九星自甲子日「天蓬起艮八」起每日顺移一位，走洛书九宫数序（含中五占位）；
 *   ④ 八门自甲子日「休门在坎一」起每三日顺转一宫（不入中五）。
 * 原文未给八神/天盘/值符值使（本式无旬首概念），故不输出——不臆造。
 *
 * 口径（docs/CALIBER-NOTES.md「奇门」节同步声明）：
 *   · 与转盘日家并列展示、不合并；原文按语自存疑（门三日过一宫…皆不可解，姑存之）。
 */

import { SEXAGENARY, BRANCHES } from '../common/constants.js';
import { daySexagenaryIndex, daySexagenary } from '../calendar/sexagenary.js';
import { solarTermsTable, JIE_ONLY } from '../calendar/solar-terms.js';

import { YANG_TERMS } from './terms.js';
/** 日支定局表（原文「子午日用二局」不分遁式） */
const ZHI_JU = { 子: 2, 丑: 6, 寅: 1, 卯: 8, 辰: 4, 巳: 9, 午: 2, 未: 6, 申: 1, 酉: 8, 戌: 4, 亥: 9 };
/** 三奇六仪布仪序（戊己庚辛壬癸丁丙乙） */
const SEQ = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
/** 洛书九宫数序（含中五）——九星环 */
const LUO9 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
/** 洛书数序跳过中五——八门环 */
const LUO8 = [1, 2, 3, 4, 6, 7, 8, 9];
/** 九星序（含天禽占中五） */
const STAR9 = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];
/** 八门环序（休→生→伤→杜→景→死→惊→开） */
const GATE_RING = ['休', '生', '伤', '杜', '景', '死', '惊', '开'];

/** 节气名 → 阳遁判断（冬至~芒种半周阳遁）；表在 terms.js，不在此另抄 */
const YANG_JIE = YANG_TERMS;

/** 本地日序（与 calendar/solar.dayNo 同口径，避免循环依赖） */
function jdnOf(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + a * 12 - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

/**
 * 阴阳遁：由当前节气定（冬至后阳遁、夏至后阴遁）。
 * 节气按「日」界取（宝鉴原文只论节后，不细化时刻），取 y-1/y/y+1 跨年安全。
 */
function dunOf(y, m, d) {
  const target = jdnOf(y, m, d);
  let best = null, bestT = -Infinity;
  for (const yy of [y - 1, y, y + 1]) {
    const t = solarTermsTable(yy);
    for (const k of YANG_JIE.concat(['夏至'])) {
      const jt = jdnOf(t[k].y, t[k].m, t[k].d);
      if (jt <= target && jt > bestT) { bestT = jt; best = k; }
    }
  }
  return YANG_JIE.includes(best) ? '阳遁' : '阴遁';
}

/**
 * 宝鉴日奇。
 * @param {object} input {y,m,d}
 */
export function mysticGatesMirrorChart(input) {
  const { y, m, d } = input;

  const gzIdx = daySexagenaryIndex(y, m, d) % 60;
  const gz = SEXAGENARY[gzIdx];
  const gan = gz[0], zhi = gz[1];

  const yang = dunOf(y, m, d) === '阳遁';
  const ju = ZHI_JU[zhi];

  // 地盘：三奇六仪阳顺阴逆布九宫（含中五），起局数宫
  const 地盘 = {};
  for (let s = 0; s < 9; s += 1) {
    const pal = yang ? ((ju + s - 1) % 9) + 1 : ((ju - s - 1 % 9 + 2 * 9) % 9) + 1;
    地盘[pal] = SEQ[s];
  }

  // 甲子锚 + 日差：甲子日序 = (daySexagenaryIndex % 60) === 0（JDN-11 口径），
  // 直接用 solarToJdn 同式本地日序对齐
  let N = 0;
  for (let i = 0; i < 60; i += 1) {
    const day = jdnOf(y, m, d) - i;
    if (((day - 11) % 60 + 60) % 60 === 0) { N = i; break; }
  }

  // 九星：甲子日天蓬起艮八，每日顺移一位（含中五数序）
  const 九星 = {};
  const base9 = LUO9.indexOf(8);
  for (let i = 0; i < 9; i += 1) {
    九星[LUO9[(base9 + N + i) % 9]] = STAR9[i];
  }

  // 八门：甲子日休门在坎一，每三日顺转一宫（不入中五）
  const 八门 = {};
  const base8 = LUO8.indexOf(1);
  const xiuPos = LUO8[(base8 + Math.floor(N / 3)) % 8];
  for (let gi = 0; gi < 8; gi += 1) {
    八门[LUO8[(LUO8.indexOf(xiuPos) + gi) % 8]] = GATE_RING[gi];
  }

  return {
    name: '日支定局法（奇門遁甲統宗·附日奇门起例）',
    日干支: gan + zhi,
    阴阳遁: yang ? '阳遁' : '阴遁',
    局数: ju,
    定局依据: '日支' + zhi + ' → ' + ju + ' 局',
    日差: N,
    地盘, 九星, 八门,
    缺口: [
      '原文只给定局、九星、八门三事，八神排法、天盘三奇六仪、值符值使（本式无旬首概念）原文未给，故不输出——不臆造。',
      '九星走洛书九宫数序「顺飞九宫」（含中五占位）：原文「天蓬起艮八、芮在离九」两例只在含中五数序下成立，八门明写「不入中五」，两环分用。',
      '本式与按六十甲子日分局的转盘日家（日家奇门）是两套系统，输出并列不合并，混排即错盘。',
    ],
  };
}
