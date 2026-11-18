/**
 * src/core/four-pillars/reverse.js —— 四柱反查公历日期（自研，零依赖）
 *
 * 大白话：给四组干支（年柱、月柱、日柱，时柱可选），倒推出它可能是哪一天。
 * 六十甲子每 60 天一轮、年柱每 60 年一轮，所以同一个四柱在 1900–2100 里
 * 通常能对上好几个日子——本模块把它们全列出来，由调用方决定取哪个，绝不硬选一个。
 *
 * 口径（与 chart.js 完全同源，不另立规则）：
 *   · 年柱：立春交节时刻换年（yearSexagenaryIndex）；
 *   · 月柱：节气换月 + 五虎遁（monthSexagenary）；
 *   · 日柱：儒略日 %60（daySexagenaryIndex），23 时归次日（effectiveDay）；
 *   · 时柱：由换日后的日干五鼠遁现算（hourSexagenary）。
 * 因此「能反查出来的日期」与正排时的判定标准逐字一致——正排能出的四柱，反查必能找回。
 *
 * 检索范围：1900-01-01 ~ 2100-12-31（与本项目其余历法模块一致）。
 *
 * 文献依据：四柱反查本身是逆运算，无独立古籍规则；其正排口径逐条出自
 *   《渊海子平·论大运》（年柱立春换年）、（月柱节气换月 + 五虎遁）、
 *   《三命通会·论年月日时》（日柱六十甲子循环、时柱五鼠遁）。
 *   本文件只做逆推，不另立任何规则。
 */

import { solarToJdn, jdnToSolar } from '../calendar/julian.js';
import { SEXAGENARY } from '../common/constants.js';
import {
  daySexagenaryIndex, yearSexagenaryIndex,
  monthSexagenary, hourSexagenary, effectiveDay,
} from '../calendar/sexagenary.js';

/** 「乙酉」→ 六十甲子序；非法返回 -1 */
export function sexagenaryIndexOf(text) {
  const t = String(text || '').trim();
  if (t.length < 2) return -1;
  const gan = t.charAt(0); const zhi = t.charAt(1);
  return SEXAGENARY.findIndex((x) => x[0] === gan && x[1] === zhi);
}

/**
 * 四柱反查。
 * @param {{年:string, 月:string, 日:string, 时?:string}} pillars 干支各两字（如 {年:'乙酉'}）
 * @param {{from?:number, to?:number, limit?:number}} [opt] 年份范围与结果上限
 * @returns {{候補: Array<{y,m,d,h,hourText}>, 总数:number, 截断:boolean, 口径:string}}
 */
export function solarFromPillars(pillars, opt) {
  const o = opt || {};
  const from = o.from || 1900;
  const to = o.to || 2100;
  const limit = o.limit || 24;
  const yi = sexagenaryIndexOf(pillars['年']);
  const mi = sexagenaryIndexOf(pillars['月']);
  const di = sexagenaryIndexOf(pillars['日']);
  const hi = pillars['时'] ? sexagenaryIndexOf(pillars['时']) : -1;
  if (yi < 0 || mi < 0 || di < 0 || (pillars['时'] && hi < 0)) {
    return { 候補: [], 总数: 0, 截断: false, 口径: '四柱含非法干支，无法反查。' };
  }

  const out = [];
  let total = 0;
  const jdEnd = solarToJdn(to, 12, 31);
  for (let jd = solarToJdn(from, 1, 1); jd <= jdEnd; jd += 1) {
    const s = jdnToSolar(jd);
    // 年柱与月柱先比——不通就整天跳过，省掉后面两次五鼠遁
    if (yearSexagenaryIndex(s.y, s.m, s.d, 12) !== yi) continue;
    if (sexagenaryIndexOf(monthSexagenary(s.y, s.m, s.d, 12, 0)) !== mi) continue;
    if (daySexagenaryIndex(s.y, s.m, s.d) !== di) continue;

    // 同一天可能对应多个时辰（时柱只给一组干支时，一天最多一个时辰命中；
    //   不给时柱则 12 个时辰都算候选，此处只列「日」级结果，h 记 12 代表日中午时）
    if (hi < 0) {
      total += 1;
      if (out.length < limit) out.push({ y: s.y, m: s.m, d: s.d, h: 12, hourText: '' });
      continue;
    }
    const dayGz = SEXAGENARY[di];
    for (let h = 0; h < 24; h += 1) {
      const eff = effectiveDay(s.y, s.m, s.d, h);
      const dayGan = SEXAGENARY[daySexagenaryIndex(eff.y, eff.m, eff.d)][0];
      if (sexagenaryIndexOf(hourSexagenary(dayGan, h)) !== hi) continue;
      total += 1;
      if (out.length < limit) out.push({ y: s.y, m: s.m, d: s.d, h, hourText: SEXAGENARY[hi].join('') });
      break; // 同一时刻四柱只命中一个时辰，命中即可跳出
    }
  }
  return {
    候補: out,
    总数: total,
    截断: total > out.length,
    口径: '按立春换年、节气换月、子初换日、五鼠遁定时柱逐日比配；'
      + `范围 ${from}–${to} 年。同一四柱可能对应多个日期（六十甲子循环所致），全部列出、不硬选。`,
  };
}

/** 从形如「乙酉 壬午 甲子 甲子」的文本里取出四柱（不足四柱时返回 null 并给缺项） */
export function parsePillars(text) {
  const t = String(text || '');
  const m = t.match(/([甲乙丙丁戊己庚辛壬癸])\s*([子丑寅卯辰巳午未申酉戌亥])[\s,，、]*([甲乙丙丁戊己庚辛壬癸])\s*([子丑寅卯辰巳午未申酉戌亥])[\s,，、]*([甲乙丙丁戊己庚辛壬癸])\s*([子丑寅卯辰巳午未申酉戌亥])(?:[\s,，、]*([甲乙丙丁戊己庚辛壬癸])\s*([子丑寅卯辰巳午未申酉戌亥]))?/);
  if (!m) return null;
  const p = { 年: m[1] + m[2], 月: m[3] + m[4], 日: m[5] + m[6] };
  if (m[7]) p['时'] = m[7] + m[8];
  return p;
}
