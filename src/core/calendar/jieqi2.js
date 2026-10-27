/**
 * src/core/calendar/jieqi2.js —— 廿四节气（天文算法版，自研，零依赖）
 *
 * 大白话：太阳黄经每 15° 是一个节气。用 astronomy.sunLon 直接搜根：
 *   目标黄经 λ（0°=春分起，每 15° 一档）→ 在目标日期附近用二分法解「黄经=λ」的时刻。
 * 输出口径与旧版一致：年表 = 该公历年内的 24 个节气日（北京日期）。
 */

import { sunLon, jdeToBeijing } from './astronomy.js';
import { solarToJdn } from './solar.js';

export const JIEQI_NAMES = [
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
]; // 黄经 0° 起每 15° 一档，共 24 档

/**
 * 解「太阳黄经 = 目标角度」的 JDE（北京时间某日附近）。
 * @param {Number} targetLon 目标黄经（0-360）
 * @param {Number} year 用于确定搜索区间
 * @returns {Number} JDE(TT)
 */
function solveSunLon(targetLon, year) {
  // 搜索区间：以目标日期估计值为中心 ±20 天
  // 春分（黄经 0°）在 3 月 20 日左右；黄经 λ 对应的估计日期：3 月 20 日 + λ/360*365.25 天
  const center = solarToJdn(year, 3, 20) + ((targetLon % 360) / 360) * 365.2422;
  let lo = center - 20, hi = center + 20;
  // 牛顿迭代：黄经差取带符号最短差（-180..180），每日约走 0.9856°
  let jde = center;
  for (let i = 0; i < 8; i++) {
    const diff = ((sunLon(jde) - targetLon) % 360 + 540) % 360 - 180;
    jde -= diff / 0.9856473;
  }
  return jde;
}

/**
 * 某公历年的 24 节气表（北京日期）。键 = 节气名，值 = {m, d, hh, mm, text}。
 * 注意：小寒/大寒/立春/雨水 在公历年初，属当年 1-2 月（天文搜索自动正确）。
 */
export function jieqiTable(year) {
  const out = {};
  JIEQI_NAMES.forEach((name, i) => {
    const target = i * 15;
    // 估计中心：立春（黄经315°）约在 2 月 4 日。从「2月4日=立春」基准出发：
    // index i 的黄经 = i*15；相对立春（i=22，黄经315）的天数偏移 = ((i*15-315)%360)/360 年
    const idxLichun = 21; // 立春在表中序号（黄经 315°）
    // 距立春的黄经差：立春=22*15=330°，但黄经应为 315°。
    // 统一改为：黄经 target=i*15（0=春分），立春估计中心=2/4；
    // 其他节气 = 立春日期 + 黄经差（target-315 取最短正差）/360 年
    const offsetDeg = ((i * 15 - 315) % 360 + 360) % 360; // 0..345，立春自身=0
    // 只有小寒(285°)/大寒(300°)在公历年首（立春前 ≤45°），需从本年立春回退；
    // 其余节气（含秋冬的立冬/大雪/冬至）都在本年立春之后顺推。
    const back = offsetDeg > 315 ? (360 - offsetDeg) / 360 : 0;
    const fwd = offsetDeg > 315 ? 0 : offsetDeg / 360;
    const center = solarToJdn(year, 2, 4) + fwd * 365.2422 - back * 365.2422;
    // 牛顿迭代解「太阳黄经 = target」
    let jde = center;
    for (let k = 0; k < 10; k++) {
      const diff = ((sunLon(jde) - target) % 360 + 540) % 360 - 180;
      jde -= diff / 0.9856473;
    }
    const b = jdeToBeijing(jde, year);
    const s = (() => {
      // dayNo → 公历
      const jdn = b.dayNo + solarToJdn(1970, 1, 1);
      const a = jdn + 32044;
      const bb = Math.floor((4 * a + 3) / 146097);
      const c = a - Math.floor((146097 * bb) / 4);
      const e = c - Math.floor((1461 * Math.floor((4 * c + 3) / 1461)) / 4);
      const m2 = Math.floor((5 * e + 2) / 153);
      return {
        y: 100 * bb + Math.floor((4 * c + 3) / 1461) - 4800 + Math.floor(m2 / 10),
        m: m2 + 3 - 12 * Math.floor(m2 / 10),
        d: e - Math.floor((153 * m2 + 2) / 5) + 1,
      };
    })();
    out[name] = {
      y: s.y, m: s.m, d: s.d, hh: b.hh, mm: b.mm,
      text: `${s.y}-${String(s.m).padStart(2, '0')}-${String(s.d).padStart(2, '0')}`,
      time: `${String(b.hh).padStart(2, '0')}:${String(b.mm).padStart(2, '0')}`,
    };
  });
  return out;
}

/** 某日（含）之前最近的节气 */
export function prevJieqi(y, m, d) {
  const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const all = [];
  [y - 1, y, y + 1].forEach((yy) => {
    const t = jieqiTable(yy);
    for (const k in t) all.push({ 名: k, ...t[k] });
  });
  all.sort((a, b) => (a.text < b.text ? -1 : 1));
  let best = null;
  for (const it of all) if (it.text <= target) best = it;
  return best;
}

/** 某日（含）之后最近的节气 */
export function nextJieqi(y, m, d) {
  const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const all = [];
  [y - 1, y, y + 1].forEach((yy) => {
    const t = jieqiTable(yy);
    for (const k in t) all.push({ 名: k, ...t[k] });
  });
  all.sort((a, b) => (a.text < b.text ? -1 : 1));
  for (const it of all) if (it.text >= target) return it;
  return null;
}
