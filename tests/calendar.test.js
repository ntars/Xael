/**
 * tests/calendar.test.js —— 历法内核测试（Node 直跑，零依赖断言）
 * 运行：node tests/calendar.test.js
 */

import {
  solarToJdn, jdnToSolar, dayNo, fromDayNo, weekday, isLeap, daysInMonth,
} from '../src/core/calendar/solar.js';
import { jieqiTable, prevJieqi, nextJieqi } from '../src/core/calendar/jieqi2.js';
import {
  solarToLunar, lunarToSolar, lunarYearDays, leapMonth, lunarDayText,
} from '../src/core/calendar/lunar2.js';
import {
  dayGanZhi, yearGanZhiByLichun, monthGanZhi, hourGanZhi, effectiveDay, hourZhiIndex,
} from '../src/core/calendar/ganzhi.js';

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  if (actual === expected) { pass++; } else { fail++; console.error(`✗ ${label}: 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`); }
}

// ---------- 儒略日 / 公历工具 ----------
eq(solarToJdn(2000, 1, 1), 2451545, 'JDN 2000-01-01');
eq(jdnToSolar(2451545).d, 1, 'JDN 反推日');
eq(jdnToSolar(2451545).m, 1, 'JDN 反推月');
eq(jdnToSolar(2451545).y, 2000, 'JDN 反推年');
eq(dayNo(1970, 1, 1), 0, 'Unix 日序原点');
eq(fromDayNo(0).y, 1970, '日序反推年');
eq(weekday(2024, 1, 1), 1, '2024-01-01 星期一');
eq(isLeap(2000), true, '2000 闰年');
eq(isLeap(1900), false, '1900 平年');
eq(daysInMonth(2000, 2), 29, '2000-02 天数');
eq(daysInMonth(1900, 2), 28, '1900-02 天数');

// ---------- 节气（天文算法，分钟级） ----------
const t2024 = jieqiTable(2024);
eq(t2024['立春'].text, '2024-02-04', '2024 立春');
eq(t2024['冬至'].text, '2024-12-21', '2024 冬至');
eq(t2024['夏至'].text, '2024-06-21', '2024 夏至');
eq(t2024['小寒'].text, '2024-01-06', '2024 小寒');
eq(t2024['大雪'].text, '2024-12-06', '2024 大雪');
const t2000 = jieqiTable(2000);
eq(t2000['春分'].text, '2000-03-20', '2000 春分');
eq(t2000['立春'].text, '2000-02-04', '2000 立春');
eq(t2000['冬至'].text, '2000-12-21', '2000 冬至');
eq(prevJieqi(2024, 2, 10).名, '立春', '2024-02-10 上一节气');
eq(nextJieqi(2024, 2, 10).名, '雨水', '2024-02-10 下一节气');
// 全表顺序单调递增（2020-2030 十年 × 24 节气）
let sorted = true;
for (let y = 2020; y <= 2030; y++) {
  const t = jieqiTable(y);
  const seq = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
  for (let i = 1; i < 24; i++) if (t[seq[i]].text < t[seq[i - 1]].text) { sorted = false; }
}
eq(sorted, true, '2020-2030 节气表年序单调');

// ---------- 农历（天文朔日版） ----------
eq(lunarDayText(2024, 2, 10), '正月初一', '2024 春节');
eq(lunarDayText(2025, 1, 29), '正月初一', '2025 春节');
eq(lunarDayText(2024, 9, 17), '八月十五', '2024 中秋');
eq(lunarDayText(2023, 3, 22), '闰二月初一', '2023 闰二月初一');
eq(lunarDayText(2025, 7, 25), '闰六月初一', '2025 闰六月初一');
eq(leapMonth(2023), 2, '2023 闰二月');
eq(leapMonth(2025), 6, '2025 闰六月');
eq(leapMonth(2024), 0, '2024 无闰月');
eq(lunarYearDays(2024), 384, '2024 农历年天数');
// 往返一致（1901-2099 广域抽样）
let rt = true;
for (let n = dayNo(1901, 1, 5); n <= dayNo(2099, 12, 25); n += 397) {
  const s = fromDayNo(n);
  const l = solarToLunar(s.y, s.m, s.d);
  if (!l) { rt = false; break; }
  const s2 = lunarToSolar(l.y, l.m, l.d, l.isLeap);
  if (s2.y !== s.y || s2.m !== s.m || s2.d !== s.d) { rt = false; console.error('往返失败', s, l, s2); break; }
}
eq(rt, true, '农历往返一致（1901-2099 抽样）');

