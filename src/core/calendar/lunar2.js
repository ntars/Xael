/**
 * src/core/calendar/lunar2.js —— 农历（天文朔日版，自研，零依赖）
 *
 * 大白话：农历月从「朔」（日月同经，新月）开始，月初一 = 朔日。
 * 农历年从「正月初一」开始，含冬至的那个月是十一月；若一年有 13 个月，
 * 第一个不含「中气」的月为闰月（定朔定气规则）。
 * 这里全部用 astronomy.newMoonJDE 自算，不查表：
 *   1. 找出目标公历年冬至所在的朔望月序 k
 *   2. 从前一年十一月朔起逐月推进，标注每月含哪些中气
 *   3. 无中气者置闰（一年最多闰一个月）
 * 数据为天文事实演算，代码全新实现。
 */

import { newMoonJDE, jdeToBeijing, sunLon } from './astronomy.js';
import { dayNo, fromDayNo, solarToJdn } from './solar.js';

export const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
export const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

/** 中气名（黄经每 30° 一个，从雨水 330° 起）；键=黄经档，值=名 */
const ZHONGQI = [
  // 黄经 330°=雨水 0°=春分 30°=谷雨 60°=小满 90°=夏至 120°=大暑 150°=处暑 180°=秋分
  // 210°=霜降 240°=小雪 270°=冬至 300°=大寒
  '雨水', '春分', '谷雨', '小满', '夏至', '大暑', '处暑', '秋分', '霜降', '小雪', '冬至', '大寒',
];

/**
 * 求某 JDE 附近的太阳黄经对应中气索引（0=雨水…11=大寒），非中气返回 -1。
 */
function zhongqiIndexAt(jde) {
  const lon = sunLon(jde);
  // 雨水=330°。中气黄经 = (330 + idx*30) % 360
  for (let i = 0; i < 12; i++) {
    const z = (330 + i * 30) % 360;
    // 交节判定：太阳黄经在此 JDE 前后 0.5 天内跨越 z
    const d1 = ((sunLon(jde - 0.5) - z) % 360 + 540) % 360 - 180;
    const d2 = ((sunLon(jde + 0.5) - z) % 360 + 540) % 360 - 180;
    if (d1 < 0 && d2 >= 0) return i;
  }
  return -1;
}

/**
 * 朔的 k 序换算：k 为 Meeus 序（2000-01-06 朔 = k 0）。
 * 某朔的北京时间日序（初一那天）。
 */
function newMoonDayNo(k) {
  const jde = newMoonJDE(k);
  const b = jdeToBeijing(jde, 2000 + k / 12.3685);
  return b.dayNo;
}

/**
 * 计算某农历年的月份结构。
 * 农历年定义：从当年正月初一到下一年正月初一前。
 * @returns {null | {year, months:[{m,isLeap,days}], firstDayNo}} 结构缓存友好
 */
export function lunarYearStructure(y) {
  // 冬至所在朔月必为十一月（子月）。找 y 年冬至（黄经270°）的北京时间日序
  // → 找到包含该日的朔 k0（十一月朔）→ 往前推 10 个月得正月朔，往后推到次年十一月验证 13/12 月。
  const dZhi = jdeToBeijing(solveLon(270, y), y).dayNo;
  // 朔序估计：k ≈ (jd - 2451550.09766) / 29.530588861
  const jdnZhi = dZhi + solarToJdn(1970, 1, 1);
  let k = Math.round((jdnZhi - 2451550.09766) / 29.530588861);
  // 校正到「朔日 ≤ 冬至日」的最近朔
  while (newMoonDayNo(k + 1) <= dZhi) k++;
  while (newMoonDayNo(k) > dZhi) k--;
  // k = y 年十一月朔。往前 10 个朔 = 正月朔（若中间有闰月则为 11 个——但正月到十一月间不会置闰
  // 闰月只能在没有中气的月，从正月数到十一月之间若出现无中气月，正月朔要再往前）。
  // 通用做法：往前数 10 个朔（十一月是第 11 个月），检查从正月到十一月每月是否都含中气；
  // 若有不含中气的月且它在正月之前……实际规则：闰月更常出现在年中。稳妥做法是从上一年十一月起逐月排。
  // 以下采用「从 y-1 年十一月朔开始逐月推进到 y+1 年十一月朔」的完整排月法。
  const structure = buildMonthsFrom(k, y);
  return structure;
}

