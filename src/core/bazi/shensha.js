/**
 * src/core/bazi/shensha.js —— 八字神煞（自研，零依赖）
 *
 * 大白话：神煞是传统命理里的一批「标签」，按年支、月支、日干、日支等查表得出，
 * 例如「天乙贵人」「桃花」「驿马」。传统口诀属公有领域知识，本项目按口诀重写实现。
 *
 * 收录范围（每条都注明取法，未收录者不臆造）：
 *   天乙贵人 / 文昌 / 桃花（咸池）/ 驿马 / 华盖 / 将星 / 羊刃 / 禄神 / 空亡 /
 *   孤辰寡宿 / 红鸾 / 天喜 / 天德贵人 / 月德贵人 / 太极贵人 / 金舆 / 天医
 *
 * 口径：以「日干」或「年支」为基准的按同一表中标注的基准取；
 * 输出仅列命中的神煞与取法，不作吉凶断语。
 */

import { GAN, ZHI, JIAZI, xunkongOf } from '../common/constants.js';
import { chart } from './bazi.js';
import { dayGanZhiIndex } from '../calendar/ganzhi.js';
import { solarToLunar } from '../calendar/lunar2.js';

/** 天乙贵人（甲戊庚牛羊…） */
const TIANYI = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['卯', '巳'], 癸: ['卯', '巳'],
  辛: ['午', '寅'],
};

/** 文昌贵人：甲巳乙午丙申丁酉戊申己酉庚亥辛子壬寅癸卯 */
const WENCHANG = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };

/** 桃花（咸池）：寅午戌见卯、申子辰见酉、巳酉丑见午、亥卯未见子 */
const TAOHUA = { 寅: '卯', 午: '卯', 戌: '卯', 申: '酉', 子: '酉', 辰: '酉', 巳: '午', 酉: '午', 丑: '午', 亥: '子', 卯: '子', 未: '子' };

/** 驿马：申子辰见寅、寅午戌见申、巳酉丑见亥、亥卯未见巳 */
const YIMA = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' };

/** 华盖：寅午戌见戌、申子辰见辰、巳酉丑见丑、亥卯未见未 */
const HUAGAI = { 寅: '戌', 午: '戌', 戌: '戌', 申: '辰', 子: '辰', 辰: '辰', 巳: '丑', 酉: '丑', 丑: '丑', 亥: '未', 卯: '未', 未: '未' };

/** 将星：三合局中神（寅午戌见午…） */
const JIANGXING = { 寅: '午', 午: '午', 戌: '午', 申: '子', 子: '子', 辰: '子', 巳: '酉', 酉: '酉', 丑: '酉', 亥: '卯', 卯: '卯', 未: '卯' };

/** 羊刃（阳干）：甲卯、丙午、戊午、庚酉、壬子 */
const YANGREN = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' };

/** 禄神：甲寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子 */
const LUSHEN = { 甲: '寅', 乙: '卯', 丙: '巳', 戊: '巳', 丁: '午', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };

/** 金舆：甲辰、乙巳、丙未、丁申、戊未、己申、庚戌、辛亥、壬丑、癸寅 */
const JINYU = { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };

/** 太极贵人：甲乙见子午、丙丁见卯酉、戊己见辰戌丑未、庚辛见寅亥、壬癸见巳申 */
const TAIJI = {
  甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'],
  戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'],
  庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'],
};

/** 孤辰寡宿：按年支三会局取 */
const GUCHEN = { 亥: '寅', 子: '寅', 丑: '寅', 寅: '巳', 卯: '巳', 辰: '巳', 巳: '申', 午: '申', 未: '申', 申: '亥', 酉: '亥', 戌: '亥' };
const GUASU = { 亥: '戌', 子: '戌', 丑: '戌', 寅: '丑', 卯: '丑', 辰: '丑', 巳: '辰', 午: '辰', 未: '辰', 申: '未', 酉: '未', 戌: '未' };

/** 红鸾：卯起子逆行；天喜：红鸾对冲 */
const HONGLUAN = { 子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌', 午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰' };

/** 天德贵人：按农历月（1..12） */
const TIANDE = { 1: '丁', 2: '申', 3: '壬', 4: '辛', 5: '亥', 6: '甲', 7: '癸', 8: '寅', 9: '丙', 10: '乙', 11: '巳', 12: '庚' };

/** 月德贵人：按农历月三合局 */
const YUEDE = { 1: '丙', 2: '甲', 3: '壬', 4: '庚', 5: '丙', 6: '甲', 7: '壬', 8: '庚', 9: '丙', 10: '甲', 11: '壬', 12: '庚' };

