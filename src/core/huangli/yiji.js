/**
 * src/core/huangli/yiji.js —— 黄历宜忌与吉凶神煞（通书查表法）
 *
 * 大白话：传统黄历每天的「宜/忌」「吉神宜趋/凶煞宜忌」来自《玉匣记》一系通书的
 *   逐日条目表——以「六十甲子日 × 十二月」为索引的编码表，查表解码即得。
 *   这与建除/黄黑道那套「规则推导」是两个并行的口径，通书条目优先。
 * 数据表在 src/core/calendar/data/yiji-tables.js；查表算法与参考实现对齐。
 */

import { YI_JI, DAY_YI_JI, SHEN_SHA, DAY_SHEN_SHA } from '../calendar/data/yiji-tables.js';
import { JIAZI } from '../common/constants.js';

/** 甲子序（0..59）：干支字符串 → 序号 */
function jiaziIndex(gz) {
  const key = Array.isArray(gz) ? gz.join('') : gz;
  for (let i = 0; i < 60; i += 1) {
    if (JIAZI[i][0] + JIAZI[i][1] === key) return i;
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
export function dayYiJi(monthGanZhi, dayGanZhi) {
  const day = hex2(jiaziIndex(dayGanZhi));
  const month = hex2(jiaziIndex(monthGanZhi));
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
export function dayJiXiongSha(monthZhiIndexVal, dayGanZhi) {
  let m = monthZhiIndexVal - 2;
  if (m < 0) m += 12;
  let index = jiaziIndex(dayGanZhi).toString(16).toUpperCase();
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
