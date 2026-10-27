/**
 * src/core/huangli/jishen.js —— 吉神宜趋 / 凶煞宜忌（自研，零依赖）
 *
 * 大白话：黄历上的「吉神：天德 月德 天恩」「凶煞：月破 受死 土符」
 * 是按「月支+日干支」推算的一组神煞名。吉神多则宜事广、凶煞多则忌事多。
 * 口径（《协纪辨方书》通行定义）：
 *   天德：正月丁、二月坤(申)、三月壬、四月辛、五月乾(亥)、六月甲、
 *         七月癸、八月艮(寅)、九月丙、十月乙、十一月巽(巳)、十二月庚（以日干/支取）。
 *   月德：寅午戌月丙、申子辰月壬、亥卯未月甲、巳酉丑月庚（以日干取）。
 *   天德合/月德合：德干之五合干（坤乾艮巽四维以寄支取合）。
 *   天赦：春戊寅、夏甲午、秋戊申、冬甲子（按节气季节）。
 *   月破：与月支六冲之日支。受死：正月戌日起轮十二支（表）。
 *   月煞（月虚/月害/土符等）按通行表逐月取支。
 */

import { dayGanZhiIndex, monthZhiIndex, jieqiSeason } from '../calendar/ganzhi.js';
import { GAN, ZHI, JIAZI } from '../common/constants.js';

/** 天德（月支序 → 日干或寄支） */
const TIANDE = ['丁', '申', '壬', '辛', '亥', '甲', '癸', '寅', '丙', '乙', '巳', '庚'];
/** 月德（月支三合 → 日干） */
function yuedeGan(mZhi) {
  const grp = mZhi % 4; // 近似：寅午戌=0? 用三合判断
  const s = ZHI[mZhi].z;
  if (['寅', '午', '戌'].includes(s)) return '丙';
  if (['申', '子', '辰'].includes(s)) return '壬';
  if (['亥', '卯', '未'].includes(s)) return '甲';
  return '庚';
}
/** 五合 */
const WUHE = { 甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸', 己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊' };

/** 受死日（月支序 → 日支） */
const SHOUSI = ['戌', '辰', '亥', '巳', '子', '午', '丑', '未', '寅', '申', '卯', '酉'];

/** 天赦日（季节 → 干支） */
const TIANShe = { 春: '戊寅', 夏: '甲午', 秋: '戊申', 冬: '甲子' };

/**
 * 某日吉凶神列表。
 */
export function jishenOf(y, m, d) {
  const gzIdx = dayGanZhiIndex(y, m, d);
  const dayGan = GAN[gzIdx % 10].z;
  const dayZhi = ZHI[gzIdx % 12].z;
  const dayGanChar = dayGan;
  const mZhiIdx = monthZhiIndex(y, m, d);
  const mZhi = ZHI[mZhiIdx].z;

  const ji = [], xiong = [];

  // 天德/月德及其合
  const td = TIANDE[mZhiIdx % 12];
  if (td === dayGan || td === dayZhi) ji.push('天德');
  else if (GAN.includes(td) && WUHE[td] === dayGan) ji.push('天德合');
  const yd = yuedeGan(mZhiIdx);
  if (yd === dayGan) ji.push('月德');
  else if (WUHE[yd] === dayGan) ji.push('月德合');

  // 天赦
  const season = jieqiSeason(y, m, d);
  if (TIANShe[season] === JIAZI[gzIdx].join('')) ji.push('天赦');

  // 月恩/天恩（通行：甲子~戊辰五日为一轮等，简化按通行天恩表）
  const tianen = ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己卯', '庚辰', '辛巳', '壬午', '癸未', '己酉', '庚戌', '辛亥', '壬子', '癸丑'];
  if (tianen.includes(JIAZI[gzIdx].join(''))) ji.push('天恩');

  // 月破
  const dayZhiIdx = gzIdx % 12;
  if ((dayZhiIdx - mZhiIdx + 12) % 12 === 6) xiong.push('月破');
  // 受死
  if (SHOUSI[mZhiIdx % 12] === dayZhi) xiong.push('受死');
  // 月三煞：按「申子辰→巳午未、寅午戌→亥子丑、巳酉丑→寅卯辰、亥卯未→申酉戌」取劫煞
  // 劫煞 = 三合局绝位（申子辰见巳、寅午戌见亥、巳酉丑见寅、亥卯未见申）
  const JIESHA = { 申: '巳', 子: '巳', 辰: '巳', 寅: '亥', 午: '亥', 戌: '亥', 巳: '寅', 酉: '寅', 丑: '寅', 亥: '申', 卯: '申', 未: '申' };
  if (JIESHA[mZhi] === dayZhi) xiong.push('劫煞');
  // 月害（六害：子未 丑午 寅巳 卯辰 申亥 酉戌）
  const hai = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };
  if (hai[mZhi] === dayZhi) xiong.push('月害');

  return { 吉神宜趋: ji, 凶煞宜忌: xiong };
}
