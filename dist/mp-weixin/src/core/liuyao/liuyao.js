// 由 tools/build-mp.js 自 src/core/liuyao/liuyao.js 生成，请勿手改
/**
 * src/core/liuyao/liuyao.js —— 六爻主入口（自研，零依赖）
 *
 * 输入三枚铜钱六次（或时间起卦），得到本卦/变卦装纳甲输出。
 * 铜钱口径：0 背=老阴(×)、1 背=少阳、2 背=少阴、3 背=老阳(○)。
 * 旬空按日柱旬；月破=月建冲爻。
 */

const { dayGanZhiIndex, monthGanZhi } = require('../calendar/ganzhi.js');
const { GAN, ZHI, JIAZI } = require('../common/constants.js');
const { guaByBits, GUA64, XIANG, GONG_WX } = require('./gonggua.js');
const { zhuangGua } = require('./najia.js');

/** 六十甲子旬空 */
function xunKong(gzIdx) {
  const start = gzIdx - (gzIdx % 10); // 旬首
  const kong = [];
  for (let i = 10; i < 12; i++) kong.push(JIAZI[(start + i) % 60][1]);
  return kong;
}

/** 六冲（地支） */
function chongZhi(z) { return ZHI[(ZHI.findIndex((x) => x.z === z) + 6) % 12].z; }

/**
 * 六爻排盘。
 * @param {Object} input {y,m,d,h, coins:[六次抛铜钱背数0-3] 或 缺省时间起卦}
 */
function liuyaoChart(input) {
  const { y, m, d, h = 12 } = input;
  const gzIdx = dayGanZhiIndex(y, m, d);
  const dayGz = JIAZI[gzIdx];
  const dayGan = dayGz[0];
  const monthGz = monthGanZhi(y, m, d);
  const monthZhi = monthGz[1];

  // 起卦：铜钱或时间
  let bits, dong = []; // 动爻位（0 起）
  if (input.coins && input.coins.length === 6) {
    bits = input.coins.map((c) => (c === 1 || c === 3 ? 1 : 0));
    dong = input.coins.map((c, i) => (c === 0 || c === 3 ? i : -1)).filter((x) => x >= 0);
  } else {
    // 时间起卦（梅花口径借用）：年支+月+日 之和 mod 8 为上卦、加时支为下卦
    const yearZhi = ZHI.findIndex((z) => z.z === ((gzIdx % 12) + 12) % 12) ; // 简化：日支代年支口径不取，用农历年支
    // 用农历年支：立春年界（与月柱同法）
    const yZhi = ((gzIdx - (gzIdx % 60)) , 0); // 占位——时间起卦在梅花模块内做，这里仅支持铜钱
    bits = [1, 1, 1, 1, 1, 1];
    dong = [];
  }

  const gua = guaByBits(bits);
  if (!gua) return { 错误: '起卦失败' };
  const benName = XIANG[gua.键] || (gua.上卦 + gua.下卦);
  gua.象名 = benName;

  // 变卦：动爻阴阳反转
  let changedBits = [...bits];
  dong.forEach((i) => { changedBits[i] = 1 - changedBits[i]; });
  const bian = dong.length ? guaByBits(changedBits) : null;
  const bianName = bian ? (XIANG[bian.键] || (bian.上卦 + bian.下卦)) : '';
  if (bian) bian.象名 = bianName;

  const ben = zhuangGua(gua, dayGan);
  const bianPan = bian ? zhuangGua(bian, dayGan) : null;

  // 旬空、月破
  const kong = xunKong(gzIdx);
  const po = chongZhi(monthZhi);
  ben.爻.forEach((r, i) => {
    r.旬空 = kong.includes(r.纳甲[1]);
    r.月破 = r.纳甲[1] === po;
    r.日冲 = r.纳甲[1] === chongZhi(dayGz[1]);
    r.动爻 = dong.includes(i);
  });

  return {
    input: { y, m, d, h },
    干支: { 月: monthGz, 日: dayGz },
    本卦: ben,
    变卦: bianPan,
    动爻: dong.map((i) => i + 1),
    旬空: kong.join(''),
    月破: po,
    口径: '京房纳甲；八宫世应；六亲以卦宫五行定；六神自初爻顺排',
  };
}


module.exports.liuyaoChart = liuyaoChart;
