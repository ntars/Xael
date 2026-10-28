/**
 * src/core/qimen/nianyue.js —— 奇门遁甲·年家与月家（自研，零依赖）
 *
 * 大白话：年家奇门一年一局、月家一月一局，用来做长周期的择时（选年份、选月份）。
 *
 * 口径来源（本门古籍说得比日家/刻家更清楚，逐条落地）：
 *   《奇門遁甲統宗》卷二「附年奇門起例」「附月奇門起例」——
 *   【年奇門起例】「上元甲子六十年用陰遁一局，中元甲子六十年用陰遁四局，下元甲子六十年用陰遁七局。
 *     皆以其年旬首所值之門為值使，所值之星為值符，看其年支臨於地盤何宮，即以天盤值使加之；
 *     看其年干臨於地盤何宮，即以天盤值符加之。……共一百八十年為一週，用逆不用順者……」
 *   【月奇門起例】「甲子至戊辰、己卯至癸未、甲午至戊戌、己酉至癸丑為上元二十年，用陰遁一局；
 *     己巳至癸酉、甲申至戊子、己亥至癸卯、甲寅至戊午為中元二十年，用陰遁四局；
 *     甲戌至戊寅、己丑至癸巳、甲辰至戊申、己未至癸亥為下元二十年，用陰遁七局。……
 *     看月建之支臨於地盤何宮，即以天盤值使加之；看月建之干臨於地盤何宮，即以天盤值符加之。」
 *
 * 由此得到三条硬规矩（年家、月家共用同一套骨架）：
 *   ① 局数只取 1 / 4 / 7，**一律阴遁**（不分年支阴阳）；
 *   ② 「值符随干、值使随支」——干在地盘哪宫，天盘值符星就加临那宫；支在地盘哪宫，天盘值使门就加临那宫；
 *   ③ 八神「加於天蓬逆轉」——阴遁一律逆排，小值符随大值符。
 *
 * 两处原书没写死后人的落实方式（如实标注，不假称已锁）：
 *   · 年家三元起点：取「三元九运」通行纪年，上元甲子=1864、中元=1924、下元=1984（三源一致）。
 *     干支年按立春归属，所以与公历年表述会差几天。
 *   · 月家定元：按《統宗》字面「月柱六十甲子序 mod 15」分三元（每 5 个月一组、三组一气、15 月一轮）。
 *     另有「按年支四孟/四仲/四季定元」一派，其内部对孟仲季与 1/4/7 局的对应互不一致，本项目不采。
 *
 * 缺口（不假报已锁）：
 *   · 「年支/月支临地盘何宫」原书只给算例（乙丑年丑在離九），与通行地支宫位映射（丑→艮八）不符，
 *     未给一般规则。本项目统一采通行映射 ZHI_GONG，与日家/时家/刻家保一张表。
 *   · 中五本位星定名分歧不影响落宫：本项目取中五本位天芮、天禽寄坤二（与时家同表）。
 *
 * 数据：无第三方依赖，全部常数来自 common/constants.js 与 qimen.js（单一真源）。
 */

import {
  CLOCK, STAR_HOME, STAR_RING, GATE_RING, GODS, XUNSHOU, ZHI_GONG,
  diPan, firstXunshou, findHome, homeOf, rotateRingIn, arrangeGodsIn,
} from './qimen.js';
import { JIAZI } from '../common/constants.js';
import { yearGanZhiByLichun, monthGanZhi } from '../calendar/ganzhi.js';
import { jieqiTable } from '../calendar/jieqi2.js';

/** 三元局数：上元 1 / 中元 4 / 下元 7（原书三处枚举一致） */
const NIAN_JU = [1, 4, 7];
/** 三元名 */
const YUAN_NAME = ['上元', '中元', '下元'];
/** 上元甲子年（三元九运通行纪年，1864 甲子） */
const NIAN_ANCHOR = 1864;

/** 门名表：qimen.js 的 GATE_RING 里已是「休门」等全名，这里只做「开门→开」的短名对照 */
const GATE_HOME_OF = {};
GATE_RING.forEach((g) => { GATE_HOME_OF[g] = g; });

