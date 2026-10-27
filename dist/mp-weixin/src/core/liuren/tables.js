// 由 tools/build-mp.js 自 src/core/liuren/tables.js 生成，请勿手改
/**
 * src/core/liuren/tables.js —— 大六壬基础表（自研，零依赖）
 *
 * 月将表（中气换将）、日干寄宫、五行/克序、三刑、六冲、孟仲季等基础数据。
 */
const { ZHI } = require('../common/constants.js');
const { jieqiTable } = require('../calendar/jieqi2.js');

/** 月将表：中气 → 月将支（支序） */
const YUEJIANG = {
  雨水: 11, 春分: 10, 谷雨: 9, 小满: 8, 夏至: 7, 大暑: 6,
  处暑: 5, 秋分: 4, 霜降: 3, 小雪: 2, 冬至: 1, 大寒: 0,
};
const JIANG_NAME = ['神后(子)', '大吉(丑)', '功曹(寅)', '太冲(卯)', '天罡(辰)', '太乙(巳)', '胜光(午)', '小吉(未)', '传送(申)', '从魁(酉)', '河魁(戌)', '登明(亥)'];

/** 日干寄宫（支序）：甲寅 乙辰 丙巳 戊巳 丁未 己未 庚申 辛戌 壬亥 癸丑 */
const JIGONG = [2, 4, 5, 5, 7, 7, 8, 10, 11, 0];

/** 五行（干序/支序）：0木1火2土3金4水 */
const GAN_WX = [0, 1, 2, 0, 3, 2, 3, 4, 1, 4];
const ZHI_WX = [3, 2, 0, 0, 2, 1, 1, 2, 2, 3, 2, 4];
const KE_BY = { 0: 2, 1: 4, 2: 3, 3: 0, 4: 1 }; // x 克的对象

/** 孟仲季：寅申巳亥=孟、子午卯酉=仲、辰戌丑未=季 */
function mengZhongJi(z) { return [2, 5, 8, 11].includes(z) ? 0 : [0, 6, 3, 9].includes(z) ? 1 : 2; }

/** 三刑取刑支序 */
function xingTarget(z) {
  const name = ZHI[z].z;
  const tgt = { 寅: '巳', 巳: '申', 申: '寅', 丑: '戌', 戌: '未', 未: '丑', 子: '卯', 卯: '子', 辰: '辰', 午: '午', 酉: '酉', 亥: '亥' }[name];
  return ZHI.findIndex((x) => x.z === tgt);
}
function isZiXing(z) { return ['辰', '午', '酉', '亥'].includes(ZHI[z].z); }

/** 六冲 */
function chongOf(z) { return (z + 6) % 12; }

/** 五行相克 */
function ke(a, b) { return KE_BY[a] === b; }
function beiKe(a, b) { return KE_BY[b] === a; }

/** 月将：找 ≤ 当日的最近中气，返回月将支序 */
function yueJiangOf(y, m, d) {
  const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  let best = null;
  for (const yy of [y - 1, y]) {
    const t = jieqiTable(yy);
    for (const k in YUEJIANG) {
      if (t[k].text <= target && (!best || t[k].text > best.date)) best = { 名: k, date: t[k].text };
    }
  }
  return YUEJIANG[best.名];
}


module.exports.mengZhongJi = mengZhongJi;
module.exports.xingTarget = xingTarget;
module.exports.isZiXing = isZiXing;
module.exports.chongOf = chongOf;
module.exports.ke = ke;
module.exports.beiKe = beiKe;
module.exports.yueJiangOf = yueJiangOf;
module.exports.YUEJIANG = YUEJIANG;
module.exports.JIANG_NAME = JIANG_NAME;
module.exports.JIGONG = JIGONG;
module.exports.GAN_WX = GAN_WX;
module.exports.ZHI_WX = ZHI_WX;
module.exports.KE_BY = KE_BY;
