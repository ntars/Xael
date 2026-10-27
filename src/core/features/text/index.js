/**
 * src/core/features/text/index.js —— 22 项功能的文本出料注册表
 *
 * 大白话：内核只负责「算出结构化的盘」，这一层负责把盘写成中文多行文本，
 * 页面再用 result-format 把文本切成「首段导读 + 标签行 + 段落」。
 * 键 = 处理器名（与 registry.FEATURES[].处理器 一一对应）。
 *
 * 约定：每个出料函数返回 {text} 或 {prompt}（缺料问句）；
 * 入参统一为同一个「生辰包」：{date:{year,month,day}, time:{hour,minute}|null, gender, name}
 * —— 由 birthPack() 把 analyzer 的 {y,m,d,h,minute,gender,name} 转过来。
 */

import { baziText, dayunText, patternText, shenshaText } from './bazi.js';
import { ziweiText, sihuaText } from './ziwei.js';
import {
  qimenText, qimenRiText, qimenKeText, qimenBaojianText, qimenNianYueText,
  qimenFeiText, qimenGeText, liurenText, bifaText,
} from './qimen.js';
import { liuyaoText, liuyaoWangshuaiText, meihuaText } from './liuyao.js';
import { feixingText, bazhaiText, huangliText, dateConvertText } from './fengshui.js';

/** 处理器名 → 出料函数 */
export const TEXT_OF = {
  bazi: baziText,
  dayun: dayunText,
  'bazi-pattern': patternText,
  'bazi-shensha': shenshaText,
  ziwei: ziweiText,
  sihua: sihuaText,
  qimen: qimenText,
  'qimen-ri': qimenRiText,
  'qimen-ke': qimenKeText,
  'qimen-baojian': qimenBaojianText,
  'qimen-nianyue': qimenNianYueText,
  'qimen-fei': qimenFeiText,
  'qimen-ge': qimenGeText,
  liuren: liurenText,
  'liuren-bifa': bifaText,
  liuyao: liuyaoText,
  'liuyao-wangshuai': liuyaoWangshuaiText,
  meihua: meihuaText,
  feixing: feixingText,
  bazhai: bazhaiText,
  huangli: huangliText,
  lunar: dateConvertText,
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
  };
}

/** 包一层：每个出料函数只吃 birthPack 结构 */
export const TEXT_PACK = Object.create(null);
for (const k of Object.keys(TEXT_OF)) {
  const fn = TEXT_OF[k];
  TEXT_PACK[k] = (b, text) => fn(birthPack(b), text);
}
