// 由 tools/build-mp.js 自 src/core/qimen/qimen-ri.js 生成，请勿手改
/**
 * src/core/qimen/qimen-ri.js —— 奇门遁甲·日家奇门（自研，零依赖）
 *
 * 大白话：日家奇门一天一局，不用时辰。以 60 日为一局轮（180 日一元轮），
 * 阳遁用 1/7/4 局、阴遁用 9/3/6 局，从「二至（冬至/夏至）前最近的甲子日」起算。
 * 价值与局限（如实声明）：日家流传版本多，本实现取通行口径：
 *   · 起算日 = 冬至（阳遁）/夏至（阴遁）前最近甲子日（含当日向前找）；
 *   · 局序：阳遁局 1（1-59 日）、7（60-119）、4（120-179）循环；阴遁 9/3/6；
 *   · 值符 = 日干所对应旬首仪；值使门 = 旬首仪落宫本位门，按日干距旬首位数转宫；
 *   · 天盘九星按「蓬任冲辅英芮柱心」环序（日家口径，天禽随天芮）；
 *   · 八神小值符随大值符（日干落宫），阳顺阴逆。
 * 分歧声明：另有「按节气分三元」的日家定元派，本实现取 180 日一元轮派（派别差异在文档注明）。
 */

const { dayGanZhiIndex, jieqiSeason } = require('../calendar/ganzhi.js');
const { jieqiTable } = require('../calendar/jieqi2.js');
const { GAN, ZHI, JIAZI } = require('../common/constants.js');
const { CLOCK, STAR_HOME, DOOR_HOME, GODS, GONG_DIR } = require('./qimen.js');

