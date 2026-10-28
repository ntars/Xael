/**
 * src/core/liuren/liuren.js —— 大六壬·时家（月将加占时）主入口（自研，零依赖）
 *
 * 组装：tables（月将/寄宫）→ 天地盘/四课 → fayong（九宗门三传）→ tianjiang（天将）。
 * 口径：月将中气换；23 时夜子归当日（六壬恒自然日柱）；涉害深数不计藏干。
 */

import { dayGanZhiIndex, hourGanZhi } from '../calendar/ganzhi.js';
import { GAN, ZHI, JIAZI } from '../common/constants.js';
import { yueJiangOf, JIANG_NAME, JIGONG, yimaOf, GAN_WX, ZHI_WX } from './tables.js';
import { faSanChuan } from './fayong.js';
import { guirenIdx, buTianJiang } from './tianjiang.js';
import {
  xunshouOf, xunKong, dunGanOf, isLianru, tianmaOf, guXuOf, yingqiOf, gzText,
} from './detail.js';
import { monthZhiIndex } from '../calendar/ganzhi.js';

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
  // 月将按「中气 + 交节小时」换将（六壬铁律），故把占时小时一并传入
  const M = yueJiangOf(y, m, d, h);

  // 天盘：月将加占时（天盘[占时支位]=月将）
  const tian = [];
  // 天盘位 = (地盘位 + 月将 − 占时) mod 12，必须做 12 的负模归一（否则 M<T 时出负数下标）
  for (let x = 0; x < 12; x++) tian[x] = ((x + M - T) % 12 + 12) % 12;

  // 四课：①干阳（日干寄宫起）②干阴（干上神再上一层）③支阳（日支起）④支阴（支上神再上一层）。
  // 判克时第一课的「位」按日干五行算，不看寄宫支——故这里把 isGan 标记带上，交给 fayong 用。
  const dayGanIdx = GAN.findIndex((g) => g.z === dayGan);
  const jigong = JIGONG[dayGanIdx];
  const dayZhiIdx = ZHI.findIndex((z) => z.z === dayZhi);
  // ★ 注意：tian[] 的下标 = 地盘支序号，值是**天盘支序号**（不是字符串）。
  //   所以「上神之上神」必须写 tian[tian[位]]，早前误把支序号当地支下标查表，一过卯就错。
  const siKe = [
    { 位: jigong, 上: tian[jigong], isGan: true },
    { 位: tian[jigong], 上: tian[tian[jigong]] },
    { 位: dayZhiIdx, 上: tian[dayZhiIdx] },
    { 位: tian[dayZhiIdx], 上: tian[tian[dayZhiIdx]] },
  ];

  // 九宗门发三传
  const { 三传, 发用, 课体 } = faSanChuan({ tian, siKe, dayGan, dayGanIdx, dayZhiIdx, M, T });

  // 三传细分：旬空 / 驿马 / 遁干 / 连茹 / 天马 / 孤虚 / 应期
  const dayGzText = gzText(dayGz);
  const 旬首 = xunshouOf(dayGzText);
  const 空亡 = xunKong(dayGzText);
  const 遁干 = dunGanOf(三传, dayGzText);

  // 天将
  const isNight = [9, 10, 11, 0, 1, 2].includes(T);
  const gui = guirenIdx(dayGan, isNight);
  const jiangOnTian = buTianJiang(gui);

  return {
    input: { y, m, d, h },
    干支: { 日: dayGz, 时: hourGz },
    月将: { 序: M, 名: JIANG_NAME[M] },
    天地盘: tian.map((x, i) => ({ 地盘: ZHI[i].z, 天盘: ZHI[x].z })),
    四课: siKe.map((c, i) => ({
      课: i + 1,
      位: ZHI[c.位] ? ZHI[c.位].z : '',
      上: ZHI[c.上].z,
      课位五行: (c.isGan || i === 0) ? ['木', '火', '土', '金', '水'][GAN_WX[dayGanIdx]] : ['木', '火', '土', '金', '水'][ZHI_WX[c.位 % 12]],
    })),
    三传: 三传.map((z, i) => ({ 传: ['初', '中', '末'][i], 支: ZHI[z] ? ZHI[z].z : '', 天将: jiangOnTian[z] || '', 遁干: '' })),
    发用,
    课体: 课体 || '',
    昼夜: isNight ? '夜' : '昼',
    贵人: ZHI[gui].z,
    // 十二天将：与旧版同结构 {贵人,昼夜,顺逆,将:{支:将名}}，便于逐字比对
    十二天将: {
      贵人: ZHI[gui].z,
      昼夜: isNight ? '夜' : '昼',
      顺逆: [11, 0, 1, 2, 3, 4].includes(gui) ? '顺' : '逆',
      // 按布将方向列：顺布自贵人起顺行十二支，逆布自贵人起逆行十二支（与旧版逐字同序）
      将: Array.from({ length: 12 }, (_, i) => {
        const shun = [11, 0, 1, 2, 3, 4].includes(gui);
        const pos = shun ? (gui + i) % 12 : ((gui - i) % 12 + 12) % 12;
        return ZHI[pos].z;
      }).reduce((acc, z) => { acc[z] = jiangOnTian[ZHI.findIndex((x) => x.z === z)]; return acc; }, {}),
    },
    旬首,
    旬空: 空亡.map((z) => ZHI[z].z),
    驿马: ZHI[yimaOf(dayZhiIdx)].z,
    天马: tianmaOf(dayZhiIdx, 三传),
    三传遁干: 遁干,
    连茹: isLianru(三传),
    孤虚: guXuOf(dayZhiIdx, monthZhiIndex(y, m, d, h, input.minute)),
    应期: yingqiOf(三传),
    口径: '时家六壬；月将中气换；涉害深数不计藏干；23时夜子归当日',
  };
}
