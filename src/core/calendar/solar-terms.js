/**
 * src/core/calendar/solar-terms.js —— 廿四节气（天文算法版，自研，零依赖）
 * 算法来源：Jean Meeus 库外《Astronomical Algorithms》节气求解（太阳视黄经反解），
 *   圈号选取与相位标定见 docs/CALIBER-NOTES.md「历法底座」节。
 *
 * 大白话：太阳黄经每 15° 是一个节气。用 astronomy.sunLon 直接搜根：
 *   目标黄经 λ（0°=春分起，每 15° 一档）→ 在目标日期附近用二分法解「黄经=λ」的时刻。
 * 输出口径：年表 = 该公历年内的 24 个节气日（北京日期）。
 */

import { qiAccurate, jdeToBeijing } from './astronomy.js';
import { solarToJdn, jdnToSolar } from './julian.js';

export const JIEQI_NAMES = [
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
]; // 黄经 0° 起每 15° 一档，共 24 档

/** J2000 = JD 2451545（2000-01-01 12:00 TT） */
const J2000_JDN = 2451545;

/** 相位轴：级数的自变量 w 与「太阳黄经 λ」是 1 : 1 的角度关系，
 *  只差整数个 2π（每转一圈约一个回归年）。因此
 *      w = 2π·k + λ·π/180 + PHASE_DRIFT
 *  其中 k 是整数圈号（2024 年春分为 24 圈、2023 年为 23 圈），
 *  PHASE_DRIFT 是级数黄经零点相对相位零点的固定小偏移。
 *  实测标定：解 qiAccurate(315° + 2π·24 + drift) = 2024 立春真值的儒略日，
 *  得 drift = 3.4113e-8 弧度（约 0.000002°，折合 0.0017 秒），
 *  即级数零点与相位零点几乎重合，此前取 1.4e-5 是错的。 */
const PHASE_DRIFT = 3.4113e-8;

/** 太阳黄经一圈 = 2π */
const TWO_PI = 2 * Math.PI;
/** 一年天数（回归年），只用于「估个大约日期」定圈号，不参与最终解算 */
const YEAR_DAYS = 365.2422;


/**
 * 解「视太阳黄经 = 目标角度」的时刻，返回 J2000 起算的儒略日数（北京时）。
 *
 * 大白话：级数的自变量不是黄经，而是「转过的角度总数」。
 *   转一圈约一年，所以要知道目标日期落在「第几圈」，再把圈号乘进相位里。
 *
 *   圈号不能靠「春分 + 黄经/360 年」外推——那样 285°~345°（小寒~惊蛰）
 *   会算到次年、105°~270°（小暑~冬至）会算到上一年，整整差一圈，
 *   解出来的时刻就差一年（实测正是如此，误差高达 100448 秒）。
 *
 *   正确做法：直接用「该节气在目标公历年内的近似日序」定圈号。
 *   每个节气在年内的日序是固定的（春分约 3/20、冬至约 12/22…），
 *   由节气序号直接推出近似日期，误差几天对取整毫无影响。
 *
 * @param {Number} targetLon 目标黄经（度，0 = 春分）
 * @param {Number} year 目标公历年
 * @param {Number} idx 节气序号（0=春分 … 23=惊蛰），用于推年内近似日序
 */
function solveSunLon(targetLon, year, idx) {
  const lonRad = (targetLon * Math.PI) / 180;
  // 该节气在年内的近似日序：春分（序号 0）在 3/20 = 第 79 天，之后每档约 15.2184 天。
  //   序号 19~23（小寒…惊蛰）日序会超过 365，但它们其实落在**次年年初**，
  //   所以先减 365 再按 1 月 1 日往后推——这样五个"年初节气"也能正确落在本年 1 月。
  let dayOfYear = 79 + idx * 15.2184;
  if (dayOfYear > 365) dayOfYear -= 365;
  const approxJd = solarToJdn(year, 1, 1) - 0.5 + (dayOfYear - 1);
  const approxRel = approxJd - J2000_JDN;
  // 圈号：相位 = 黄经 + 2π·k，k 使相位对应的时刻最接近 approxRel
  const kGuess = Math.round((approxRel - lonRad / TWO_PI) / YEAR_DAYS);
  let best = null;
  for (let dk = -1; dk <= 1; dk++) {
    const w = lonRad + TWO_PI * (kGuess + dk) + PHASE_DRIFT;
    const rel = qiAccurate(w);
    if (!best || Math.abs(rel - approxRel) < Math.abs(best.rel - approxRel)) best = { rel };
  }
  return J2000_JDN + best.rel;
}