/** 天医：按农历月前一位 */
const TIANYI_MED = { 1: '丑', 2: '寅', 3: '卯', 4: '辰', 5: '巳', 6: '午', 7: '未', 8: '申', 9: '酉', 10: '戌', 11: '亥', 12: '子' };

/** 对冲天支 */
function chong(z) {
  return ZHI[(ZHI.findIndex((x) => x.z === z) + 6) % 12].z;
}

/**
 * 八字神煞。
 * @param {object} input {y,m,d,h}
 * @returns {{命局: object, 四柱: string, 神煞: Array<{名,位,取法}>, 说明}}
 */
export function shenshaOf(input) {
  const c = chart(input);
  const P = c.pillars;
  const dayGan = P.日.干;
  const yearZhi = P.年.支;
  const dayZhi = P.日.支;
  const lunar = solarToLunar(c.input.y, c.input.m, c.input.d);
  const lMonth = lunar.m;

  // 四柱地支一览（用于「落在哪一柱」）
  const zhiPos = { 年: P.年.支, 月: P.月.支, 日: P.日.支, 时: P.时.支 };
  const ganPos = { 年: P.年.干, 月: P.月.干, 日: P.日.干, 时: P.时.干 };
  const hitZhi = (z) => Object.keys(zhiPos).filter((k) => zhiPos[k] === z);
  const hitGan = (g) => Object.keys(ganPos).filter((k) => ganPos[k] === g);

  const out = [];
  const add = (名, 取法, 位) => {
    if (位 && 位.length) out.push({ 名, 位: 位.join('、'), 取法 });
  };

  // 日干系
  add('天乙贵人', `日干${dayGan}见丑未类`, (TIANYI[dayGan] || []).flatMap(hitZhi));
  add('文昌贵人', `日干${dayGan}见${WENCHANG[dayGan]}`, hitZhi(WENCHANG[dayGan]));
  add('羊刃', `日干${dayGan}见${YANGREN[dayGan] || '（阴干不取）'}`, YANGREN[dayGan] ? hitZhi(YANGREN[dayGan]) : []);
  add('禄神', `日干${dayGan}见${LUSHEN[dayGan]}`, hitZhi(LUSHEN[dayGan]));
  add('金舆', `日干${dayGan}见${JINYU[dayGan]}`, hitZhi(JINYU[dayGan]));
  add('太极贵人', `日干${dayGan}见${(TAIJI[dayGan] || []).join('')}`, (TAIJI[dayGan] || []).flatMap(hitZhi));

  // 年支系
  add('桃花', `年支${yearZhi}见${TAOHUA[yearZhi]}`, hitZhi(TAOHUA[yearZhi]));
  add('驿马', `年支${yearZhi}见${YIMA[yearZhi]}`, hitZhi(YIMA[yearZhi]));
  add('华盖', `年支${yearZhi}见${HUAGAI[yearZhi]}`, hitZhi(HUAGAI[yearZhi]));
  add('将星', `年支${yearZhi}见${JIANGXING[yearZhi]}`, hitZhi(JIANGXING[yearZhi]));
  add('孤辰', `年支${yearZhi}见${GUCHEN[yearZhi]}`, hitZhi(GUCHEN[yearZhi]));
  add('寡宿', `年支${yearZhi}见${GUASU[yearZhi]}`, hitZhi(GUASU[yearZhi]));
  add('红鸾', `年支${yearZhi}见${HONGLUAN[yearZhi]}`, hitZhi(HONGLUAN[yearZhi]));
  add('天喜', `年支${yearZhi}红鸾对冲见${chong(HONGLUAN[yearZhi])}`, hitZhi(chong(HONGLUAN[yearZhi])));

  // 月令系（农历月）
  add('天德贵人', `农历${lMonth}月见${TIANDE[lMonth]}`, hitGan(TIANDE[lMonth]).concat(hitZhi(TIANDE[lMonth])));
  add('月德贵人', `农历${lMonth}月见${YUEDE[lMonth]}`, hitGan(YUEDE[lMonth]).concat(hitZhi(YUEDE[lMonth])));
  add('天医', `农历${lMonth}月见${TIANYI_MED[lMonth]}`, hitZhi(TIANYI_MED[lMonth]));

  // 空亡（以日柱旬空）
  const dayIdx = dayGanZhiIndex(c.input.y, c.input.m, c.input.d);
  const xk = xunkongOf(dayIdx);
  add('空亡', `日柱${JIAZI[dayIdx].join('')}属旬，旬空${xk.join('')}`, xk.flatMap(hitZhi));

  return {
    四柱: `${P.年.干支} ${P.月.干支} ${P.日.干支} ${P.时.干支}`,
    神煞: out,
    说明: '神煞按传统口诀取，仅列命中之项并注明取法；不同流派取舍不一，本项目不增减口诀内容。',
  };
}
