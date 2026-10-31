/**
 * src/core/four-pillars/chart.js —— 四柱八字排盘（自研，零依赖）
 *
 * 大白话：八字就是把人出生的一刻，按「年柱、月柱、日柱、时柱」四个干支柱写出来，
 * 每柱两字共八个字。本模块只做「排盘 + 基础属性」，不做吉凶预测。
 *
 * 文献依据：《三命通会·论遁月时》五虎遁与五鼠遁古歌「甲巳之年丙作首……遁时如甲子日子时生人即甲巳还加甲」；
 *   《三命通会·论年月日时》「年以立春为界、月以节气为界」；《渊海子平·喜忌篇》「五行绝处，即是胎元」。
 * 口径（与 docs/CALIBER-NOTES.md 一致）：
 *   · 年柱：立春交节换年（getYearInGanZhiByLiChun 口径），生肖随年柱地支；
 *   · 月柱：节气换月（交节当天算新月），月干用五虎遁由年干推；
 *   · 日柱：23:00（子初）换日；日柱纯按儒略日推，与年月柱无关；
 *   · 时柱：由「本层日干」五鼠遁现算，不借用任何底座的时柱（避免 23 时换日错配）；
 *   · 胎元：月干进一位、月支进三位。
 * 所有数值随结果一起输出「推算依据」，不做断言式吉凶判断。
 */

import {
  STEMS, BRANCHES, CANGGAN, NAYIN, SEXAGENARY, nayinOf, xunkongOf,
  shiShen, cs12Of, taiyuanOf, SEXAGENARY as GZ,
} from '../common/constants.js';
import {
  daySexagenary, daySexagenaryIndex, yearSexagenaryIndex, monthSexagenary, hourSexagenary,
  effectiveDay, hourBranchIndex, zodiacSign,
} from '../calendar/sexagenary.js';
import { solarToLunisolar, LUNAR_MONTH_NAMES, LUNAR_DAY_NAMES } from '../calendar/lunisolar.js';
import { monthCommandOf } from './month-command.js';

/**
 * 命宫（《三命通会·论坐命宫》原文）：
 *   「先将所生之月从子上起正月、亥上二月、戌三酉四申五未六午七巳八辰九卯十寅十一丑十二，
 *    逆行十二位；次将所生之时加于所生之月，顺行十二位，逢卯即安命宫。」
 *   「经云：天轮转出地轮上，卯上分明是命宫是也。」
 *   原书算例：甲子年三月生人得戌时 → 命坐卯宫，宫干随年干五虎遁得丁卯。
 *
 * 算法：月位 p0 = (12 - (月序 - 1)) % 12（正月在子、二月在亥…逆行）；
 *   命宫位 = (p0 + (卯序 3 - 时支序)) mod 12；宫干用五虎遁由年干推。
 * 月序取「节气月建」（寅月为正月），与八字月柱同源；交节当日前后与农历月序可能相差一月，
 * 已在 docs/CALIBER-NOTES.md 标注。
 */
function mingGongOf(monthBranchIdx, hourZhiIdx, yearGanIdx) {
  const monthOrder = ((monthBranchIdx - 2) % 12 + 12) % 12 + 1; // 寅月=正月
  const p0 = ((12 - (monthOrder - 1)) % 12 + 12) % 12;
  const pos = ((p0 + (3 - hourZhiIdx)) % 12 + 12) % 12;
  // 五虎遁：甲己之年丙作首 → 寅月干序 = (年干序 % 5) * 2 + 2
  const yinGan = ((yearGanIdx % 5) * 2 + 2) % 10;
  const ganIdx = (yinGan + ((pos - 2) % 12 + 12) % 12) % 10;
  return { 位: pos, 支: BRANCHES[pos].z, 干: STEMS[ganIdx].z, 干支: STEMS[ganIdx].z + BRANCHES[pos].z };
}

/** 阴阳标记 */
const YY = ['阳', '阴'];

/**
 * 单柱对象：把「干/支」展开成八字需要的全部属性。
 * @param {String} ganZhi 两字干支
 * @param {String} dayGan 日干（用于十神/星运）
 * @param {String} [pos] 柱位（年/月/日/时）；日柱十神固定写「日主」
 */
function pillarOf(ganZhi, dayGan, pos) {
  const g = ganZhi[0], z = ganZhi[1];
  const gInfo = STEMS.find((x) => x.z === g);
  const zInfo = BRANCHES.find((x) => x.z === z);
  const gzIdx = SEXAGENARY.findIndex((x) => x[0] === g && x[1] === z);
  const cang = CANGGAN[z] || [];
  // 十神：日柱标「日主」，年/月/时一律按日干推（同干记比肩）；藏干十神以日干为参照
  const shiShenGan = pos === '日' ? '日主' : shiShen(dayGan, g);
  return {
    干: g,
    支: z,
    干支: ganZhi,
    干五行: gInfo.wx,
    支五行: zInfo.wx,
    阴阳: YY[gInfo.yy],
    十神: shiShenGan,
    藏干: cang,
    藏干十神: cang.map((c) => shiShen(dayGan, c)),
    纳音: nayinOf(gzIdx),
    旬空: xunkongOf(gzIdx),
    星运: cs12Of(dayGan, z), // 日干在该柱地支的十二长生
    自坐: cs12Of(g, z), // 本柱天干在本柱地支的生旺状态
  };
}