/** 六十甲子序号（数组项是 [干,支]） */
function jiaziIndexOf(gz) {
  const key = gz[0] + gz[1];
  for (let i = 0; i < JIAZI.length; i += 1) {
    if (JIAZI[i][0] + JIAZI[i][1] === key) return i;
  }
  return 0;
}

/**
 * 干支年（立春换年）对应的公历年。
 * 大白话：立春之前还算上一年，所以 1 月出生的人年柱属前一干支年。
 */
function ganzhiYearNum(y, m, d) {
  const lc = jieqiTable(y)['立春'];
  if (!lc) return y;
  return (m > lc.m || (m === lc.m && d >= lc.d)) ? y : y - 1;
}

/** 年家三元：180 年一周，60 年一元 */
function nianYuanOf(y, m, d) {
  const gy = ganzhiYearNum(y, m, d);
  const period = ((gy - NIAN_ANCHOR) % 180 + 180) % 180;
  const idx = period < 60 ? 0 : period < 120 ? 1 : 2;
  return { 元序: idx, 元: YUAN_NAME[idx], 局数: NIAN_JU[idx], 干支年: gy, 距上元: period };
}

/** 月家三元：月柱六十甲子序 mod 15 分三元（《統宗》字面） */
function yueYuanOf(yueGz) {
  const i = jiaziIndexOf(yueGz);
  const idx = Math.floor((i % 15) / 5);
  return { 元序: idx, 元: YUAN_NAME[idx], 局数: NIAN_JU[idx], 月柱序: i, 模15: i % 15 };
}

/**
 * 公共排盘：年家/月家骨架完全相同，只有「时间单位」与「定元依据」不同。
 * @param {number} ju 局数（1/4/7，全阴遁）
 * @param {string} gz 该级干支（年柱 'X甲辰' 或月柱 '丙子'，均为两字串）
 */
function paiPan(ju, gz) {
  const gan = gz.slice(0, 1);
  const zhi = gz.slice(1, 2);
  const pan = diPan(ju, false); // 阴遁地盘：六仪逆布、三奇顺飞

  // 旬首：取干支所在旬
  const xun = firstXunshou(gz);
  const yi = XUNSHOU[xun];
  const xunGong = findHome(pan, yi); // 旬首仪在地盘哪宫

  // 值符星 / 值使门：由旬首落宫的「本位星、本位门」定
  const homeGong = homeOf(xunGong);
  const fuStar = STAR_RING.find((s) => STAR_HOME[s] === homeGong)
    || STAR_RING.find((s) => STAR_HOME[s] === 2) || '天芮';
  const fuDoor = GATE_RING.find((g) => GATE_HOME_OF[g] && gateHomeOf(g) === homeGong) || '死门';

  // 值符随「干」：干在地盘之宫（干为甲时用旬首仪代替）
  const ganYi = gan === '甲' ? yi : gan;
  const ganGong = findHome(pan, ganYi);
  // 值使随「支」：支按统一地支宫位映射落宫
  const zhiGong = homeOf(ZHI_GONG[zhi]);

  // 天盘九星：不管阴遁阳遁，九星都顺时针铺
  const tianPan = rotateRingIn(STAR_RING, fuStar, ganGong, false);
  // 八门：阴遁逆铺
  const baMen = rotateRingIn(GATE_RING, fuDoor, zhiGong, true);
  // 八神：全阴遁一律逆排，小值符随大值符
  const baShen = arrangeGodsIn(ganGong, false);

  // 天盘干：星带本宫地盘干；天禽与天芮同宫
  const starToHome = {};
  Object.keys(STAR_HOME).forEach((k) => { starToHome[STAR_HOME[k]] = +k; });
  const tianGan = {};
  let qinGong = 0;
  Object.keys(tianPan).forEach((p) => {
    const st = tianPan[p];
    const h = homeOf(starToHome[st] || 2);
    tianGan[p] = pan[h];
    if (st === '天芮') qinGong = +p;
  });

  return {
    干支: gz,
    干: gan,
    支: zhi,
    局数: ju,
    旬首: xun,
    旬首仪: yi,
    旬首宫: xunGong,
    值符星: fuStar,
    值使门: fuDoor,
    干宫: ganGong,
    支宫: zhiGong,
    地盘: pan,
    天盘: tianPan,
    八门: baMen,
    八神: baShen,
    天盘干: tianGan,
    禽宫: qinGong,
    禽干: qinGong ? pan[5] : null,
  };
}

