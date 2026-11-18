/**
 * src/core/calendar/sexagenary.js —— 干支纪年纪月纪日纪时（自研，零依赖）
 * 算法来源：干支纪日以儒略日序取模（连续纪日自公元前 720 年起无间断），
 *   年柱立春换年、月柱节气换月见《三命通会·论年月日时》。
 *
 * 大白话：干支 = 十天干配十二地支的 60 轮转表。
 * 口径（与产品定式一致）：
 *   - 日干支：儒略日 mod 60（锚：JDN%60=11 为甲子日；2000-01-01=戊午、1949-10-01=甲子）
 *   - 年干支（历法展示口径）：以立春交节日换年
 *   - 月干支：以十二节（立春/惊蛰/清明…小寒）交节日换月，月干由年干五虎遁
 *   - 时干支：23:00 起子时且换日（晚子归次日），时干由五鼠遁现算
 */

import { solarToJdn, jdnToSolar, pad2 } from './julian.js';
import { solarTermsTable } from './solar-terms.js';
import { wuShuDun, STEMS, BRANCHES } from '../common/constants.js';

import { JIE_OF_MONTH } from './solar-terms.js';
/** JDN mod 60 = 11 为甲子日。校准锚：2000-01-01=戊午、1949-10-01=甲子、1984-02-02=丙寅。 */
export const JDN_MOD_JIAZI = 11;

const GZ = [];
for (let i = 0; i < 60; i++) GZ.push(STEMS[i % 10].z + BRANCHES[i % 12].z);

/** 日干支序（0=甲子 … 59=癸亥），自然日 */
export function daySexagenaryIndex(y, m, d) {
  const jdn = solarToJdn(y, m, d);
  return ((jdn - JDN_MOD_JIAZI) % 60 + 60) % 60;
}

export function daySexagenary(y, m, d) {
  return GZ[daySexagenaryIndex(y, m, d)];
}

/**
 * 年干支序（立春口径）：立春交节日前属上一年。
 * @param {Number} y 公历年 m 月 d 日
 */
export function yearSexagenaryIndex(y, m, d, hour) {
  const lc = solarTermsTable(y)['立春'];
  // 立春交节「当日」还要看时刻：交节时刻之前出生仍属上一年（hour 可缺省=按整天已过交节）
  let effectiveYear;
  if (m < lc.m) effectiveYear = y - 1;
  else if (m > lc.m) effectiveYear = y;
  else if (d < lc.d) effectiveYear = y - 1;
  else if (d > lc.d) effectiveYear = y;
  else {
    // 立春当日：按「真实秒」判（旧库秒级精确；分钟/秒缺省按 0，
    // 如立春 12:00:58，12 时出生仍未换年）
    effectiveYear = (hour != null && !jiePassed(lc, lc.d, hour, 0)) ? y - 1 : y;
  }
  return ((effectiveYear - 4) % 60 + 60) % 60; // 公元 4 年 = 甲子年
}

export function yearSexagenary(y, m, d, hour) {
  return GZ[yearSexagenaryIndex(y, m, d, hour)];
}

/** 十二节与公历月的对应：统一取自 solar-terms.js，不在此另抄一份 */
const MONTH_JIE = JIE_OF_MONTH;

/** 分钟级交节判定：给了 hour 就连分钟一起比；hour 缺省时按整天，只比日期。
 *  （旧库精确到秒，我们到分钟已是当前历法精度上限） */
function jiePassed(jie, d, hour, minute) {
  if (d !== jie.d) return d > jie.d;
  if (hour == null) return true; // 未给时刻 → 视为当日已过交节
  // 交节当日按「真实秒」判：旧库用精确到秒的交节时刻（getMonthInGanZhiExact），
  // 分钟只到分不行——1904-06-06 芒种 12:00:58，出生 12 时（分缺省 0）仍未交节（旧库己巳月）。
  // 相等也按「未交」：参照实现在展示层四舍五入到分，交节秒残差普遍 >0，
  // 出生时刻恰等于该分钟时实际仍在交节之前（1995-07-07 22:00 小暑例）。
  const t = hour * 3600 + (minute || 0) * 60;
  const j = jie.hh * 3600 + jie.mm * 60 + (jie.sec || 0);
  return t > j;
}

