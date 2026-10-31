/**
 * src/core/mystic-gates/quarter-chart.js —— 刻家奇门（自研，零依赖·时家局内推）
 *
 * 大白话：刻家不是「另一种奇门」，而是在**时家局之内**再细分——一个时辰十刻（每刻 12 分钟），
 *   初刻就用本时辰的时家局，此后每进一刻把「戊」所在的宫位推一宫（阳遁顺推 +1、阴遁逆推 −1）。
 *
 * 口径（原书库外《奇门遁甲预测学试行教材》第四章「刻家奇门」；本项目按下列规则实现，docs/CALIBER-NOTES.md 同步声明）：
 *   ① 刻长：一时辰十刻、一刻十二分钟；
 *   ② 刻柱：**时干起五子遁**顺排，第 n 刻 = 子位之干 +（n−1），支取子丑寅…酉（十位）；
 *   ③ 刻局：初刻 = 时家局数，此后阳遁 +1、阴遁 −1（九宫循环）；
 *   ④ 值符/值使：刻柱所在旬 → 旬首仪在地盘之宫 → 宫之星为值符、门为值使；
 *   ⑤ 天盘九星：值符随时落到「刻干（甲用旬首仪）在地盘之宫」，沿洛书地理环顺时针铺；
 *   ⑥ 人盘八门：值使门落宫按「自旬首仪所在宫起、按刻柱在旬中的位次数九宫」（阳顺阴逆、落中五寄坤二），
 *      与时家同一数宫法（《奇门宝鉴·释直符直使》「直使逆顺时支去……巡奇仪本元之遁宫」）；
 *      **刻支不作锚宫**——若锚刻支所在洛书宫，会与时家数宫法不一致、八门整盘错位；
 *      八门环内的铺展方向另随刻干阴阳（阳干顺、阴干逆，单源待考，可用参数 八门恒顺 改回恒顺）；
 *   ⑦ 神盘八神：自刻干宫起，阳遁顺、阴遁逆（随遁，不随刻干）；
 *   ⑧ 天盘干：星带本宫之仪；天禽随天芮同宫（该宫两干，禽干取中五地盘仪）。
 *
 * 文献状态（如实标注）：库内 18 部古籍无「刻家」起局法——《奇门遁甲统宗》虽见「丙寅夜子初二刻交
 *   夏至节」「卯初二度交夏至」等语，那是记时用语（把时辰细分为刻），不是刻家排盘法；《奇门宝鉴》
 *   全书亦无刻家篇。故本模块口径取自现代教材，属「近世整理，非古籍直证」，待考。
 *
 * 缺口（不臆造）：
 *   · 刻家框架实质单源（教材第四章，其余为镜像转载），无完整刻盘算例可分宫比对，故飞布仅自洽；
 *   · 八门顺逆随刻干阴阳属单源且原文无算例 → 照录但标「待验」，可用参数 八门恒顺 改回与时家一致；
 *   · 另有流派作「十分钟一刻、一时辰十二刻」并用飞盘九神，混排即错盘，本模块不并入。
 */

import {
  mysticGatesHourChart, STAR_RING, GATE_RING, STAR_HOME, DOOR_HOME,
  diPan, firstXunshou, TEN_DAY_LEADER, findHome, homeOf,
  rotateRingIn, arrangeGodsIn,
} from './hour-chart.js';

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const YANG_GAN = '甲丙戊庚壬';
/** 五子遁：时干 → 子位之干（甲己还加甲、乙庚丙作初、丙辛从戊起、丁壬庚子居、戊癸壬子） */
const FIVE_RAT_RULE = { 甲: '甲', 己: '甲', 乙: '丙', 庚: '丙', 丙: '戊', 辛: '戊', 丁: '庚', 壬: '庚', 戊: '壬', 癸: '壬' };
const KE_PER_HOUR = 10;
const MIN_PER_KE = 12;

/** 九宫一号循环（0 → 9） */
const w9 = (x) => { const v = x % 9; return v <= 0 ? v + 9 : v; };
/** 时支序号 0..11（23/0 时 = 子） */
const zhiIdxOfHour = (h) => Math.floor((((h + 1) % 24) / 2));
/** 时辰起点小时（子=23、丑=1、寅=3 … 亥=21） */
const hourStart = (h) => (zhiIdxOfHour(h) * 2 + 23) % 24;

/**
 * 第 n 刻的刻柱（时干起五子遁顺排，n 自 1 起，支取子~酉共十位）。
 * 校验例：丁亥时 → 1 刻庚子、2 刻辛丑、3 刻壬寅。
 */
