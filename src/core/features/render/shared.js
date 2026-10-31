/**
 * src/core/features/render/shared.js —— 文本出料层的公共零件
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 *
 * 大白话：每个功能算完以后，要把结构化结果写成「一行行给人读的中文」。
 * 写这些行时有几条全项目统一的规矩，都放在这里，别每个功能各写一份——
 *   1. 一行之内不出现中文分号「；」，因为结果页是按「。」和换行切段的，
 *      夹着分号会把一句话切成两半（历史踩坑，切段护栏靠这条）；
 *   2. 数字、单位、日期写法统一（年月日时、公历农历）；
 *   3. 缺料就直说缺什么，不要瞎编一个 1 月 1 日算下去。
 */

/** 六十甲子（干支下标 i%60 → 干支） */
export const GANZHI60 = (() => {
  const STEMS = '甲乙丙丁戊己庚辛壬癸';
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const out = [];
  for (let i = 0; i < 60; i++) out.push(STEMS[i % 10] + BRANCHES[i % 12]);
  return out;
})();

/** 十二地支（书写序：子起） */
export const ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 九宫展示序（洛书地理顺时针：坎一 艮八 震三 巽四 离九 坤二 兑七 乾六） */
export const GONG8 = [1, 8, 3, 4, 9, 2, 7, 6];

/** 星期几（中文） */
export function weekdayOf(y, m, d) {
  return ['日', '一', '二', '三', '四', '五', '六'][new Date(y, m - 1, d).getDay()];
}

/** 把一段话里的「；」换成「，」，句末多个句号并一个 —— 切段护栏 */
/** 数组按句连写（用于「口径」这类分行声明的字段）：['甲。','乙。'] → '甲。乙。' */
export function joinClauses(v) {
  if (!Array.isArray(v)) return String(v == null ? '' : v);
  return v.map((x) => String(x == null ? '' : x).trim()).filter(Boolean)
    .map((x) => (/[。！？]$/.test(x) ? x : x + '。')).join('');
}

export function tidy(s) {
  if (Array.isArray(s)) return tidy(joinClauses(s));
  return String(s == null ? '' : s)
    .replace(/；/g, '，')
    .replace(/，{2,}/g, '，')
    .replace(/^，+|，+$/g, '')
    .replace(/。{2,}/g, '。');
}

/** 九宫盘（{宫号: 值}）→「宫1X 宫8Y …」 */
export function gongLine(pan, order = GONG8) {
  return order.map((p) => '宫' + p + (pan[p] == null ? '—' : pan[p])).join(' ');
}

/** 九宫九星名的中文数字星号 */
export const STAR_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 数字 → 中文（1→一 … 9→九），九宫/飞星术语一律写中文 */
export function cnNum(n) {
  return STAR_CN[n - 1] || String(n);
}

/** 句子统一以单个句号收尾（内核文案本身可能已带） */
export function dot(v) {
  const t = String(v == null ? '' : v).replace(/。+$/, '').trim();
  return t ? t + '。' : '';
}

/** 段落整体收尾：内部已有句号不动，末尾补一个 */
export function dotBlock(v) {
  const t = String(v == null ? '' : v).trim();
  if (!t) return '';
  return /[。！？）]$/.test(t) ? t : t + '。';
}