/** 门的本位宫（休坎一、死坤二、伤震三、杜巽四、开乾六、惊兑七、生艮八、景离九） */
function gateHomeOf(door) {
  const map = { 休门: 1, 死门: 2, 伤门: 3, 杜门: 4, 开门: 6, 惊门: 7, 生门: 8, 景门: 9 };
  return map[door] || 0;
}

/** 公共口径说明（年家/月家输出都会带上，避免用户只看到局数不知道为什么） */
const GAP_COMMON = [
  '年支/月支「临于地盘何宫」原书只给算例（乙丑年丑在離九），与通行地支宫位映射（丑→艮八）不符，未给一般规则；本项目统一采通行映射，与日家/时家/刻家同一张表。',
  '中五本位星定名不影响落宫：本项目取中五本位为天芮、天禽寄坤二（与时家同表）。',
  '八门铺法分歧：本项目按与时家同一的环序铺开（值使落宫后沿八门固定环序顺排），另有「伏吟各归本宫」一派，不合并。',
];

/**
 * 年家奇门：一年一局。
 * @param {{y:number,m:number,d:number}} input
 */
export function qimenNianChart(input) {
  const { y, m, d } = input;
  const nianZhu = yearGanZhiByLichun(y, m, d, 12);
  const yu = nianYuanOf(y, m, d);
  const P = paiPan(yu.局数, nianZhu);
  return {
    日期: `${y}年${m}月${d}日`,
    年干支: nianZhu,
    干支年: yu.干支年,
    元: yu.元,
    遁: '阴遁',
    局: `${yu.局数}局`,
    距上元: yu.距上元,
    cells: cellsOf(P),
    ...P,
    口径: [
      '年家定元采三元九运通行纪年：上元甲子=1864、中元=1924、下元=1984（三源一致），180 年一周；三元局数 1/4/7 一律阴遁。',
      '值符随年干、值使随年支，八神加于值符逆排——《奇門遁甲統宗》年奇门起例。',
      ...GAP_COMMON,
    ],
  };
}

/**
 * 月家奇门：一月一局。
 * @param {{y:number,m:number,d:number}} input
 */
export function qimenYueChart(input) {
  const { y, m, d } = input;
  const yueZhu = monthGanZhi(y, m, d, 12); // 节气月柱
  const yu = yueYuanOf(yueZhu);
  const P = paiPan(yu.局数, yueZhu);
  const zhi = yueZhu[1];
  const monthOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'].indexOf(zhi) + 1;
  return {
    日期: `${y}年${m}月${d}日`,
    月干支: yueZhu,
    月序: `正月起第 ${monthOrder} 位（按节气月）`,
    月柱序: yu.月柱序,
    模15: yu.模15,
    元: yu.元,
    遁: '阴遁',
    局: `${yu.局数}局`,
    cells: cellsOf(P),
    ...P,
    口径: [
      '月家定元采《奇門遁甲統宗》月奇门起例：按月柱六十甲子序 mod 15 分三元（每 5 个月一组、三组一气、15 月一轮），三元局数 1/4/7 一律阴遁。',
      '值符随月干、值使随月支，八神逆排。',
      ...GAP_COMMON,
    ],
  };
}

/** 把对象盘摊成「逐宫一行」的数组，供出料层与对拍统一取用（中五单列） */
function cellsOf(P) {
  const gongs = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return gongs.map((g) => ({
    宫: g,
    地盘干: P.地盘[g] || '',
    天盘干: P.天盘干[g] || '',
    星: P.天盘[g] || (g === 5 ? '天禽' : ''),
    门: P.八门[g] || (g === 5 ? '中宫无门' : ''),
    神: P.八神[g] || '',
  }));
}
