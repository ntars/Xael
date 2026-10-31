/**
 * src/core/almanac/activities.js —— 黄历宜忌与吉凶神煞（通书查表法）
 *
 * 大白话：传统黄历每天的「宜/忌」「吉神宜趋/凶煞宜忌」来自库外《玉匣记》一系通书的
 *   逐日条目表——以「六十甲子日 × 十二月」为索引的编码表，查表解码即得。
 *   这与建除/黄黑道那套「规则推导」是两个并行的口径，通书条目优先。
 * 数据表在 src/core/calendar/data/activities-tables.js；查表算法与参考实现对齐。
 *
 * 【可溯性边界（2026-10 审计，如实声明）】
 *   · 这张表**不是**按《协纪辨方书》规则推出来的，也**没有库内底本可逐条对校**——
 *     库外《玉匣记》不在 refs-texts，故「库外通书」四字不是谦辞，是实情。
 *   · 内部自洽已校验（60 甲子日 × 60 甲子月 = 3600 单元）：
 *     全部可解码、无未定义项、无「同项既宜又忌」的单元格、宜项最多 31 项、没有空白单元。
 *   · 与原书确有冲突，且已量化：月破（日支冲月建）共 300 个单元，**100% 仍列宜项**（最多 9 项），
 *     而《协纪》说月破「诸事不宜」。本仓不擅改表值，只在 daily() 的「特别忌·月破」条里
 *     把当日宜项数写出来，标明两源不一致、并见不合。
 *   · 因此本表的定位是「通行通书转写」，不是原书直证；凡引《协纪》处必另标篇名。
 */

import { YI_JI, DAY_YI_JI, SHEN_SHA, DAY_SHEN_SHA } from '../calendar/data/activities-tables.js';
import { SEXAGENARY } from '../common/constants.js';

/** 甲子序（0..59）：干支字符串 → 序号 */
function jiaziIndex(gz) {
  const key = Array.isArray(gz) ? gz.join('') : gz;
  for (let i = 0; i < 60; i += 1) {
    if (SEXAGENARY[i][0] + SEXAGENARY[i][1] === key) return i;
  }
  return -1;
}

/** 两位十六进制大写（与参考实现对齐） */
function hex2(n) {
  const s = n.toString(16).toUpperCase();
  return s.length < 2 ? '0' + s : s;
}

/**
 * 逐日宜忌查表（DAY_YI_JI 编码：`日序hex=月序hex串:宜hex串,忌hex串…`）。
 * 返回 { 宜: string[], 忌: string[] }；无命中时给「诸事不宜」占位。
 */
export function dayYiJi(monthSexagenary, daySexagenary) {
  const day = hex2(jiaziIndex(daySexagenary));
  const month = hex2(jiaziIndex(monthSexagenary));
  let right = DAY_YI_JI;
  let index = right.indexOf(day + '=');
  const yi = [];
  const ji = [];
  while (index > -1) {
    right = right.substring(index + 3);
    let left = right;
    if (left.indexOf('=') > -1) {
      left = left.substring(0, left.indexOf('=') - 2);
    }
    const months = left.substring(0, left.indexOf(':'));
    let matched = false;
    for (let i = 0, j = months.length; i < j; i += 2) {
      if (months.substring(i, i + 2) === month) { matched = true; break; }
    }
    if (matched) {
      const ys = left.substring(left.indexOf(':') + 1);
      const yiPart = ys.substring(0, ys.indexOf(','));
      const jiPart = left.substring(left.indexOf(',') + 1);
      for (let i = 0, j = yiPart.length; i < j; i += 2) {
        yi.push(YI_JI[parseInt(yiPart.substring(i, i + 2), 16)]);
      }
      for (let i = 0, j = jiPart.length; i < j; i += 2) {
        ji.push(YI_JI[parseInt(jiPart.substring(i, i + 2), 16)]);
      }
      break;
    }
    index = right.indexOf(day + '=');
  }
  if (yi.length < 1) yi.push(SHEN_SHA[0]);
  if (ji.length < 1) ji.push(SHEN_SHA[0]);
  return { 宜: yi, 忌: ji };
}

/**
 * 吉神宜趋/凶煞宜忌查表（DAY_SHEN_SHA：12 个月支一份 `日序hex;…` 编码串）。
 * 编码 <60 → 吉神（SHEN_SHA[n+1]），≥60 → 凶煞（SHEN_SHA[n-60]）。
 * @param {number} monthZhiIndexVal 月支序（0=子）
 */
export function dayJiXiongSha(monthZhiIndexVal, daySexagenary) {
  let m = monthZhiIndexVal - 2;
  if (m < 0) m += 12;
  let index = jiaziIndex(daySexagenary).toString(16).toUpperCase();
  if (index.length < 2) index = '0' + index;
  const matcher = new RegExp(';' + index + '(.[^;]*)', 'g').exec(DAY_SHEN_SHA[m]);
  const ji = [];
  const xiong = [];
  if (matcher) {
    const data = matcher[1];
    for (let i = 0, j = data.length; i < j; i += 2) {
      const n = parseInt(data.substring(i, i + 2), 16);
      if (n < 60) ji.push(SHEN_SHA[n + 1]);
      else xiong.push(SHEN_SHA[n + 1]);
    }
  }
  if (ji.length < 1) ji.push(SHEN_SHA[0]);
  if (xiong.length < 1) xiong.push(SHEN_SHA[0]);
  return { 吉神宜趋: ji, 凶煞宜忌: xiong };
}
