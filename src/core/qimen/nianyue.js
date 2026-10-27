/**
 * src/core/qimen/nianyue.js —— 奇门遁甲·年家与月家（自研，零依赖）
 *
 * 大白话：年家奇门一年一局、月家一月一局，用于长周期择时（择年、择月）。
 * 通行作法（本项目采用，并在输出注明）：
 *   · 年家：以上元甲子起「阳遁一局」，六十年一周；每 60 年进制上元（阴阳遁转换）。
 *     本项目取通行「三元九运」压缩口径：局数 = ((年 - 1864) mod 60) 映射到 1–9 局，
 *     年支属阳（子寅辰午申戌）用阳遁、属阴用阴遁；
 *   · 月家：以当年「节气月」（寅月=立春起）为序，正月起 8 局、逐月递推；
 *     月干的遁法用五虎遁，月支为节气月支。
 * 分歧：年家另有「按元会运世」分派的定局法，本项目不一并实现。
 */

import { qimenChart } from './qimen.js';
import { JIAZI, GAN, ZHI } from '../common/constants.js';
import { yearGanZhiByLichun, monthGanZhi, jieqiSeason } from '../calendar/ganzhi.js';
import { jieqiTable } from '../calendar/jieqi2.js';

/** 阳支判定 */
const YANG_ZHI = ['子', '寅', '辰', '午', '申', '戌'];

/** 年家干支（立春换年） */
function yearGz(y, m, d) {
  return yearGanZhiByLichun(y, m, d);
}

/** 布一个「通用九宫盘」：给局数与阴阳遁、值符值使，按标准地盘仪序布 */
function simplePan(ju, yang, fuStar = '天心', fuDoor = '开门') {
  // 六仪三奇地盘：戊己庚辛壬癸丁丙乙 自局数宫顺/逆排
  const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  const order = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const 地盘 = {};
  for (let i = 0; i < 9; i++) {
    const gong = yang ? order[(ju - 1 + i) % 9] : order[((ju - 1 - i) % 9 + 9) % 9];
    地盘[gong] = YI[i];
  }
  return { 遁: yang ? '阳遁' : '阴遁', 局: `${ju}局`, 值符: fuStar, 值使: fuDoor, 地盘 };
}

/**
 * 年家奇门。
 * @param {object} input {y,m,d}
 */
export function qimenNianChart(input) {
  const { y, m, d } = input;
  const gz = yearGz(y, m, d);
  const zhi = gz[1];
  const yang = YANG_ZHI.includes(zhi);
  // 通行口径：以 1864（甲子）年为上元起始，60 年一周，局数 1–9 循环
  const offset = ((y - 1864) % 180 + 180) % 180;
  const ju = (offset % 9) + 1;
  const pan = simplePan(ju, yang);
  return {
    年干支: gz,
    遁: pan.遁,
    局: pan.局,
    地盘: pan.地盘,
    口径: '年家取「三元 180 年、局数 1–9 循环」通行口径，阳支年阳遁、阴支年阴遁；另有元会运世派，本项目不一并实现。',
  };
}

/**
 * 月家奇门。
 * @param {object} input {y,m,d}
 */
export function qimenYueChart(input) {
  const { y, m, d } = input;
  const gz = monthGanZhi(y, m, d); // 节气月柱
  const zhi = gz[1];
  const monthOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'].indexOf(zhi) + 1;
  const yearGz2 = yearGanZhiByLichun(y, m, d);
  const yearYang = GAN.find((g) => g.z === yearGz2[0]).yy === 0;
  const yang = yearYang;
  // 通行作法：正月起 8 局，逐月递推 8,7,6,5,4,3,2,1,9,8,7,6
  const ju = ((8 - (monthOrder - 1) - 1 + 12 * 10) % 9) + 1;
  const pan = simplePan(ju, yang);
  return {
    月干支: gz,
    月序: `正月起第 ${monthOrder} 位（按节气月）`,
    遁: pan.遁,
    局: pan.局,
    地盘: pan.地盘,
    口径: '月家取「正月 8 局、逐月递减」通行口径，阴阳遁随年干阴阳；流派分歧见 docs/CALIBER-NOTES.md。',
  };
}
