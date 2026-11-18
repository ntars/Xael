/**
 * src/core/almanac/clashes.js —— 冲煞（自研，零依赖）
 *
 * 大白话：黄历「冲羊(辛未)煞东」表示当天与某个生肖相冲、该生肖的人诸事留意，
 * 同时「煞」指冲的方向（煞方）不宜动土。
 *
 * 口径：
 *   · 地支六冲 = 子午、丑未、寅申、卯酉、辰戌、巳亥（相隔六位，库外《淮南子·天文训》
 *     「阴阳相薄，感而为雷」一系的对冲关系，通行历法通用）。
 *   · 煞方：《钦定协纪辨方书·义例》引库外《考原》：「三煞者三合五行当旺之冲……如申子
 *     辰合水局，水旺于北方，南方其冲也，故三煞在南方巳午未」——即按日支三合局的
 *     旺方取冲方：申子辰（水旺北）煞南、寅午戌（火旺南）煞北、巳酉丑（金旺西）煞东、
 *     亥卯未（木旺东）煞西。
 *   · 冲干 = 日干序 + 4（甲子日→戊午、乙丑日→己未）。这是通书「冲生肖」栏的通行写法，
 *     与「天克地冲」（干支同 +6）不是一回事；《协纪辨方书》未载此栏，故如实标注为
 *     通书通行格式，不作典籍直证。
 */

import { daySexagenaryIndex } from '../calendar/sexagenary.js';
import { STEMS, BRANCHES, SEXAGENARY } from '../common/constants.js';

/** 煞方：按日支三合局 */
const SHA = { 申: '南', 子: '南', 辰: '南', 寅: '北', 午: '北', 戌: '北', 巳: '东', 酉: '东', 丑: '东', 亥: '西', 卯: '西', 未: '西' };

/** 生肖（随年柱/日支通用） */
export const ZODIAC_SIGNS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/**
 * 某日冲煞。
 * @returns {{冲, 冲生肖, 煞方}}
 */
export function chongshaOf(y, m, d) {
  const idx = daySexagenaryIndex(y, m, d);
  // 支 +6（六冲），干 +4（与参照口径一致）
  const chongIdx = (((idx + 30) % 60) + 60) % 60; // 支同 +6 ⇒ 甲子序 +30
  const ganIdx = (idx % 10 + 4) % 10;
  const zhi = BRANCHES[idx % 12].z;
  return {
    冲: STEMS[ganIdx].z + BRANCHES[chongIdx % 12].z,
    冲生肖: ZODIAC_SIGNS[chongIdx % 12],
    煞方: SHA[zhi],
  };
}