/** 解太阳黄经交节 JDE（与 jieqi2 相同的牛顿法，内部复用） */
function solveLon(targetLon, year) {
  const center = solarToJdn(year, 2, 4) + ((((targetLon - 315) % 360) + 360) % 360 / 360) * 365.2422;
  let jde = center;
  for (let i = 0; i < 10; i++) {
    const diff = ((sunLon(jde) - targetLon) % 360 + 540) % 360 - 180;
    jde -= diff / 0.9856473;
  }
  return jde;
}

/**
 * 从「y 年十一月朔 k」出发，构建 y 农历年（正月初一 → 次年正月初一前）的月份表。
 * 规则（定朔定气）：
 *   - 冬至所在月 = 十一月
 *   - 从上年十二月（腊月/十一月之后）逐月数到次年十一月：
 *     若某月不含中气 → 闰月（重复前一月编号）；一年最多一个闰月。
 *   - 月份编号：十一月后为腊月(12)，再后为次年正月(1)…
 */
function buildMonthsFrom(k0, y) {
  // 从 y-1 年的十一月朔开始（k0 - 12~13 个朔不确定，直接从 y-1 冬至定位）
  const dZhiPrev = jdeToBeijing(solveLon(270, y - 1), y - 1).dayNo;
  const jdnZhiPrev = dZhiPrev + solarToJdn(1970, 1, 1);
  let k = Math.round((jdnZhiPrev - 2451550.09766) / 29.530588861);
  while (newMoonDayNo(k + 1) <= dZhiPrev) k++;
  while (newMoonDayNo(k) > dZhiPrev) k--;
  // k = y-1 年十一月朔。从它开始排月，直到 y+1 年十一月朔。
  const months = []; // {m, isLeap, startDayNo, days, k}
  let idx = k; // 当前朔序
  let curMonth = 11; // 从 y-1 年十一月开始
  let leapDone = false;
  let firstDayNo = null;

  // ── 两遍法预计算 ─────────────────────────────────────────────
  // 定理（《时宪历》置闰法）：两冬至之间的朔望月数为 13 → 其中第一个无中气月为闰月；
  // 为 12 → 无闰月。先预解出本循环会用到的所有冬至日序，再逐月置 isLeap 标。
  // 冬至日序表：y-2 .. y+1 的冬至
  const zhiDay = {};
  for (let yy = y - 2; yy <= y + 1; yy++) zhiDay[yy] = jdeToBeijing(solveLon(270, yy), yy).dayNo;
  // 逐朔段扫：找出「冬至落在该朔段内」的月序，与下一冬至月序之间的月数决定置闰
  function computeLeapFlags() {
    // 收集所有月段 [start, start+days) 与其中气序（-1 表示无）
    const all = [];
    let i2 = k;
    let cm = 11;
    let leap2 = false;
    while (all.length < 40) {
      const st = newMoonDayNo(i2), nd = newMoonDayNo(i2 + 1);
      all.push({ start: st, days: nd - st, k: i2, m: cm });
      i2++; cm++;
      if (cm > 13) cm = 1;
    }
    // 对每对相邻冬至（zhi in zhiDay）：找冬至所在的月段序 a 与下一次冬至所在月段序 b，
    // 两冬至之间（a, b）的月段 = (a, b) 开区间含 b? 定义：冬至所在月=十一月（含冬至的那段）。
    // 区间 [a, b) 内月段数 = 12 或 13。13 → 其中第一个无中气月闰。
    // 中气检查用月中点法（同主循环）。
    const hasZQ = (seg) => {
      const mid = seg.start + Math.floor(seg.days / 2);
      const jde = dayToJde(mid);
      const lon = sunLon(jde);
      const zi = ((Math.round((lon - 330) / 30) % 12) + 12) % 12;
      const z = (330 + zi * 30) % 360;
      const diff = ((lon - z) % 360 + 540) % 360 - 180;
      let j = jde - diff / 0.9856473;
      for (let it = 0; it < 10; it++) {
        const d2 = ((sunLon(j) - z) % 360 + 540) % 360 - 180;
        j -= d2 / 0.9856473;
      }
      const b = jdeToBeijing(j, 2025);
      return b.dayNo >= seg.start && b.dayNo < seg.start + seg.days;
    };
    // 冬至所在段序
    const zhiSeg = {};
    for (const yy in zhiDay) {
      const zd = zhiDay[yy];
      for (let i = 0; i < all.length; i++) {
        const seg = all[i];
        if (zd >= seg.start && zd < seg.start + seg.days) { zhiSeg[yy] = i; break; }
      }
    }
    // 置闰标记
    for (const yy in zhiDay) {
      const a = zhiSeg[yy];
      const b = zhiSeg[Number(yy) + 1];
      if (a == null || b == null) continue;
      const span = b - a; // [a, b) 段数 = 12 或 13
      if (span === 13) {
        for (let i = a + 1; i < b; i++) {
          if (!hasZQ(all[i])) { all[i].isLeap = true; break; }
        }
      }
    }
    return all;
  }
  const leapTable = computeLeapFlags(); // {start→isLeap}
  const leapByStart = {};
  for (const seg of leapTable) if (seg.isLeap) leapByStart[seg.start] = true;
  while (true) {
    const start = newMoonDayNo(idx);
    const next = newMoonDayNo(idx + 1);
    const days = next - start;
    // 该月是否含「中气」（节气序列中每个月的标志气：雨水/春分/谷雨/小满/夏至/大暑/
    // 处暑/秋分/霜降/小雪/冬至/大寒，黄经 330+30k）：
    //   取本月「月中点」的太阳黄经，最近的 30° 整倍数即该月应有的中气；
    //   牛顿解出该中气的交节时刻，若其北京日期落在本月初一~月末之间 → 本月有中气。
    let zq = -1;
    const midJdn = start + Math.floor(days / 2);
    const midJde = dayToJde(midJdn);
    const midLon = sunLon(midJde);
    // 中气黄经序列：雨水 330、春分 0、谷雨 30 … 大寒 300（每 30° 一气）
    // 由「月中点黄经」反推最近的中气序号（0..11），再还原黄经
    const zi = ((Math.round((midLon - 330) / 30) % 12) + 12) % 12;
    const z = (330 + zi * 30) % 360;
    {
      const diff = ((midLon - z) % 360 + 540) % 360 - 180;
      let jde = midJde - diff / 0.9856473;
      for (let it = 0; it < 10; it++) {
        const d2 = ((sunLon(jde) - z) % 360 + 540) % 360 - 180;
        jde -= d2 / 0.9856473;
      }
      const b = jdeToBeijing(jde, 2025);
      if (b.dayNo >= start && b.dayNo < start + days) zq = zi;
    }
    const isLeap = !!leapByStart[start]; // 两遍法结果（见 computeLeapFlags）
    const mNo = curMonth;
    if (curMonth === 12) {
      // 腊月之后进入次年正月
      if (y - 1 + 1 === y) { /* noop */ }
    }
    // 用绝对月序 seq 判定归属：seq=0 → y-1 十一月；seq=1 → y-1 腊月；seq≥2 → y 年正月起
    const seq = months.length;
    const belongsTo = seq >= 2 ? y : y - 1;
    months.push({ m: mNo, isLeap, startDayNo: start, days, zq, k: idx, belongsTo, seq });
    idx++;
    curMonth++;
    if (curMonth > 13) curMonth = 1; // 13 个月后归位正月（有闰月时会走 14 个月，下面用 seq 控制）
    // 终止：到 y+1 年十一月朔之后
    if (months.length > 16) break; // 安全阀
    // 判断 y+1 年正月之后可停（拿到 y 年完整 12/13 个月 + 次年正月朔）
    const passed = months.filter((x) => x.belongsTo === y);
    if (passed.length >= 13) break;
    if (passed.length >= 12) {
      // 检查是否已有次年正月（belongTo y+1 的第一项）
      if (months.some((x) => x.belongsTo === y + 1)) break;
    }
  }
  // 提取 y 农历年：belongsTo === y 的月份；firstDayNo = 第一个属 y 的正月朔
  const mine = months.filter((x) => x.belongsTo === y);
  const first = mine[0];
  // 重编农历月号：正月=1 顺排，闰月挂在它前面的月号上
  let mNo = 0;
  for (const mo of mine) {
    if (!mo.isLeap) mNo++;
    mo.m = mNo;
  }
  return { year: y, months: mine, firstDayNo: first.startDayNo };
}

