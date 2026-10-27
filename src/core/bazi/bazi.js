/**
 * src/core/bazi/bazi.js —— 四柱八字排盘（自研，零依赖）
 *
 * 大白话：八字就是把人出生的一刻，按「年柱、月柱、日柱、时柱」四个干支柱写出来，
 * 每柱两字共八个字。本模块只做「排盘 + 基础属性」，不做吉凶预测。
 *
 * 口径（与 docs/CALIBER-NOTES.md 一致）：
 *   · 年柱：立春交节换年（getYearInGanZhiByLiChun 口径），生肖随年柱地支；
 *   · 月柱：节气换月（交节当天算新月），月干用五虎遁由年干推；
 *   · 日柱：23:00（子初）换日；日柱纯按儒略日推，与年月柱无关；
 *   · 时柱：由「本层日干」五鼠遁现算，不借用任何底座的时柱（避免 23 时换日错配）；
 *   · 胎元：月干进一位、月支进三位。
 * 所有数值随结果一起输出「推算依据」，不做断言式吉凶判断。
 */

import {
  GAN, ZHI, CANGGAN, NAYIN, JIAZI, nayinOf, xunkongOf,
  shiShen, cs12Of, taiyuanOf, JIAZI as GZ,
} from '../common/constants.js';
import {
  dayGanZhi, dayGanZhiIndex, yearGanZhiIndexByLichun, monthGanZhi, hourGanZhi,
  effectiveDay, hourZhiIndex, zodiacByLichun,
} from '../calendar/ganzhi.js';
import { solarToLunar, LUNAR_MONTH_NAMES, LUNAR_DAY_NAMES } from '../calendar/lunar2.js';

/** 阴阳标记 */
const YY = ['阳', '阴'];

/**
 * 单柱对象：把「干/支」展开成八字需要的全部属性。
 * @param {String} ganZhi 两字干支
 * @param {String} dayGan 日干（用于十神/星运）
 */
function pillarOf(ganZhi, dayGan) {
  const g = ganZhi[0], z = ganZhi[1];
  const gInfo = GAN.find((x) => x.z === g);
  const zInfo = ZHI.find((x) => x.z === z);
  const gzIdx = JIAZI.findIndex((x) => x[0] === g && x[1] === z);
  const cang = CANGGAN[z] || [];
  return {
    干: g,
    支: z,
    干支: ganZhi,
    干五行: gInfo.wx,
    支五行: zInfo.wx,
    阴阳: YY[gInfo.yy],
    十神: g === dayGan ? '日主' : shiShen(dayGan, g),
    藏干: cang,
    藏干十神: cang.map((c) => (c === dayGan ? '日主' : shiShen(dayGan, c))),
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
export function chart(input) {
  const { y, m, d, h = 12, gender = '男', sect = 'ziChu' } = input;
  // 日柱换日：ziChu=子初(23:00) 换日（默认），ziZheng=子正(00:00) 换日
  const eff = sect === 'ziZheng' ? { y, m, d } : effectiveDay(y, m, d, h);

  const yearGz = GZJIAZI(yearGanZhiIndexByLichun(eff.y, eff.m, eff.d));
  const monthGz = monthGanZhi(y, m, d);
  const monthIdx = JIAZI.findIndex((x) => x[0] === monthGz[0] && x[1] === monthGz[1]);
  const dayIdx = dayGanZhiIndex(eff.y, eff.m, eff.d);
  const dayGz = JIAZI[dayIdx].join('');
  const hourGz = hourGanZhi(dayGz[0], h); // 时干必须用「换日后的日干」现算
  const dayGan = dayGz[0];

  const pillars = {
    年: pillarOf(yearGz, dayGan),
    月: pillarOf(monthGz, dayGan),
    日: pillarOf(dayGz, dayGan),
    时: pillarOf(hourGz, dayGan),
  };

  // 五行统计（8 字本气）
  const wx = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const k of ['年', '月', '日', '时']) {
    wx[pillars[k].干五行]++;
    wx[pillars[k].支五行]++;
  }
  const total = 8;
  const pct = {};
  for (const k in wx) pct[k] = Math.round((wx[k] / total) * 100);
  const lack = Object.keys(wx).filter((k) => wx[k] === 0);

  const lunar = solarToLunar(eff.y, eff.m, eff.d);
  const shengxiao = zodiacByLichun(eff.y, eff.m, eff.d);

  return {
    input: { y, m, d, h, gender, sect },
    solar: `${eff.y}-${String(eff.m).padStart(2, '0')}-${String(eff.d).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`,
    lunar: lunar ? `${lunar.y}年${lunar.isLeap ? '闰' : ''}${LUNAR_MONTH_NAMES[lunar.m - 1]}月${LUNAR_DAY_NAMES[lunar.d]}` : '',
    shengxiao,
    pillars,
    日主: { 干: dayGan, 五行: GAN.find((g) => g.z === dayGan).wx, 阴阳: YY[GAN.find((g) => g.z === dayGan).yy] },
    藏干: { 年: pillars.年.藏干, 月: pillars.月.藏干, 日: pillars.日.藏干, 时: pillars.时.藏干 },
    纳音: { 年: pillars.年.纳音, 月: pillars.月.纳音, 日: pillars.日.纳音, 时: pillars.时.纳音 },
    旬空: { 年: pillars.年.旬空, 月: pillars.月.旬空, 日: pillars.日.旬空, 时: pillars.时.旬空 },
    胎元: taiyuanOf(monthIdx % 10, monthIdx % 12),
    五行: { 统计: wx, 百分比: pct, 缺: lack, 缺文本: lack.length ? lack.join('、') + '缺' : '五行俱全' },
    换日口径: sect === 'ziZheng' ? '子正(00:00)换日' : '子初(23:00)换日',
  };
}

/** 甲子序 → 干支字符串（越界自动取模） */
function GZJIAZI(i) {
  return JIAZI[((i % 60) + 60) % 60].join('');
}

/** 四柱纯文本（供结果页标题） */
export function pillarsText(c) {
  return ['年', '月', '日', '时'].map((k) => c.pillars[k].干支).join(' ');
}

export { dayGanZhi, hourZhiIndex, GAN, ZHI };