/** 月支序（0=子…11=亥）：节前属上一月支；1 月小寒前属上年子月。
 *  hour/minute：交节「当日」的交节时刻前仍属上一月支（可缺省=按整天已过交节）。 */
export function monthBranchIndex(y, m, d, hour, minute) {
  const jie = solarTermsTable(y)[MONTH_JIE[m]];
  const before = !jiePassed(jie, d, hour, minute);
  if (m === 1) return before ? 0 : 1;
  return before ? (m - 1) % 12 : m % 12;
}

/** 月柱：月支按节气（含交节时刻），月干五虎遁（年干立春口径） */
export function monthSexagenary(y, m, d, hour, minute) {
  const zhiIdx = monthBranchIndex(y, m, d, hour, minute);
  // 月干由「该节气月所在农历年」的年干定：
  // 丑月（1月小寒后~2月立春前）属上一农历年；其余节气月属本年
  const jie = solarTermsTable(y)[MONTH_JIE[m]];
  // 交节时刻前仍属上一节气月 → 月干随上一农历年（立春/小寒前的丑月、子月尾都算上年）
  const before = !jiePassed(jie, d, hour, minute);
  let yForGan = y;
  if (m === 1 || (m === 2 && before)) yForGan = y - 1; // 1 月整月 + 立春交节前的 2 月都属上一农历年
  const lc = solarTermsTable(yForGan)['立春'];
  const yGanIdx = yearSexagenaryIndex(yForGan, lc.m, lc.d + 1) % 10; // 立春后一天取年干
  const offFromYin = ((zhiIdx - 2) % 12 + 12) % 12; // 距寅的偏移
  const ganIdx = (((yGanIdx % 5) * 2 + 2) + offFromYin) % 10;
  return STEMS[ganIdx].z + BRANCHES[zhiIdx].z;
}

/** 时支序：23:00-00:59 = 子 */
export function hourBranchIndex(h) {
  return Math.floor(((h + 1) % 24) / 2);
}

/** 时柱：由（换日后的）日干五鼠遁现算 */
export function hourSexagenary(dayGan, h) {
  const t = hourBranchIndex(h);
  const g = STEMS.findIndex((x) => x.z === dayGan);
  const ganIdx = wuShuDun(g, t);
  return STEMS[ganIdx].z + BRANCHES[t].z;
}

/** 晚子换日：h>=23 用次日公历 */
export function effectiveDay(y, m, d, h) {
  if (h >= 23) return jdnToSolar(solarToJdn(y, m, d) + 1);
  return { y, m, d };
}

/** 干支序转字 / 字转序 */
export function sexagenaryText(idx) { return GZ[((idx % 60) + 60) % 60]; }
export function sexagenaryIndex(text) { return GZ.indexOf(text); }

/** 生肖（立春口径，随年柱支） */
export function zodiacSign(y, m, d) {
  return BRANCHES[yearSexagenaryIndex(y, m, d) % 12].sx;
}

export { GZ, pad2 };

/**
 * 按节气判定季节（天赦等用）：立夏前=春、立秋前=夏、立冬前=秋、其余=冬。
 */
export function seasonOf(y, m, d) {
  const t = solarTermsTable(y);
  const target = y * 10000 + m * 100 + d;
  const j = (name) => { const [yy, mm, dd] = t[name].text.split('-').map(Number); return yy * 10000 + mm * 100 + dd; };
  if (target < j('立夏')) return '春';
  if (target < j('立秋')) return '夏';
  if (target < j('立冬')) return '秋';
  return '冬';
}