const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
const XUNSHOU = { 甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸' };

/** 日家天盘星环（蓬任冲辅英芮柱心，天禽随天芮） */
const RI_STAR_RING = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心'];

/**
 * 找 y 年冬至/夏至前最近的甲子日（日干支序 ≡ 0 mod 60）。
 */
function jiaziBefore(y, jqName) {
  const t = jieqiTable(y)[jqName];
  // jieqiTable 的冬至/夏至在同公历年；冬至 12 月、夏至 6 月
  let dn = dayGanZhiIndex(t.y, t.m, t.d);
  while (dn % 60 !== 0) dn--;
  return dn; // 甲子日序（相对 1970-01-01 锚的日干支序）
}

/** 布地盘 */
function dipan(j, yang) {
  const pan = {};
  for (let i = 0; i < 9; i++) {
    const gong = yang ? ((j - 1 + i) % 9) + 1 : (((j - 1 - i) % 9) + 9) % 9 + 1;
    pan[gong] = YI[i];
  }
  return pan;
}

/**
 * 日家奇门排盘。
 * @param {Object} input {y,m,d}
 */
function qimenRiChart(input) {
  const { y, m, d } = input;
  const gzIdx = dayGanZhiIndex(y, m, d);
  const dayGz = JIAZI[gzIdx];
  const dayGan = dayGz[0];

  // 定阴阳遁与起算甲子日：取距当日最近的「冬至/夏至起点」
  // 冬至起点（阳遁）：上年与本年冬至的甲子起点中 ≤ 当日者；夏至同。
  const dzStart = jiaziBefore(y, '冬至');       // 本年冬至前甲子（对应本年阳遁段起点）
  const dzStartPrev = jiaziBefore(y - 1, '冬至'); // 上年冬至前甲子
  const xzStart = jiaziBefore(y, '夏至');
  // 距当日最近的两个候选：上年冬至甲子（若当日 < 本年冬至甲子）与 本年夏至甲子
  let yang = true, start;
  if (gzIdx >= dzStart) { yang = true; start = dzStart; }
  else if (gzIdx >= xzStart) { yang = false; start = xzStart; }
  else { yang = true; start = dzStartPrev; }

  // 局：段内第 n 日（0 起），阳 1/7/4、阴 9/3/6，每 60 日一局
  const n = gzIdx - start;
  const seg = Math.floor(n / 60) % 3;
  const ju = yang ? [1, 7, 4][seg] : [9, 3, 6][seg];

  const dp = dipan(ju, yang);

  // 旬首：日干倒推甲日
  const xunGanZhi = JIAZI[(gzIdx - gzIdx % 10 + 60) % 60];
  const xunshouYi = XUNSHOU[xunGanZhi];
  let fuGong = 0;
  for (const g in dp) if (dp[g] === xunshouYi) fuGong = +g;
  if (fuGong === 5) fuGong = 2;
  const fuStar = Object.keys(STAR_HOME).find((k) => STAR_HOME[k] === fuGong);
  const fuDoor = Object.keys(DOOR_HOME).find((k) => DOOR_HOME[k] === fuGong);

  // 值符落宫：日干（甲用旬首仪）在地盘宫
  let zhiFuGong = fuGong;
  if (dayGan !== '甲') {
    for (const g in dp) if (dp[g] === dayGan) zhiFuGong = +g;
    if (zhiFuGong === 5) zhiFuGong = 2;
  }

  // 天盘：星环「蓬任冲辅英芮柱心」按值符平移（天禽随天芮）
  const starsPan = {};
  const delta = CLOCK.indexOf(zhiFuGong) - CLOCK.indexOf(fuGong);
  for (const s of RI_STAR_RING) {
    const home = STAR_HOME[s] === 5 ? 2 : STAR_HOME[s];
    const idx = CLOCK.indexOf(home);
    starsPan[CLOCK[(idx + delta % 8 + 8) % 8]] = s === '天芮' ? '天芮(禽)' : s;
  }
  const tianPanGan = {};
  for (const g in starsPan) {
    const s = starsPan[g].replace('(禽)', '');
    tianPanGan[g] = dp[STAR_HOME[s]];
  }

  // 值使门：日干距旬首甲的位数，沿 SEQ 转宫（阳顺阴逆，跳中五）
  const steps = gzIdx % 10; // 距甲子旬首……实际按日干在旬中位次：日干序-甲序
  const ganIdx = GAN.findIndex((g) => g.z === dayGan);
  const stepsReal = (ganIdx % 5); // 甲=0 乙=1 …（每旬 10 日按干序）
  // 简化口径：值使从本位宫按 stepsReal 步（阳顺阴逆）转宫，SEQ 同时家
  const SEQ = yang ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];
  let zhiShiGong = DOOR_HOME[fuDoor];
  let seqIdx = SEQ.indexOf(zhiShiGong);
  for (let i = 0; i < stepsReal; i++) {
    seqIdx = (seqIdx + (yang ? 1 : -1) + 9) % 9;
    let g = SEQ[seqIdx];
    if (g === 5) { seqIdx = (seqIdx + (yang ? 1 : -1) + 9) % 9; g = SEQ[seqIdx]; }
    zhiShiGong = g;
  }
  const doorsPan = {};
  const dDelta = CLOCK.indexOf(zhiShiGong) - CLOCK.indexOf(DOOR_HOME[fuDoor]);
  for (const door of Object.keys(DOOR_HOME)) {
    const idx = CLOCK.indexOf(DOOR_HOME[door]);
    doorsPan[CLOCK[(idx + dDelta % 8 + 8) % 8]] = door;
  }

  // 八神：小值符随大值符（日干落宫），阳顺阴逆
  const godsPan = {};
  const gIdx = CLOCK.indexOf(zhiFuGong);
  for (let i = 0; i < 8; i++) {
    const p = yang ? CLOCK[(gIdx + i) % 8] : CLOCK[((gIdx - i) % 8 + 8) % 8];
    godsPan[p] = GODS[i];
  }

  const cells = [];
  for (let g = 1; g <= 9; g++) {
    cells.push({ 宫: g, 方位: GONG_DIR[g], 天盘干: tianPanGan[g] || '', 地盘干: dp[g] || '', 星: starsPan[g] || '', 门: doorsPan[g] || '', 神: godsPan[g] || '' });
  }

  return {
    input,
    日干支: dayGz,
    遁: yang ? '阳遁' : '阴遁',
    局: `${ju}局`,
    旬首: xunGanZhi,
    值符: fuStar,
    值使: fuDoor,
    cells,
    口径: '日家 180 日一元轮派（阳 1/7/4、阴 9/3/6，二至前甲子起算）；天禽随天芮；另有节气分元派，见文档',
  };
}


module.exports.qimenRiChart = qimenRiChart;