/**
 * 排盘主入口。
 * @param {Object} input {y,m,d,h=12, minute=0, gender='男'|'女', sect='ziChu'|'ziZheng'}
 */
export function fourPillarsChart(input) {
  const { y, m, d, h = 12, minute = 0, gender = '男', sect = 'ziChu' } = input;
  // 日柱换日：ziChu=子初(23:00) 换日（默认），ziZheng=子正(00:00) 换日
  const eff = sect === 'ziZheng' ? { y, m, d } : effectiveDay(y, m, d, h);

  // 立春当日交节时刻前出生仍属上一年：传 hour 供时刻判定（换日后的 eff 日期 + 原始 h）
  // 年柱按「原始出生时刻」判立春年界（旧库 getYearInGanZhiExact 口径）：
  // 晚子时(23:00)日柱换日，但年/月柱仍按原始时刻——1901-2-3 23 时日柱已入 2-4，
  // 而立春(2-4 19:39)未到，年柱仍是上一年庚子
  const yearGz = GZJIAZI(yearSexagenaryIndex(y, m, d, h));
  const monthGz = monthSexagenary(y, m, d, h, minute); // 交节时刻前仍属上一月（精确到分钟）
  const monthIdx = SEXAGENARY.findIndex((x) => x[0] === monthGz[0] && x[1] === monthGz[1]);
  const dayIdx = daySexagenaryIndex(eff.y, eff.m, eff.d);
  const dayGz = SEXAGENARY[dayIdx].join('');
  const hourGz = hourSexagenary(dayGz[0], h); // 时干必须用「换日后的日干」现算
  const dayGan = dayGz[0];

  const pillars = {
    年: pillarOf(yearGz, dayGan, '年'),
    月: pillarOf(monthGz, dayGan, '月'),
    日: pillarOf(dayGz, dayGan, '日'),
    时: pillarOf(hourGz, dayGan, '时'),
  };

  // 五行统计（8 字本气）
  const wx = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const k of ['年', '月', '日', '时']) {
    wx[pillars[k].干五行]++;
    wx[pillars[k].支五行]++;
  }
  const total = 8;
  // 百分比用「最大余数法」分配到 100：直接四舍五入会出现 38+25+38=101 这类和不为 100 的情况。
  const pct = {};
  {
    const raw = Object.keys(wx).map((k) => ({ k, v: (wx[k] / total) * 100 }));
    const floor = raw.map((x) => ({ ...x, n: Math.floor(x.v), r: x.v - Math.floor(x.v) }));
    let left = 100 - floor.reduce((a, b) => a + b.n, 0);
    floor.slice().sort((a, b) => b.r - a.r).forEach((x) => {
      if (left > 0) { x.n += 1; left -= 1; }
    });
    floor.forEach((x) => { pct[x.k] = x.n; });
  }
  const lack = Object.keys(wx).filter((k) => wx[k] === 0);

  const lunar = solarToLunisolar(eff.y, eff.m, eff.d);
  const shengxiao = zodiacSign(eff.y, eff.m, eff.d);

  return {
    input: { y, m, d, h, minute, gender, sect },
    solar: `${eff.y}-${String(eff.m).padStart(2, '0')}-${String(eff.d).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`,
    lunar: lunar ? `${lunar.y}年${lunar.isLeap ? '闰' : ''}${LUNAR_MONTH_NAMES[lunar.m - 1]}月${LUNAR_DAY_NAMES[lunar.d]}` : '',
    shengxiao,
    pillars,
    日主: { 干: dayGan, 五行: STEMS.find((g) => g.z === dayGan).wx, 阴阳: YY[STEMS.find((g) => g.z === dayGan).yy] },
    藏干: { 年: pillars.年.藏干, 月: pillars.月.藏干, 日: pillars.日.藏干, 时: pillars.时.藏干 },
    纳音: { 年: pillars.年.纳音, 月: pillars.月.纳音, 日: pillars.日.纳音, 时: pillars.时.纳音 },
    旬空: { 年: pillars.年.旬空, 月: pillars.月.旬空, 日: pillars.日.旬空, 时: pillars.时.旬空 },
    胎元: taiyuanOf(monthIdx % 10, monthIdx % 12),
    命宫: mingGongOf(monthIdx % 12, hourBranchIndex(h), SEXAGENARY.findIndex((x) => x[0] === yearGz[0] && x[1] === yearGz[1]) % 10),
    五行: { 统计: wx, 百分比: pct, 缺: lack, 缺文本: lack.length ? lack.join('、') + '缺' : '五行俱全' },
    月令司令: monthCommandOf(y, m, d, h, minute),
    换日口径: sect === 'ziZheng' ? '子正(00:00)换日' : '子初(23:00)换日',
  };
}

/** 甲子序 → 干支字符串（越界自动取模） */
function GZJIAZI(i) {
  return SEXAGENARY[((i % 60) + 60) % 60].join('');
}

/** 四柱纯文本（供结果页标题） */
export function pillarsText(c) {
  return ['年', '月', '日', '时'].map((k) => c.pillars[k].干支).join(' ');
}

export { daySexagenary, hourBranchIndex, STEMS, BRANCHES };
