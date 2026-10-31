/**
 * src/core/features/render/index.js —— 22 项功能的文本出料注册表
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 *
 * 大白话：内核只负责「算出结构化的盘」，这一层负责把盘写成中文多行文本，
 * 页面再用 result-format 把文本切成「首段导读 + 标签行 + 段落」。
 * 键 = 处理器名（与 registry.FEATURES[].handler 一一对应）。
 *
 * 约定：每个出料函数返回 {text} 或 {prompt}（缺料问句）；
 * 入参统一为同一个「生辰包」：{date:{year,month,day}, time:{hour,minute}|null, gender, name}
 * —— 由 birthPack() 把 analyzer 的 {y,m,d,h,minute,gender,name} 转过来。
 */

import { fourPillarsText, luckCyclesText, chartPatternsText, symbolicStarsText } from './four-pillars.js';
import { purpleStarText, transformationsText } from './purple-star.js';
import {
  mysticGatesHourText, mysticGatesDayText, mysticGatesQuarterText, mysticGatesMirrorText, mysticGatesYearMonthText,
  mysticGatesFlyingText, mysticGatesPatternsText, sixRenText, sixRenBifaText,
} from './mystic-gates.js';
import { sixLinesText, sixLinesStrengthText, plumBlossomText } from './six-lines.js';
import { flyingStarsText, eightMansionsText, almanacText, lunisolarConvertText } from './geomancy.js';

/** 处理器名 → 出料函数 */
export const TEXT_OF = {
  'four-pillars': fourPillarsText,
  'luck-cycles': luckCyclesText,
  'chart-patterns': chartPatternsText,
  'symbolic-stars': symbolicStarsText,
  'purple-star': purpleStarText,
  transformations: transformationsText,
  'mystic-gates-hour': mysticGatesHourText,
  'mystic-gates-day': mysticGatesDayText,
  'mystic-gates-quarter': mysticGatesQuarterText,
  'mystic-gates-mirror': mysticGatesMirrorText,
  'mystic-gates-year-month': mysticGatesYearMonthText,
  'mystic-gates-flying': mysticGatesFlyingText,
  'mystic-gates-patterns': mysticGatesPatternsText,
  'six-ren': sixRenText,
  'six-ren-bifa': sixRenBifaText,
  'six-lines': sixLinesText,
  'six-lines-strength': sixLinesStrengthText,
  'plum-blossom': plumBlossomText,
  'flying-stars': flyingStarsText,
  'eight-mansions': eightMansionsText,
  almanac: almanacText,
  'lunisolar-convert': lunisolarConvertText,
};

/**
 * analyzer 的生辰结构 → 出料层入参。
 * @param {{y,m,d,h,minute,gender,name}} b
 */
export function birthPack(b) {
  const bb = b || {};
  return {
    date: bb.y ? { year: bb.y, month: bb.m || null, day: bb.d || null } : null,
    time: bb.h != null ? { hour: bb.h, minute: bb.minute || 0 } : null,
    gender: bb.gender || 'male',
    name: bb.name || '',
    // 粒度标记：只给到年月（年家/月家）或只给到年份（命卦/飞星）时，出料层据此少写日期
    yearMonthOnly: !!bb.yearMonthOnly,
    yearOnly: !!bb.yearOnly,
  };
}

/** 包一层：每个出料函数只吃 birthPack 结构 */
export const TEXT_PACK = Object.create(null);
for (const k of Object.keys(TEXT_OF)) {
  const fn = TEXT_OF[k];
  TEXT_PACK[k] = (b, text) => fn(birthPack(b), text);
}
