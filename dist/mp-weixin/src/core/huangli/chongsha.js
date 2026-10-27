// 由 tools/build-mp.js 自 src/core/huangli/chongsha.js 生成，请勿手改
/**
 * src/core/huangli/chongsha.js —— 冲煞（自研，零依赖）
 *
 * 大白话：黄历「冲猪(乙亥)煞东」表示当天与某个生肖相冲、该生肖的人诸事留意，
 * 同时「煞」指冲的方向（煞方）不宜动土。
 * 规则：地支六冲 = 子午、丑未、寅申、卯酉、辰戌、巳亥（相隔六位）。
 * 冲的干支 = 当日干支 + 6（六十甲子上直接 +6，干支同步相冲，即「天克地冲」前半规则
 *   ——甲子日冲庚午：干隔 30 位=相克位？通例：冲的干=日干+30%60？——通行黄历口径：
 *   冲的干支就是「日支+6」所在的那个甲子：其天干 = 日干序+6（甲子→庚午：甲0+6=庚✓）。
 * 煞方：申子辰日煞南、寅午戌日煞北、巳酉丑日煞东、亥卯未日煞西（三合局绝位）。
 */

const { dayGanZhiIndex } = require('../calendar/ganzhi.js');
const { GAN, ZHI, JIAZI } = require('../common/constants.js');

/** 煞方：按日支三合局 */
const SHA = { 申: '南', 子: '南', 辰: '南', 寅: '北', 午: '北', 戌: '北', 巳: '东', 酉: '东', 丑: '东', 亥: '西', 卯: '西', 未: '西' };

/** 生肖（随年柱/日支通用） */
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/**
 * 某日冲煞。
 * @returns {{冲, 冲生肖, 煞方}}
 */
function chongshaOf(y, m, d) {
  const idx = dayGanZhiIndex(y, m, d);
  const chongIdx = (idx + 6) % 60;
  const zhi = ZHI[idx % 12].z;
  return {
    冲: JIAZI[chongIdx],
    冲生肖: ZODIAC[idx % 12],
    煞方: SHA[zhi],
  };
}


module.exports.chongshaOf = chongshaOf;
module.exports.ZODIAC = ZODIAC;
