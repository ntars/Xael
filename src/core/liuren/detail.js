/**
 * src/core/liuren/detail.js —— 大六壬·细分判读（自研，零依赖）
 *
 * 大白话：三传定了之后，还要再算几样「看盘必看」的东西：
 *   旬空（空亡）、驿马、三传遁干、连茹、天马、孤虚、应期。
 *   这些全部只依赖已经算好的 三传 / 日支 / 月支 / 日干支，不改变主盘。
 *
 * 口径来源：《大六壬灵觉经》卷二（连茹）、《戎事类占》（孤虚）、《东方朔射覆秘诀》（应期）等公版古籍。
 */

import { GAN, ZHI, JIAZI } from '../common/constants.js';
import { chongOf, yimaOf } from './tables.js';

/** 旬空（空亡）：六甲旬首后两位地支，值 = 支序对 */
const XUNKONG = {
  甲子: [10, 11], 甲戌: [8, 9], 甲申: [6, 7],
  甲午: [4, 5], 甲辰: [2, 3], 甲寅: [0, 1],
};

/** 六合（婚合对支）：寅亥、巳申、午未、卯戌、辰酉、子丑 */
const LIUHE = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

/** 四季（真连茹要三传同属一季）：春寅卯辰、夏巳午未、秋申酉戌、冬亥子丑 */
const JIJIE = { 春: [2, 3, 4], 夏: [5, 6, 7], 秋: [8, 9, 10], 冬: [11, 0, 1] };
function jijieOf(z) {
  for (const k of Object.keys(JIJIE)) if (JIJIE[k].includes(z)) return k;
  return null;
}

/** 取日干支所在旬首（如 丙子 → 甲戌） */
export function xunshouOf(dayGzText) {
  const idx = JIAZI.findIndex((g) => g[0] + g[1] === dayGzText);
  if (idx < 0) return '';
  const start = idx - (idx % 10);
  return JIAZI[start][0] + JIAZI[start][1];
}

/** 旬空：返回支序数组（两个字） */
export function xunKong(dayGzText) {
  return XUNKONG[xunshouOf(dayGzText)] || [];
}

/**
 * 三传遁干：旬首起甲，顺推十干；空亡支无遁干（返回「空X」）。
 * @param {number[]} chuan 三传支序
 * @param {string} dayGzText 日干支
 */
export function dunGanOf(chuan, dayGzText) {
  const xun = xunshouOf(dayGzText);
  const start = JIAZI.findIndex((g) => g[0] + g[1] === xun);
  const map = {};
  for (let k = 0; k < 10; k += 1) {
    const gz = JIAZI[(start + k) % 60];
    map[ZHI.findIndex((z) => z.z === gz[1])] = gz[0];   // 支序 → 遁干
  }
  const kong = xunKong(dayGzText);
  return chuan.map((z) => (kong.includes(z) ? `空${ZHI[z].z}` : `${map[z] || ''}${ZHI[z].z}`));
}

/**
 * 连茹：三传在地支环上相邻且同向（顺 +1+1 进连茹 / 逆 −1−1 退连茹）。
 * 真连茹 = 三支还同属一季（春寅卯辰 / 夏巳午未 / 秋申酉戌 / 冬亥子丑）。
 * ★ 注意同名异义：此处「孟仲季」指季节的孟月仲月季月，与涉害层「孟=寅申巳亥」不是一回事。
 */
export function isLianru(chuan) {
  if (!chuan || chuan.length !== 3) return { 是: false };
  const [a, b, c] = chuan;
  let 方向 = null; let 名 = null;
  if (b === (a + 1) % 12 && c === (b + 1) % 12) { 方向 = '顺'; 名 = '进连茹'; }
  else if (b === (a + 11) % 12 && c === (b + 11) % 12) { 方向 = '逆'; 名 = '退连茹'; }
  else return { 是: false };
  const jj = chuan.map(jijieOf);
  const 同季 = !!jj[0] && jj[0] === jj[1] && jj[1] === jj[2];
  return {
    是: true,
    方向,
    名,
    季节: jj,
    同季,
    真连茹: 同季,
    // 断语文案逐字对齐旧版（对拍需要同串）
    断: 同季
      ? `${名}且三传${chuan.map((z) => ZHI[z].z).join('')}同属${jj[0]}季一路（孟仲季相连无缺），为**真连茹**（连珠格）；灵觉经：「顺序而成一气者，主事无阻滞而速遂」。`
      : `${名}，但三传${chuan.map((z) => ZHI[z].z).join('')}跨${jj.join('/')}不同季，按灵觉经「若非孟仲季或隔角…即非真连茹」，**非真连茹**，事杂而应缓。`,
  };
}

/** 天马：六壬以驿马为天马，另判三传是否带马 */
export function tianmaOf(dayZhiIdx, chuan) {
  const ma = yimaOf(dayZhiIdx);
  return { 天马: ZHI[ma].z, 三传带马: (chuan || []).includes(ma) };
}

/**
 * 孤虚（《戎事类占》太岁法）：太岁后二辰为孤、二辰所冲为虚；
 * 这里以月建 / 日支代太岁，得月孤虚、日孤虚。
 */
export function guXuOf(dayZhiIdx, monthZhiIdx) {
  const one = (base) => {
    const g1 = (base + 1) % 12; const g2 = (base + 2) % 12;
    return {
      孤: [ZHI[g1].z, ZHI[g2].z],
      虚: [ZHI[chongOf(g1)].z, ZHI[chongOf(g2)].z],
    };
  };
  return {
    月: one(monthZhiIdx),
    日: one(dayZhiIdx),
    口径: '《戎事类占》太岁法：后二辰为孤、二辰所冲为虚（以月建/日支代太岁）',
  };
}

/** 应期（《东方朔射覆秘诀》）：初传所合为成期、末传所冲为散期 */
export function yingqiOf(chuan) {
  if (!chuan || chuan.length < 3) return { 成期: null, 散期: null };
  return {
    成期: ZHI[LIUHE[chuan[0]]].z,
    散期: ZHI[chongOf(chuan[2])].z,
    说明: '射覆应期：初传所合为成期、末传所冲为散期（《东方朔射覆秘诀》）',
  };
}

/** 日干支文本（'丙子'） */
export function gzText(gz) { return gz[0] + gz[1]; }

/** 日干序（0..9） */
export function ganIdxOf(dayGan) { return GAN.findIndex((g) => g.z === dayGan); }