/**
 * 某公历年的 24 节气表（北京日期）。键 = 节气名，值 = {y,m,d,hh,mm,text,time}。
 *
 * 归年规则：节气序号 0..18（春分…冬至）属本年；19..23（小寒…惊蛰）属「本年年初」，
 *   它们其实是上一个黄经周期的尾段，直接按算出的公历年归属即可。
 */
const _termCache = new Map(); // 年内二十四节气只解一次（牛顿迭代不便宜，四柱反查要按年反复取表）

export function solarTermsTable(year) {
  const hit = _termCache.get(year);
  if (hit) return hit;
  const out = {};
  JIEQI_NAMES.forEach((name, i) => {
    const target = i * 15;
    const jd = solveSunLon(target, year, i);
    // 儒略日 → 北京日期时刻：jd 已在东八区轴上，
    //   加 0.5 取整得日序、小数部分折成分钟（与权威万年历同为分钟粒度）。
    const jdn = Math.floor(jd + 0.5);
    const frac = jd + 0.5 - jdn;
    const s = jdnToSolar(jdn);
    // 分钟向下取整（截断），与权威万年历 toYmdHms() 的 'HH:MM' 截断口径一致：
    //   例如真实 02:59:57 记为 02:59 而不是 03:00，否则会整体跨过一个时辰，
    //   连带把「起运折算」的时辰差算错一档。
    const totalSecRaw = frac * 86400;
    let totalMin = Math.floor(totalSecRaw / 60);
    const dy = s.d + Math.floor(totalMin / 1440);
    totalMin %= 1440;
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    // sec：真实秒（供起运折算等需要精确时刻的场合；显示用 hh:mm 仍是截断值）
    const sec = Math.round((totalSecRaw % 60 + 60) % 60) % 60;
    out[name] = {
      y: s.y, m: s.m, d: dy, hh, mm, sec,
      text: `${s.y}-${pad2(s.m)}-${pad2(dy)}`,
      time: `${pad2(hh)}:${pad2(mm)}`,
    };
  });
  _termCache.set(year, out);
  return out;
}

/** 十二「节」（不含中气）：月建与换月的界线 */
export const JIE_ONLY = [
  '立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
  '立秋', '白露', '寒露', '立冬', '大雪', '小寒',
];

/** 十二「中气」：闰月与月将的界线 */
export const QI_ONLY = [
  '雨水', '春分', '谷雨', '小满', '夏至', '大暑',
  '处暑', '秋分', '霜降', '小雪', '冬至', '大寒',
];

/** 两位补零（本地小工具，避免跨模块依赖） */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/** 摊平成按日期升序的全量节气列表（前后各借一年，保证跨年可查） */
function allSorted(y) {
  const all = [];
  [y - 1, y, y + 1].forEach((yy) => {
    const t = solarTermsTable(yy);
    for (const k in t) all.push({ name: k, ...t[k] });
  });
  all.sort((a, b) => (a.text < b.text ? -1 : 1));
  return all;
}

/** 某时刻（含）之前最近的节气；only=名字集合可只看节或只看中气 */
export function prevSolarTermAt(y, m, d, hh = 23, mi = 59, only = null) {
  // 秒级比较：交节秒残差在整分边界时决定「已交/未交」（1904 芒种 12:00:58 例）
  const target = `${y}-${pad2(m)}-${pad2(d)} ${pad2(hh)}:${pad2(mi)}:00`;
  let best = null;
  for (const it of allSorted(y)) {
    if (only && only.indexOf(it.name) < 0) continue;
    // 秒位必须补零：不补时 sec=0 会拼成 '22:00:0'，字符串比较小于 '22:00:00'，
    // 把「交节时刻正好等于出生时刻」误判成已过（1995 小暑 22:00:00 例）。
    if (`${it.text} ${it.time}:${pad2(it.sec || 0)}` < target) best = it;
  }
  return best;
}

/** 某时刻（不含）之后最近的节气 */
export function nextSolarTermAt(y, m, d, hh = 0, mi = 0, only = null) {
  // 秒级比较：与 prevSolarTermAt 同口径（tie 到秒，出生恰等于交节分视为未交）
  const target = `${y}-${pad2(m)}-${pad2(d)} ${pad2(hh)}:${pad2(mi)}:00`;
  for (const it of allSorted(y)) {
    if (only && only.indexOf(it.name) < 0) continue;
    if (`${it.text} ${it.time}:${pad2(it.sec || 0)}` >= target) return it;
  }
  return null;
}

/** 某日（含）之前最近的节气 */
export function prevSolarTerm(y, m, d) {
  const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  let best = null;
  for (const it of allSorted(y)) if (it.text <= target) best = it;
  return best;
}

/** 某日（含）之后最近的节气 */
export function nextSolarTerm(y, m, d) {
  const target = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  for (const it of allSorted(y)) if (it.text >= target) return it;
  return null;
}
