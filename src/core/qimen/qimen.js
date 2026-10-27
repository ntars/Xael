/**
 * src/core/qimen/qimen.js —— 奇门遁甲·时家转盘·拆补法（自研，零依赖）
 *
 * 大白话：奇门遁甲把时间装进九宫格（洛书），天盘九星、人盘八门、神盘八神
 * 分别在不同层上按规则转动，落定后的九宫格局就是排盘结果。
 *
 * 规则口径（通例，见 docs/CALIBER-NOTES.md）：
 *   · 阴阳遁：冬至~夏至前阳遁、夏至~冬至前阴遁（按交节日）；
 *   · 定局：节气定三元局数（表见 JUREQI），拆补法按「目标日前最近甲/己日=符头」，
 *     符头支 子午卯酉=上元、寅申巳亥=中元、辰戌丑未=下元；
 *   · 地盘：三奇六仪（戊己庚辛壬癸丁丙乙）自局数宫起，阳顺阴逆飞布九宫（中五宫照排，寄坤二只在落宫取值）；
 *   · 旬首：日干支所在旬 → 对应仪（甲子戊/甲戌己/甲申庚/甲午辛/甲辰壬/甲寅癸）；
 *   · 值符星=旬首仪所在地盘宫的本位星；值使门=该宫本位门；
 *   · 天盘：值符星随时干落宫，九星按环序整体旋转；门随值使按「时辰差」转宫；
 *   · 八神：值符起，阳遁顺、阴遁逆布八神；
 *   · 天盘干 = 星本位宫的地盘仪随星移动；
 *   · 23:00 晚子时日柱归次日（奇门口径），时柱五鼠遁随换日后日干重算。
 */

import { dayGanZhiIndex, hourGanZhi } from '../calendar/ganzhi.js';
import { jieqiTable } from '../calendar/jieqi2.js';
import { GAN, ZHI, JIAZI } from '../common/constants.js';

/** 九宫环序（顺时针）：坎1 艮8 震3 巽4 离9 坤2 兑7 乾6 */
export const CLOCK = [1, 8, 3, 4, 9, 2, 7, 6];

/** 星本位宫：蓬1 芮2 冲3 辅4 禽5 心6 柱7 任8 英9 */
export const STAR_HOME = { 天蓬: 1, 天芮: 2, 天冲: 3, 天辅: 4, 天禽: 5, 天心: 6, 天柱: 7, 天任: 8, 天英: 9 };
export const STAR_ORDER = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];

/** 门本位宫：休1 死2 伤3 杜4 开6 惊7 生8 景9 */
export const DOOR_HOME = { 休门: 1, 死门: 2, 伤门: 3, 杜门: 4, 开门: 6, 惊门: 7, 生门: 8, 景门: 9 };
export const DOOR_ORDER = ['休门', '死门', '伤门', '杜门', '开门', '惊门', '生门', '景门'];

/** 八神序（自值符起，阳顺阴逆） */
export const GODS = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];

/** 三奇六仪落宫序（九宫 1..9 → 仪序戊己庚辛壬癸丁丙乙） */
const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];

/** 六甲旬首 → 仪 */
const XUNSHOU = { '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸' };
/** JIAZI 是 ['甲','戌'] 这样的数组对，取键须拼成「甲戌」 */
const xunKey = (gz) => gz[0] + gz[1];

/** 节气定局表：[上, 中, 下]（阳遁为顺局数，阴遁同数值、符号由遁性定） */
export const JUREQI = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
  立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4],
  立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2],
  立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
};

/** 宫号 → 地支（值使门锚：时支所在洛书宫） */
const ZHI_GONG = { 子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6 };

/** 中五宫寄宫（落宫取值用） */
const HOME5 = 2;

/** 九宫洛书方位 */
export const GONG_DIR = { 1: '北', 8: '东北', 3: '东', 4: '东南', 9: '南', 2: '西南', 7: '西', 6: '西北', 5: '中' };

/**
 * 判断 y-m-d 所处节气与阴阳遁、三元局。
 * 节气归属：取 y-1/y/y+1 年节气表，找 ≤ 当日的最近节气（跨年安全）。
 */
function jieqiOf(y, m, d) {
  const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  let best = null;
  for (const yy of [y - 1, y, y + 1]) {
    const t = jieqiTable(yy);
    for (const k in t) {
      if (t[k].text <= target && (!best || t[k].text > best.date)) best = { 名: k, date: t[k].text };
    }
  }
  return best.名;
}

