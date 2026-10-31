/**
 * src/core/purple-star/transformations.js —— 紫微四化（自研，零依赖）
 *
 * 大白话：四化是紫微斗数里「化禄、化权、化科、化忌」四种变化标记，
 * 由出生年的天干决定哪四颗星发生变化（如甲年廉贞化禄）。
 * 本模块给出四化表、当年四化落宫，以及自化/生年四化在盘上的分布。
 *
 * 口径（docs/CALIBER-NOTES.md「紫微」节）：
 *   · 生年四化按年干（农历正月初一换年，与安星法一致）；
 *   · 戊、壬两干各派不一，本项目取中州主流：戊＝贪狼禄、太阴权、右弼科、天机忌；
 *     壬＝天梁禄、紫微权、左辅科、武曲忌；
 *   · 四化星所在宫即该化的落宫，用于观察命盘结构。
 * 本模块只列四化与落宫，不作吉凶断语。
 */

import { purpleStarChart } from './chart.js';

/**
 * 十干四化表（中州派主流）。
 *
 * 文献说明（如实标注，不虚构出处）：本库《紫微斗数全书》电子本（明·罗洪先题本）
 *   未收「十干四化」全表（全书四化散见于各星条下，无集中表），故此处不能引原书直证，
 *   取中州派通行表。派别差异：庚干四化有「太阳武曲太阴天同」（本表）与
 *   「太阳武曲天府天同」两说，壬干有「天梁紫微左辅武曲」（本表）与
 *   「天梁紫微左辅天府」两说，本模块不合并、不擅改，如需另派可在此表替换。
 */

export const SIHUA_TABLE = {
  甲: { 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' },
  乙: { 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' },
  丙: { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' },
  丁: { 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' },
  戊: { 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '天机' },
  己: { 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' },
  庚: { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' },
  辛: { 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' },
  壬: { 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' },
  癸: { 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' },
};

/**
 * 紫微四化。
 * @param {object} input {y,m,d,h}
 */
export function transformationsOf(input) {
  const c = purpleStarChart(input);
  // 年干直接取盘面已算好的四化（chart 已按农历正月初一换年定过干，不在这里重推）
  const table = c['四化'] || {};
  const found = { 禄: table['禄'], 权: table['权'], 科: table['科'], 忌: table['忌'] };

  // 落宫：遍历十二宫找主星/辅星含该星者，输出「X化Y入Z宫（干支）」
  const cells = c['cells'] || [];
  const 落宫 = {};
  for (const [化, star] of Object.entries(found)) {
    if (!star) continue;
    const hit = cells.find((cell) => (cell['主星'] || []).includes(star) || (cell['辅星'] || []).includes(star));
    落宫[化] = hit
      ? { palaceName: hit['宫'], 干支: hit['干支'], 文本: star + '化' + 化 + '入' + hit['宫'] + '（' + hit['干支'] + '）' }
      : { palaceName: null, 干支: null, 文本: star + '化' + 化 + '不在十二宫' };
  }

  // 依年干查全表（用于对照展示）
  const ganFromTable = Object.keys(SIHUA_TABLE).find((g) => SIHUA_TABLE[g]['禄'] === found['禄'] && SIHUA_TABLE[g]['忌'] === found['忌']);

  return {
    年干: ganFromTable || '（按盘面四化反推失败）',
    四化: found,
    落宫,
    全表: ganFromTable ? SIHUA_TABLE[ganFromTable] : null,
    命宫: c['命宫'],
    身宫: c['身宫'],
    命主星: c['命主星'],
    身主星: c['身主星'],
    五行局: c['五行局'],
    口径: '按农历正月初一换年取年干；戊、壬两干取中州主流表（分歧见 docs/CALIBER-NOTES.md）。',
  };
}