/** 北京日序 → JDE(TT)（正午近似，用于中气检查） */
function dayToJde(dayNumber) {
  // 北京正午 = UTC 04:00 = JDE ≈ dayNo + jdn1970 + 0.5 - 0.5 + 4/24 + ΔT/86400
  // JDN 以「当日正午」为整数点（本仓 solarToJdn 口径）；要取北京时间 12:00 的 TT：
  //   TT = 北京时 − 8h + ΔT；北京 12:00 对应 JDN 当日 + 0.5 天 → JDE = JDN + 0.5 - 8/24 + ΔT/86400
  const jdn = dayNumber + solarToJdn(1970, 1, 1);
  return jdn + 0.5 - 8 / 24 + 65 / 86400;
}

/**
 * 公历 → 农历（天文版）。
 */
export function solarToLunar(y, m, d) {
  const dn = dayNo(y, m, d);
  const st = lunarYearStructure(y - 1 ? (dn < _cachedFirst(y) ? y - 1 : y) : y);
  // 简化：确保 dn 在 st.firstDayNo ~ 次年 firstDayNo 之间
  let useY = y;
  let s = _struct(useY);
  while (dn < s.firstDayNo) { useY--; s = _struct(useY); }
  while (useY < 2100) {
    const nextFirst = _struct(useY + 1).firstDayNo;
    if (dn < nextFirst) break;
    useY++; s = _struct(useY);
  }
  let offset = dn - s.firstDayNo;
  for (const mo of s.months) {
    if (offset < mo.days) {
      return {
        y: s.year, m: mo.m, d: offset + 1, isLeap: !!mo.isLeap,
        monthName: (mo.isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[mo.m - 1] + '月',
        dayName: LUNAR_DAY_NAMES[offset],
        text: `${(mo.isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[mo.m - 1]}月${LUNAR_DAY_NAMES[offset]}`,
      };
    }
    offset -= mo.days;
  }
  return null;
}

/** 结构缓存（同进程内复用，天文计算较贵） */
const _cache = new Map();
function _struct(y) {
  if (!_cache.has(y)) _cache.set(y, lunarYearStructure(y));
  return _cache.get(y);
}
function _cachedFirst(y) { return _struct(y).firstDayNo; }

/** 农历 → 公历 */
export function lunarToSolar(y, m, d, isLeap) {
  const s = _struct(y);
  let offset = 0;
  let found = false;
  for (const mo of s.months) {
    if (mo.m === m && !!mo.isLeap === !!isLeap) {
      const dn = s.firstDayNo + offset + d - 1;
      const sd = fromDayNo(dn);
      return { y: sd.y, m: sd.m, d: sd.d };
    }
    offset += mo.days;
  }
  return null;
}

/** 农历文本 */
export function lunarDayText(y, m, d) {
  const l = solarToLunar(y, m, d);
  return l ? l.text : '';
}

/** 农历年天数 */
export function lunarYearDays(y) {
  const s = _struct(y);
  return s.months.reduce((a, b) => a + b.days, 0);
}

/** 闰月月份（0=无） */
export function leapMonth(y) {
  const s = _struct(y);
  const lp = s.months.find((x) => x.isLeap);
  return lp ? lp.m : 0;
}