/**
 * 拆补定元：目标日前最近甲/己日为符头（含当日）。
 * @returns {0|1|2} 上/中/下元序
 */
function dayuanOf(y, m, d) {
  const dn0 = dayGanZhiIndex(y, m, d);
  let gz = dn0, back = 0;
  while (true) {
    const g = gz % 10, z = gz % 12;
    if (g === 0 && (z === 0 || z === 5)) break; // 甲子或甲己…… 甲干日（甲子/甲戌/甲申/甲午/甲辰/甲寅任意）或己日
    if (GAN[gz % 10].z === '甲' || GAN[gz % 10].z === '己') break;
    gz = (gz + 59) % 60; back++;
  }
  const zhi = ZHI[gz % 12].z;
  if (['子', '午', '卯', '酉'].includes(zhi)) return 0;
  if (['寅', '申', '巳', '亥'].includes(zhi)) return 1;
  return 2;
}

/** 布地盘：局数 j（1..9），阳遁顺、阴遁逆，自 j 宫起布 戊己庚辛壬癸丁丙乙 */
function dipan(j, yang) {
  const pan = {}; // 宫号(1..9) → 仪
  for (let i = 0; i < 9; i++) {
    const gong = yang ? ((j - 1 + i) % 9) + 1 : ((j - 1 - i) % 9 + 9) % 9 + 1;
    pan[gong] = YI[i];
  }
  return pan;
}

/** 环上宫序旋转：取 CLOCK 环（不含中五），home → offset 步 */
function rotateRing(homeGong, steps) {
  const idx = CLOCK.indexOf(homeGong);
  if (idx < 0) return homeGong;
  return CLOCK[(idx + steps % 8 + 8) % 8];
}

/**
 * 时家奇门排盘。
 * @param {Object} input {y,m,d,h}
 */
