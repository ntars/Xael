/**
 * src/core/features/analyzer.js —— 分析入口（搜索问句 → 排盘结果）
 *
 * 大白话：把用户输入的一句自然语言，变成一个或多个排盘结果。
 * 流程：
 *   1. 主题关键词拦截（切换深色/浅色 → 直接改主题，不排盘）；
 *   2. 触发词匹配（registry.js 最长优先）；
 *   3. 命中多个 → 并列排盘；命中 1 个 → 单盘；
 *   4. 生辰闸门：命理类功能缺生辰时，就地返回拒绝码（不跳页）。
 * 拒绝码四类：birth（未给生辰）/ lunar（农历解析失败）/ pillar（四柱解析失败）/ nonmeta（非术数问句）。
 */

import { matchFeature, runFeature } from './registry.js';
import { THEME_KEYWORDS, setTheme } from '../../shared/settings.js';

/**
 * 解析生辰（自然语言 → {y,m,d,h,性别,姓名}）。
 * 支持四种写法：国历（1990年6月15日 10点）/ 农历（农历1990年五月廿三）/ 四柱（庚午年壬午月辛亥日）/ 八字（庚午 壬午 辛亥 癸巳）。
 * 中文数字、全角、夹杂姓名性别容错。缺时辰按 14 时补。
 */
export function parseBirth(q) {
  const s = String(q).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  // 国历
  const m1 = s.match(/(\d{4})\s*[年.\-/]\s*(\d{1,2})\s*[月.\-/]\s*(\d{1,2})\s*日?/);
  if (m1) {
    const h = parseHour(s);
    const gender = /女/.test(s) ? '女' : /男/.test(s) ? '男' : undefined;
    return { y: +m1[1], m: +m1[2], d: +m1[3], h, gender, lunar: false };
  }
  // 四柱
  const m2 = s.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s*[年 ]\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s*[月 ]\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s*[日 ]\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/);
  if (m2) return { pillars: [m2[1], m2[2], m2[3], m2[4]], h: parseHour(s), gender: /女/.test(s) ? '女' : undefined, pillar: true };
  // 农历
  const m3 = s.match(/农历\s*(\d{4})[年 ]+(\S{1,3})月\s*(\S{1,3})日?/);
  if (m3) {
    const leap = /闰/.test(m3[2]);
    const mm = cnNum(m3[2].replace('闰', ''));
    const dd = cnDay(m3[3]);
    if (mm && dd) {
      const h = parseHour(s);
      return { y: +m3[1], m: mm, d: dd, h, gender: /女/.test(s) ? '女' : undefined, lunar: true, leap };
    }
    return { error: 'lunar' };
  }
  return null;
}

/** 时辰解析（默认 14 时=未时） */
function parseHour(s) {
  const m = s.match(/(\d{1,2})[点时:：]/);
  if (m) return Math.max(0, Math.min(23, +m[1]));
  const zhi = s.match(/([子丑寅卯辰巳午未申酉戌亥])时/);
  if (zhi) {
    const idx = ['子丑寅卯辰巳午未申酉戌亥'].indexOf(zhi[1]) + 1;
    return idx * 2 - 1; // 时支中点（子时23、丑时1……）
  }
  return 14;
}

/** 中文数字（月） */
function cnNum(s) {
  const map = { 正: 1, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 冬: 11, 腊: 12 };
  if (map[s]) return map[s];
  if (/^十[一二三四五六七八九]$/.test(s)) return 10 + map[s[1]];
  return map[s] || null;
}

/** 中文日（初一~三十） */
function cnDay(s) {
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (s === '十') return 10;
  if (s === '二十') return 20;
  if (s === '三十') return 30;
  if (/^初|^十|^廿|^三十/.test(s)) {
    const body = s.replace(/^(初|廿|三十|二十|十)/, (m0) => ({ 初: '', 廿: '十', 三十: '三十', 二十: '二十', 十: '十' }[m0]));
    if (/^廿/.test(s)) return 20 + (map[s[1]] || 0);
    if (/^三十/.test(s)) return 30;
    if (/^二十/.test(s)) return 20 + (map[s[2]] || 0);
    if (/^十/.test(s)) return 10 + (map[s[1]] || 0);
    return map[s[1]] || null;
  }
  return map[s] || null;
}

/**
 * 主入口：一句问话 → 页面渲染模型。
 * @returns {{type:'theme',value}|{type:'results',results}|{type:'refuse',code,message}}
 */
export async function analyze(q) {
  const text = String(q || '').trim();
  if (!text) return { type: 'refuse', code: 'nonmeta', message: '想了解点什么？' };

  // 主题关键词
  for (const t of THEME_KEYWORDS) {
    if (t.words.some((w) => text.includes(w))) {
      setTheme(t.value);
      return { type: 'theme', value: t.value };
    }
  }

  // 触发词匹配（最长优先）
  const hits = matchFeature(text);
  if (!hits.length) {
    return { type: 'refuse', code: 'nonmeta', message: '没听懂这个问题，换个说法试试。' };
  }

  // 生辰闸门：需要生辰的功能而问句无生辰
  const needsBirth = hits.some((f) => f.needsBirth);
  let birth = null;
  if (needsBirth) {
    birth = parseBirth(text);
    if (!birth) {
      return { type: 'refuse', code: 'birth', message: '请补全出生信息，例如「1990年6月15日 10点 排八字」。' };
    }
    if (birth.error) {
      return { type: 'refuse', code: birth.error, message: '生辰写法没解析出来，请换一种写法（国历/农历/四柱）。' };
    }
  }

  // 逐个执行，多命中并列
  const results = [];
  for (const f of hits) {
    const r = await runFeature(f, birth);
    if (r) results.push(r);
  }
  if (!results.length) return { type: 'refuse', code: 'nonmeta', message: '这个功能暂时没有算出来。' };
  return { type: 'results', results };
}