export function keGanZhi(shiGan, n) {
  const g0 = FIVE_RAT_RULE[shiGan];
  if (!g0 || n < 1 || n > KE_PER_HOUR) return null;
  return STEMS[(STEMS.indexOf(g0) + (n - 1)) % 10] + BRANCHES[n - 1];
}

/** 宫号 → 本位九星（不含天禽，天禽寄天芮那宫取天芮） */
function starOfHome(g) {
  const hit = Object.keys(STAR_HOME).find((k) => STAR_HOME[k] === g);
  return hit || '';
}

/** 宫号 → 本位八门 */
function doorOfHome(g) {
  const hit = Object.keys(DOOR_HOME).find((k) => DOOR_HOME[k] === g);
  return hit || '';
}

/** 从时家盘取局数整数（兼容 '上元1局' 文本与 juNum 数字字段） */
function baseJuOf(base) {
  if (typeof base['juNum'] === 'number') return base['juNum'];
  const m = String(base['局'] || '').match(/(\d+)\s*局/);
  return m ? +m[1] : 1;
}

/** 由时辰内已过分钟定位第几刻（0–119 分，每 12 分一刻） */
export function keIndexOf(minute) {
  const m = Math.max(0, Math.min(119, minute | 0));
  return Math.floor(m / MIN_PER_KE) + 1;
}

/**
 * 沿洛书八宫环整体旋转铺环：锚位落 anchor，其余按环序铺开；rev 为真时反向铺。
 * @param {string[]} ring 环序
 * @param {string} anchor 锚（值符星 / 值使门）
 * @param {number} pal 锚落宫
 * @param {boolean} rev 是否反向
 */
function rotateRing(ring, anchor, pal, rev) {
  const out = {};
  let gi = CLOCK.indexOf(homeOf(pal));
  if (gi < 0) gi = 0;
  let ai = ring.indexOf(anchor);
  if (ai < 0) ai = 0;
  for (let j = 0; j < 8; j += 1) {
    const item = ring[(ai + j) % 8];
    const p = rev ? CLOCK[((gi - j) % 8 + 8) % 8] : CLOCK[(gi + j) % 8];
    out[p] = item;
  }
  out[2] = out[2] || ring[ai]; // 中五寄坤二兜底
  return out;
}

/** 八神：自 g 宫起，阳遁顺、阴遁逆，铺八实宫 */
function arrangeGods(g, yang) {
  const out = {};
  const gi = CLOCK.indexOf(g);
  for (let j = 0; j < 8; j += 1) {
    out[yang ? CLOCK[(gi + j) % 8] : CLOCK[((gi - j) % 8 + 8) % 8]] = GODS[j];
  }
  return out;
}

/**
 * 刻家奇门排盘。
 * @param {object} input {y,m,d,h,min?,局数?,八门恒顺?}
 */