export function qimenChart(input) {
  const { y, m, d, h = 12 } = input;
  // 晚子归次日
  let yy = y, mm = m, dd = d, hh = h;
  if (h === 23) { // 日柱+1（简化：+1 日）
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    yy = next.getUTCFullYear(); mm = next.getUTCMonth() + 1; dd = next.getUTCDate();
  }
  const dayGzIdx = dayGanZhiIndex(yy, mm, dd);
  const dayGz = JIAZI[dayGzIdx];
  const hourGz = hourGanZhi(dayGz[0], hh);
  const hourGan = hourGz[0];
  const hourZhi = hourGz[1];

  // 定局
  const jq = jieqiOf(yy, mm, dd);
  const yang = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种'].includes(jq);
  const yuan = dayuanOf(yy, mm, dd);
  const ju = JUREQI[jq][yuan];

  // 地盘
  const dp = dipan(ju, yang);

  // 旬首：日干支 → 旬（甲干倒推）
  let xunGanZhi;
  {
    const off = dayGzIdx % 10; // 距甲的天数
    xunGanZhi = JIAZI[(dayGzIdx - off + 60) % 60];
  }
  const xunshouYi = XUNSHOU[xunKey(xunGanZhi)];

  // 值符星/值使门：旬首仪在地盘的宫
  let fuGong = 0;
  for (let g = 1; g <= 9; g++) if (dp[g] === xunshouYi) fuGong = g;
  if (fuGong === 5) fuGong = HOME5; // 中五寄坤二
  const fuStar = Object.keys(STAR_HOME).find((k) => STAR_HOME[k] === fuGong);
  const fuDoor = Object.keys(DOOR_HOME).find((k) => DOOR_HOME[k] === fuGong);

  // 值符随时干落宫：从旬首仪宫起，数到时干（甲=旬首仪）
  const hourGanOrder = (GAN.findIndex((g) => g.z === hourGan) - GAN.findIndex((g) => g.z === (xunshouYi === '戊' ? '甲' : xunshouYi)) + 10) % 10;
  // 实际口径：甲时用旬首仪；非甲时按「旬首干起 甲→时干」的天数在九宫飞（阳顺阴逆）？
  // 通行转盘法：值符星直接随时干——时干所在的地盘宫即值符落宫。
  let zhiFuGong = 0;
  if (hourGan === '甲' || hourGan === GAN[dayGzIdx % 10].z && false) zhiFuGong = fuGong;
  if (hourGan === '甲') {
    zhiFuGong = fuGong;
  } else {
    for (const g in dp) if (dp[g] === hourGan) zhiFuGong = +g;
    if (zhiFuGong === 5) zhiFuGong = HOME5;
  }
  if (!zhiFuGong) zhiFuGong = fuGong;

  // 九星转动：值符星 → zhiFuGong，其余星沿环序保持相对位置（不含中五；天禽寄天芮）
  const ringStars = STAR_ORDER.filter((s) => s !== '天禽');
  const starsPan = {}; // 宫 → 星
  const fuRingIdx = CLOCK.indexOf(zhiFuGong);
  const fuStarRingIdx = CLOCK.indexOf(fuGong);
  // 值符星原在 fuGong（环位 fuStarRingIdx），现移到 zhiFuGong（环位 fuRingIdx）→ 整体平移 delta
  const delta = fuRingIdx - fuStarRingIdx;
  for (const s of ringStars) {
    const home = STAR_HOME[s] === 5 ? HOME5 : STAR_HOME[s];
    const ringIdx = CLOCK.indexOf(home);
    if (ringIdx < 0) continue;
    const target = CLOCK[(ringIdx + delta % 8 + 8) % 8];
    starsPan[target] = s;
    if (s === '天芮') starsPan[target] = '天芮(禽)'; // 天禽寄天芮同宫
  }

  // 天盘干：星本位宫的地盘仪随星移动
  const tianPanGan = {};
  for (const g in starsPan) {
    const s = starsPan[g].replace('(禽)', '');
    tianPanGan[g] = dp[STAR_HOME[s]];
  }

  // 值使门转动：从值使门本位宫起，按「时支距旬首支的时辰数」阳顺阴逆转宫
  const xunZhiIdx = ZHI.findIndex((z) => z.z === xunGanZhi[1]);
  const hourZhiIdx = ZHI.findIndex((z) => z.z === hourZhi);
  let steps = (hourZhiIdx - xunZhiIdx + 12) % 12;
  const doorHome = DOOR_HOME[fuDoor];
  let zhiShiGong = doorHome;
  // 洛书宫跳转按「宫号数字序列 1..9（跳过中五占位）」阳顺阴逆（通行口径）
  const SEQ = yang ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];
  let seqIdx = SEQ.indexOf(doorHome);
  for (let i = 0; i < steps; i++) {
    seqIdx = (seqIdx + 1) % 9;
    let g = SEQ[seqIdx];
    if (g === 5) { seqIdx = (seqIdx + 1) % 9; g = SEQ[seqIdx]; }
    zhiShiGong = g;
  }
  // 八门整体沿环转：值使门 → zhiShiGong
  const doorsPan = {};
  const dDelta = CLOCK.indexOf(zhiShiGong) - CLOCK.indexOf(doorHome);
  for (const door of DOOR_ORDER) {
    const home = DOOR_HOME[door];
    const idx = CLOCK.indexOf(home);
    doorsPan[CLOCK[(idx + dDelta % 8 + 8) % 8]] = door;
  }

  // 八神：自值符宫（zhiFuGong）起，阳顺阴逆
  const godsPan = {};
  const gIdx = CLOCK.indexOf(zhiFuGong);
  for (let i = 0; i < 8; i++) {
    const p = yang ? CLOCK[(gIdx + i) % 8] : CLOCK[(gIdx - i % 8 + 8) % 8];
    godsPan[p] = GODS[i];
  }

  // 组九宫输出（1..9）
  const cells = [];
  for (let g = 1; g <= 9; g++) {
    cells.push({
      宫: g,
      方位: GONG_DIR[g],
      天盘干: tianPanGan[g] || '',
      地盘干: dp[g] || '',
      星: starsPan[g] || '',
      门: doorsPan[g] || '',
      神: godsPan[g] || '',
    });
  }

  return {
    input: { y, m, d, h },
    干支: { 日: dayGz, 时: hourGz },
    节气: jq,
    遁: yang ? '阳遁' : '阴遁',
    局: `${['上', '中', '下'][yuan]}元${ju}局`,
    旬首: xunGanZhi,
    值符: fuStar,
    值符宫: zhiFuGong,
    值使: fuDoor,
    地盘: dp,
    cells,
    口径: '时家转盘·拆补法；天禽寄天芮；中五寄坤二；晚子日柱归次日',
  };
}
