// 由 tools/build-mp.js 自 src/core/liuren/liuren.js 生成，请勿手改
/**
 * src/core/liuren/liuren.js —— 大六壬·时家（月将加占时）主入口（自研，零依赖）
 *
 * 组装：tables（月将/寄宫）→ 天地盘/四课 → fayong（九宗门三传）→ tianjiang（天将）。
 * 口径：月将中气换；23 时夜子归当日（六壬恒自然日柱）；涉害深数不计藏干。
 */

const { dayGanZhiIndex, hourGanZhi } = require('../calendar/ganzhi.js');
const { GAN, ZHI, JIAZI } = require('../common/constants.js');
const { yueJiangOf, JIANG_NAME, JIGONG } = require('./tables.js');
const { faSanChuan } = require('./fayong.js');
const { guirenIdx, buTianJiang } = require('./tianjiang.js');

/**
 * 六壬排盘。
 * @param {Object} input {y,m,d,h}
 */
function liurenChart(input) {
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
  for (let x = 0; x < 12; x++) tian[x] = (x + M - T) % 12;

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


module.exports.liurenChart = liurenChart;