export function mysticGatesQuarterChart(input) {
  const { y, m, d, h } = input;

  // 1) 底盘 = 本时辰的时家局（初刻的局数与地盘恒等于它，是自检锚）
  const baseInp = { y, m, d, h };
  if (input['局数'] != null && !Number.isNaN(+input['局数'])) baseInp['局数'] = +input['局数'];
  const base = mysticGatesHourChart(baseInp);
  if (base['err']) return base;
  const yang = base['遁'] === '阳遁';
  // 局数取整数字段：时家盘给的 '局' 是「上元1局」这种文本，真正的数字在 juNum
  const baseJu = baseJuOf(base);

  const 时柱 = base['干支']['时'];
  const 时干 = 时柱[0];

  // 2) 定位第几刻：距本时支起点的分钟数 ÷ 12
  const start = hourStart(h);
  const intoHour = Math.min(119, Math.max(0, ((h - start + 24) % 24) * 60 + (input['min'] != null ? (input['min'] | 0) : 0)));
  const n = keIndexOf(intoHour);
  const 刻柱 = keGanZhi(时干, n);
  if (!刻柱) return { err: '刻柱推算失败（时干「' + 时干 + '」不在十干内）' };
  const 刻干 = 刻柱[0], 刻支 = 刻柱[1];

  // 3) 刻局数：初刻 = 时家局，此后阳遁 +1、阴遁 −1
  const shift = n - 1;
  const ju = yang ? w9(baseJu + shift) : w9(baseJu - shift);

  // 4) 地盘（与时家同一份实现）
  const 地盘 = diPan(ju, yang);

  // 5) 值符值使：刻柱旬首 → 旬首仪在地盘宫 → 本位星/本位门
  const xun = firstXunshou(刻柱);
  const yi = TEN_DAY_LEADER[xun];
  const xunPal = findHome(地盘, yi);
  const xunHome = homeOf(xunPal);
  const 值符星 = starOfHome(xunHome);
  const 值使门 = doorOfHome(xunHome) || '死门';

  // 6) 天盘九星：值符落「刻干」在地盘之宫
  const 刻干仪 = 刻干 === '甲' ? yi : 刻干;
  const 刻干宫 = findHome(地盘, 刻干仪);
  const 天盘 = rotateRingIn(STAR_RING, 值符星, 刻干宫, false);

  // 7) 人盘八门：值使落宫与时家同一数宫法（旬首仪宫起、按刻柱在旬中位次数九宫，阳顺阴逆），
  //    因同属「奇仪本元之遁宫」的巡行（《奇门宝鉴·释直符直使》「直使逆顺时支去……巡奇仪本元之遁宫」）。
  //    ★ 刻支不作锚宫：若按「刻支所在洛书宫」定值使，会与时家的数宫法不一致、八门整盘错位。
  const 刻干阳 = YANG_GAN.indexOf(刻干) >= 0;
  const 旬内位次 = Math.max(0, STEMS.indexOf(刻干)); // 旬首必为甲，故刻干在十干中的位次即旬内位次
  // 值使落宫：旬首仪宫起、按刻干在旬中的位次数九宫（中五原值先留着，最后寄坤二）
  let 值使落宫 = xunPal;
  for (let k = 0; k < 旬内位次; k += 1) {
    值使落宫 = yang ? (值使落宫 % 9) + 1 : ((值使落宫 + 7) % 9) + 1;
  }
  if (值使落宫 === 5) 值使落宫 = 2; // 中五寄坤二
  const 门逆 = input['八门恒顺'] ? false : !刻干阳;
  const 八门 = rotateRingIn(GATE_RING, 值使门, 值使落宫, 门逆);

  // 8) 神盘八神：小值符随大值符，阳顺阴逆（随遁）
  const 八神 = arrangeGodsIn(刻干宫, yang);

  // 9) 天盘干：星带本宫之仪；天禽随天芮
  const S2H = {};
  for (const hp in STAR_HOME) S2H[STAR_HOME[hp]] = +hp;
  const 天盘干 = {};
  let 禽宫 = 0;
  for (const p in 天盘) {
    const st = 天盘[p];
    天盘干[p] = 地盘[homeOf(S2H[st] || 2)];
    if (st === '天芮') 禽宫 = +p;
  }

  // 10) 本时辰十刻一览
  const 一览 = [];
  for (let k = 1; k <= KE_PER_HOUR; k += 1) {
    一览.push({
      刻: k,
      刻柱: keGanZhi(时干, k),
      局数: yang ? w9(baseJu + (k - 1)) : w9(baseJu - (k - 1)),
      当前: k === n,
    });
  }

  return {
    四柱: base['四柱'],
    遁: base['遁'],
    时家局数: baseJu,
    刻序: n,
    刻干支: [刻干, 刻支],
    刻局数: ju,
    移宫: shift,
    旬首: xun,
    旬首仪: yi,
    旬首宫: xunPal,
    值符: 值符星,
    值使: 值使门,
    刻干宫,
    值使落宫,
    刻干阳,
    八门逆行: 门逆,
    地盘,
    天盘,
    八门,
    八神,
    天盘干,
    禽宫,
    禽干: 禽宫 ? 地盘[5] : null,
    十刻一览: 一览,
    缺口: [
      '刻家框架实质单源（库外《奇门遁甲预测学试行教材》第四章，其余为镜像转载），无完整刻盘算例可分宫比对，故飞布仅自洽、未外部锁死。',
      '八门顺逆：本模块取「随刻干阴阳」（阳刻顺、阴刻逆）。此条出自库外《奇门遁甲预测学试行教材》第四章，库内 18 部古籍无刻家篇、亦无刻盘算例可校，故列为单源待考；另一支「八门恒顺（一律顺铺）」可由参数 八门恒顺 切回，两说并存不合并。',
      '另一支刻家作「十分钟一刻、一时辰十二刻」并用飞盘九神，本模块不并入（混排即错盘）。',
      '刻家专用神煞与断辞未纳入。',
    ],
  };
}
