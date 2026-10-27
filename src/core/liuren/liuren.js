/**
 * src/core/liuren/liuren.js —— 大六壬·时家（月将加占时）主入口（自研，零依赖）
 *
 * 组装：tables（月将/寄宫）→ 天地盘/四课 → fayong（九宗门三传）→ tianjiang（天将）。
 * 口径：月将中气换；23 时夜子归当日（六壬恒自然日柱）；涉害深数不计藏干。
 */

import { dayGanZhiIndex, hourGanZhi } from '../calendar/ganzhi.js';
import { GAN, ZHI, JIAZI } from '../common/constants.js';
import { yueJiangOf, JIANG_NAME, JIGONG } from './tables.js';
import { faSanChuan } from './fayong.js';
import { guirenIdx, buTianJiang } from './tianjiang.js';

/**
 * 六壬排盘。
 * @param {Object} input {y,m,d,h}
 */
export function liurenChart(input) {
  const { y, m, d, h = 12 } = input;
  const gzIdx = dayGanZhiIndex(y, m, d); // 23 时归当日（六壬口径）
  const dayGz = JIAZI[gzIdx];
  const dayGan = dayGz[0], dayZhi = dayGz[1];
  const hourGz = hourGanZhi(dayGz[0], h);
  const hourZhi = hourGz[1];
  const T = ZHI.findIndex((z) => z.z === hourZhi);
  const M = yueJiangOf(y, m, d);

  // 天盘：月将加占时（天盘[占时支位]=月将）
  const tian = [];
  // 天盘位 = (地盘位 + 月将 − 占时) mod 12，必须做 12 的负模归一（否则 M<T 时出负数下标）
  for (let x = 0; x < 12; x++) tian[x] = ((x + M - T) % 12 + 12) % 12;

  // 四课
  const dayGanIdx = GAN.findIndex((g) => g.z === dayGan);
  const jigong = JIGONG[dayGanIdx];
  const dayZhiIdx = ZHI.findIndex((z) => z.z === dayZhi);
  const siKe = [
    { 位: jigong, 上: tian[jigong] },
    { 位: tian[jigong], 上: tian[tian[jigong]] },
    { 位: dayZhiIdx, 上: tian[dayZhiIdx] },
    { 位: tian[dayZhiIdx], 上: tian[tian[dayZhiIdx]] },
  ];

  // 九宗门发三传
  const { 三传, 发用 } = faSanChuan({ tian, siKe, dayGan, dayGanIdx, dayZhiIdx, M, T });

  // 天将
  const isNight = [9, 10, 11, 0, 1, 2].includes(T);
  const gui = guirenIdx(dayGan, isNight);
  const jiangOnTian = buTianJiang(gui);

  return {
    input: { y, m, d, h },
    干支: { 日: dayGz, 时: hourGz },
    月将: { 序: M, 名: JIANG_NAME[M] },
    天地盘: tian.map((x, i) => ({ 地盘: ZHI[i].z, 天盘: ZHI[x].z })),
    四课: siKe.map((c, i) => ({ 课: i + 1, 位: ZHI[c.位] ? ZHI[c.位].z : '', 上: ZHI[c.上].z })),
    三传: 三传.map((z, i) => ({ 传: ['初', '中', '末'][i], 支: ZHI[z] ? ZHI[z].z : '', 天将: jiangOnTian[z] || '', 遁干: '' })),
    发用,
    昼夜: isNight ? '夜' : '昼',
    贵人: ZHI[gui].z,
    口径: '时家六壬；月将中气换；涉害深数不计藏干；23时夜子归当日',
  };
}
