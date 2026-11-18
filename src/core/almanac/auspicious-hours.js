/**
 * src/core/almanac/auspicious-hours.js —— 每日吉时（十二天神的时辰版，自研，零依赖）
 *
 * 大白话：黄历上每天还标「今日吉时」——不是另起炉灶，而是把「十二天神黄黑道」那张表
 *   从「日」换成「时辰」再用一遍：青龙、明堂、金匮、天德、玉堂、司命六个神所临的时辰为吉时。
 *
 * 依据《玉匣記》-題晋·許遜（通行本）refs-texts「民俗吉凶日篇·諸日起吉時歌」原文——
 *   起法：「寅申須加子，卯酉卻居寅，辰戌龍位上，巳亥午上存，子午臨申他（按：通行本作「地」），
 *          醜未戌相尋。」
 *   十二神序：「青龍明堂與無刑（天刑），朱雀金匱天德神，白虎玉堂天牢黑，玄武司命共勾陳。」
 *   自注：「如寅申日，子時是青龍……數至亥時是勾陳。餘仿此。」
 *   吉时：「青龍、明堂、金匱、天德、玉堂、司命，皆吉時；其餘皆凶時，不可用。」
 *
 * 与日版十二天神的关系：同一张神序表（《协纪》「天德」即《玉匣記》此处之「天德」，协纪立成表作「宝光」，
 *   本仓 day-officers.js 的 TIANSHEN_ALIAS 已注）；日版按月建起青龙、此表按日支起青龙，两层级并行不悖。
 */

import { BRANCHES } from '../common/constants.js';
import { TIANSHEN_ORDER } from './day-officers.js';

const ZHI_Z = BRANCHES.map((b) => b.z);

/** 日支 → 青龙所临时支序（0=子）。依起法歌：寅申加子、卯酉居寅、辰戌龙位（辰）、巳亥午上、子午临申、丑未戌寻 */
const QINGLONG_AT = { 2: 0, 8: 0, 3: 2, 9: 2, 4: 4, 10: 4, 5: 6, 11: 6, 0: 8, 6: 8, 1: 10, 7: 10 };

/** 吉时六神（原文「青龍、明堂、金匱、天德、玉堂、司命，皆吉時」） */
export const JI_HOUR_GODS = ['青龙', '明堂', '金匮', '天德', '玉堂', '司命'];

/**
 * 某日的吉时。
 * @param {number|string} dayZhi 日支序（0=子）或日支字
 */
export function auspiciousHoursOf(dayZhi) {
  const i = typeof dayZhi === 'number' ? ((dayZhi % 12) + 12) % 12 : ZHI_Z.indexOf(String(dayZhi));
  if (i < 0) return null;
  const start = QINGLONG_AT[i];
  const rows = [];
  for (let k = 0; k < 12; k += 1) {
    const hourIdx = (start + k) % 12;
    const god = TIANSHEN_ORDER[k];
    rows.push({ 时支: ZHI_Z[hourIdx], 神: god, 吉凶: JI_HOUR_GODS.includes(god) ? '吉' : '凶' });
  }
  return {
    起青龙: ZHI_Z[start],
    吉时: rows.filter((r) => r.吉凶 === '吉').map((r) => r.时支),
    凶时: rows.filter((r) => r.凶 === undefined && r.吉凶 === '凶').map((r) => r.时支),
    十二时辰: rows,
    说明: `${ZHI_Z[i]}日自${ZHI_Z[start]}时起青龙，顺数十二时辰配十二天神；青龙、明堂、金匮、天德、玉堂、司命所临为吉时，其余为凶时。`,
    依据: '《玉匣記·諸日起吉時歌》——「青龍、明堂、金匱、天德、玉堂、司命，皆吉時；其餘皆凶時」',
  };
}