// ---------- 干支（锚点=公开万年历事实） ----------
eq(dayGanZhi(2000, 1, 1), '戊午', '2000-01-01 戊午日');
eq(dayGanZhi(1949, 10, 1), '甲子', '1949-10-01 甲子日');
eq(dayGanZhi(1984, 2, 2), '丙寅', '1984-02-02 丙寅日');
eq(dayGanZhi(1900, 1, 1), '甲戌', '1900-01-01 甲戌日');
eq(yearGanZhiByLichun(2024, 2, 10), '甲辰', '2024-02-10 年柱 甲辰');
eq(yearGanZhiByLichun(2024, 2, 3), '癸卯', '2024-02-03（立春前）年柱 癸卯');
eq(yearGanZhiByLichun(2024, 2, 4), '甲辰', '2024-02-04（立春日）年柱 甲辰');
eq(monthGanZhi(2024, 2, 10), '丙寅', '2024-02-10 月柱 丙寅');
eq(monthGanZhi(2024, 1, 10), '乙丑', '2024-01-10（小寒后）月柱 乙丑');
eq(monthGanZhi(2024, 1, 5), '甲子', '2024-01-05（小寒前）月柱 甲子');
eq(monthGanZhi(2023, 12, 10), '甲子', '2023-12-10（大雪后）月柱 甲子');
eq(monthGanZhi(2023, 12, 5), '癸亥', '2023-12-05（大雪前）月柱 癸亥');
eq(hourZhiIndex(23), 0, '23 时子支');
eq(hourZhiIndex(0), 0, '0 时子支');
eq(hourZhiIndex(14), 7, '14 时未支');
eq(hourGanZhi('甲', 14), '辛未', '甲日 14 时 辛未时');
eq(hourGanZhi('甲', 23), '甲子', '甲日 23 时 甲子时');
eq(effectiveDay(2024, 1, 1, 23).d, 2, '23 时换次日');

// ---------- 黄历（部件核验，事实=公开万年历） ----------
const { daily, monthView, jieqiAround } = await import('../src/core/huangli/daily.js');
const h1 = daily(2024, 2, 10);
eq(h1.ganzhi.日, '甲辰', '黄历 2024-02-10 日柱');
eq(h1.值星.名, '满', '黄历 2024-02-10 值星');
eq(h1.二十八宿.宿, '氐', '黄历 2024-02-10 值宿二十八宿');
eq(h1.冲煞.冲, '庚戌', '黄历 2024-02-10 冲');
eq(h1.冲煞.冲生肖, '龙', '黄历 2024-02-10 冲生肖');
eq(h1.冲煞.煞方, '南', '黄历 2024-02-10 煞方');
eq(h1.彭祖百忌.干, '甲不开仓财物耗散', '黄历 2024-02-10 彭祖干');
eq(h1.胎神, '门鸡栖外正东', '黄历 2024-02-10 胎神');
eq(h1.法定假期.type, 'holiday', '黄历 2024-02-10 春节假期');
const h2 = daily(2024, 1, 1);
eq(h2.节日.includes('元旦'), true, '2024-01-01 元旦');
eq(h2.值星.名, '建', '2024-01-01 值星建');
const h3 = daily(2024, 2, 12); // 丙午日寅月 → 月德
eq(h3.吉神宜趋.includes('月德'), true, '2024-02-12 丙日寅月得月德');
const h4 = daily(2024, 2, 14); // 甲寅日 寅月支=寅 → 月破
eq(h4.凶煞宜忌.includes('月破'), true, '2024-02-14 甲寅寅月得月破');
eq(jieqiAround(2024, 2, 10).prev.name, '立春', '2024-02-10 上一节气');
eq(jieqiAround(2024, 2, 10).next.name, '雨水', '2024-02-10 下一节气');
eq(monthView(2024, 2).length, 29, '2024-02 月视图 29 天');

export const passed = pass;
export const failed = fail;

if (process.argv[1] && process.argv[1].endsWith('calendar.test.js')) {
  console.log(`\n通过 ${pass} 项断言，失败 ${fail} 项`);
  process.exit(fail ? 1 : 0);
}
