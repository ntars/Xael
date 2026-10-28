/**
 * src/core/huangli/chongsha.js —— 冲煞（自研，零依赖）
 *
 * 大白话：黄历「冲羊(辛未)煞东」表示当天与某个生肖相冲、该生肖的人诸事留意，
 * 同时「煞」指冲的方向（煞方）不宜动土。
 *
 * 口径（与参照黄历逐字一致，已用全样本探测校准）：
 *   · 地支六冲 = 子午、丑未、寅申、卯酉、辰戌、巳亥（相隔六位）；
 *   · 冲干 = 日干序 + 4（甲子→戊午、丁丑→辛未、乙丑→己未）——
 *     不是「干支同 +6 的天克地冲」写法，通行黄历的冲干走 +4；
 *   · 煞方：申子辰日煞南、寅午戌日煞北、巳酉丑日煞东、亥卯未日煞西（三合局绝位）。
 */

import { dayGanZhiIndex } from '../calendar/ganzhi.js';
import { GAN, ZHI, JIAZI } from '../common/constants.js';

/** 煞方：按日支三合局 */
const SHA = { 申: '南', 子: '南', 辰: '南', 寅: '北', 午: '北', 戌: '北', 巳: '东', 酉: '东', 丑: '东', 亥: '西', 卯: '西', 未: '西' };

/** 生肖（随年柱/日支通用） */
export const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/**
 * 某日冲煞。
 * @returns {{冲, 冲生肖, 煞方}}
 */
export function chongshaOf(y, m, d) {
  const idx = dayGanZhiIndex(y, m, d);
  // 支 +6（六冲），干 +4（与参照口径一致）
  const chongIdx = (((idx + 30) % 60) + 60) % 60; // 支同 +6 ⇒ 甲子序 +30
  const ganIdx = (idx % 10 + 4) % 10;
  const zhi = ZHI[idx % 12].z;
  return {
    冲: GAN[ganIdx].z + ZHI[chongIdx % 12].z,
    冲生肖: ZODIAC[chongIdx % 12],
    煞方: SHA[zhi],
  };
}
