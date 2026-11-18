/**
 * src/core/mystic-gates/day-chart.js —— 奇门遁甲·日家奇门（自研，零依赖）
 *
 * 大白话：日家奇门「一天一局」，不看时辰。六十天走一局、一百八十天走完三元。
 *
 * 为什么日家不能拿时家的盘来顶：时家以「时辰」起局（值符随时干），日家以「日」起局
 *   （值符随日干、值使按日干在旬中的位次数宫），定局也不是查节气三元表，而是「六十日一局」。
 *
 * 算法依据（《奇門寶鑑》【二】「又法日奇門起例」原文，库外《奇門法竅》卷二「論日奇法」同）：
 *   「冬至第一甲子六十日，用陽遁一局。第二甲子六十日，用陽遁七局。第三甲子六十日，用陽遁四局。
 *     夏至第一甲子六十日，用陰遁九局。第二甲子六十日，用陰遁三局。第三甲子六十日，用陰遁六局。」
 *   → 阳遁三元局数 1/7/4，阴遁三元局数 9/3/6。
 *
 * 六条落地口径：
 *   ① 阴阳遁：最近过去的那个「二至」是冬至 → 阳遁段；是夏至 → 阴遁段。交节当日归新段（日家以日为单位）。
 *   ② 定元：以「段起点（冬至/夏至）当日往前退到最近的甲子日」为起算点，此后每 60 日进一元。
 *   ③ 地盘：三奇六仪 戊己庚辛壬癸丁丙乙，阳遁自局数宫顺飞、阴遁逆飞，九宫独立布仪（含中五）。
 *   ④ 值符：日干支的旬首 → 旬首仪在地盘所落宫 → 该宫本位星为值符；值符星再加临「日干在地盘之宫」
 *      （日干为甲时用旬首仪），余八星沿蓬·任·冲·辅·英·芮·柱·心环序转盘铺开。
 *   ⑤ 值使：自值使本宫起，按九宫数序（1→…→9 循环，中五占位）阳顺阴逆，走「日干在旬中位次 − 1」步，
 *      落中五寄坤二；其余七门自该宫沿休·生·伤·杜·景·死·惊·开环序铺开。
 *   ⑥ 八神：小值符随大值符（值符星落宫），阳顺阴逆。
 *
 * 分歧与缺口（如实标注，不合并、不假称已锁）：
 *   · 八门数宫另有「按八宫环序数」一派，跨中五时差一宫；本实现采九宫数序派（古书三例皆中）。
 *   · 另有「节气分元」派（一元统四气）与「《奇門寶鑑》日支定局」第三种日奇门，本文件不实现，
 *     后者见 baojian.js。
 *   · 日家专用神煞与断辞未纳入。
 */

import { daySexagenaryIndex } from '../calendar/sexagenary.js';
import { solarTermsTable } from '../calendar/solar-terms.js';
import { STEMS, SEXAGENARY } from '../common/constants.js';
import {
  STAR_HOME, STAR_RING, GATE_RING, GONG_DIR,
  diPan, firstXunshou, findHome, homeOf, rotateRingIn, arrangeGodsIn,
} from './hour-chart.js';

/** 三元局数：阳遁 1/7/4、阴遁 9/3/6（《奇門寶鑑》日奇門起例） */
const JU3 = { 阳: [1, 7, 4], 阴: [9, 3, 6] };
const YUAN_NAME = ['上元', '中元', '下元'];
/** 旬首 → 旬首仪 */
const XUN_YI = { 甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸' };
/** 八门本位宫 */
const GATE_HOME = { 休门: 1, 死门: 2, 伤门: 3, 杜门: 4, 开门: 6, 惊门: 7, 生门: 8, 景门: 9 };

/** 公历日序（1970-01-01 = 0） */
function dayNo(y, m, d) {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** 日序 → 公历年月日 */
function fromDayNo(n) {
  const dt = new Date(n * 86400000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/**
 * 目标日之前（含当日）最近的一个同名节气。
 * 注意：solarTermsTable(y) 给的是「y 公历年内的节气」，跨年节气要连查 y-1 / y / y+1 三张表再挑。
 */
function latestTermBefore(y, m, d, name) {
  const tgt = dayNo(y, m, d);
  const seen = new Set();
  let best = null;
  [y - 1, y, y + 1].forEach((Y) => {
    const t = solarTermsTable(Y)[name];
    if (!t) return;
    const key = `${t.y}-${t.m}-${t.d}`;
    if (seen.has(key)) return;
    seen.add(key);
    const n = dayNo(t.y, t.m, t.d);
    if (n <= tgt && (!best || n > best.n)) best = { y: t.y, m: t.m, d: t.d, n };
  });
  return best;
}

/**
 * 判阴阳遁段：二至里「最近过去的那一个」是夏至 → 阴遁；是冬至 → 阳遁。
 * 交节当日归新段（日家以「日」为单位，不细分到刻）。
 */
function segmentOf(y, m, d) {
  const xz = latestTermBefore(y, m, d, '夏至');
  const dz = latestTermBefore(y, m, d, '冬至');
  if (!xz || !dz) return null;
  if (xz.n > dz.n) return { 阴阳: '阴', 起点: xz, startName: '夏至' };
  return { 阴阳: '阳', 起点: dz, startName: '冬至' };
}

/** 六十甲子串 '甲子' */
function sexagenaryText(idx) {
  const it = SEXAGENARY[((idx % 60) + 60) % 60];
  return it[0] + it[1];
}

/**
 * 定元：段起点当日往前退到最近的甲子日作为起算点，数天数 → 元。
 * 大白话：冬至那天不一定是甲子日，要往前找到最近的甲子日，从那天开始每 60 天进一元。
 */
function yuanByJiazi(y, m, d, seg) {
  const s = seg.起点;
  const startIdx = daySexagenaryIndex(s.y, s.m, s.d); // 段起点当日的日干支序（甲子 = 0）
  const startDay = dayNo(s.y, s.m, s.d) - startIdx;
  const jz = fromDayNo(startDay);
  const diff = dayNo(y, m, d) - startDay;
  const yuan = Math.floor(diff / 60) % 3;
  return {
    元序: yuan,
    元: YUAN_NAME[yuan],
    起算甲子日: `${jz.y}-${String(jz.m).padStart(2, '0')}-${String(jz.d).padStart(2, '0')}`,
    距起算天数: diff,
    局数: JU3[seg.阴阳][yuan],
  };
}

/**
 * 值使门落宫：自值使本宫起，按九宫数序（含中五占位）阳顺阴逆，走「日干旬内位次 − 1」步；
 * 落中五寄坤二（八门不入中五）。
 * 古书三例皆中：丁巳日阴遁（杜本宫4、丁第4位）→ 坎1；庚子日阳遁（杜4、庚第7位）→ 坎1；
 *   丁卯日阴遁（景本宫9、丁第4位）→ 乾6。
 */
function zhiShiPalace(gateName, ganXu, yang) {
  const home = GATE_HOME[gateName] || 1;
  const step = ganXu - 1;
  const p = yang ? ((home - 1 + step) % 9) + 1 : (((home - 1 - step) % 9) + 9) % 9 + 1;
  return p === 5 ? 2 : p;
}

/**
 * 日家奇门排盘。
 * @param {{y:number,m:number,d:number}} input
 */
export function mysticGatesDayChart(input) {
  const { y, m, d } = input;
  const seg = segmentOf(y, m, d);
  if (!seg) throw new Error(`${y}-${m}-${d} 未定位二至（支持 1901–2100）`);
  const yang = seg.阴阳 === '阳';

  const gzIdx = daySexagenaryIndex(y, m, d);
  const dayGz = sexagenaryText(gzIdx);
  const dayGan = dayGz[0];
  const dayZhi = dayGz[1];

  const A = yuanByJiazi(y, m, d, seg);
  const ju = A.局数;

  // 地盘：三奇六仪阳顺阴逆，九宫独立布仪（含中五）
  const pan = diPan(ju, yang);

  // 旬首 → 值符星 / 值使门（旬首仪在地盘宫的本位星、本位门）
  const xun = firstXunshou(dayGz);
  const yi = XUN_YI[xun];
  const xunGong = findHome(pan, yi);
  const xunHome = homeOf(xunGong);
  const fuStar = STAR_RING.find((s) => STAR_HOME[s] === xunHome)
    || STAR_RING.find((s) => STAR_HOME[s] === 2) || '天芮';
  const fuDoor = GATE_RING.find((g) => GATE_HOME[g] === xunHome) || '死门';

  // 天盘九星：值符落「日干在地盘之宫」（日干为甲时用旬首仪），余星环序铺开
  const ganYi = dayGan === '甲' ? yi : dayGan;
  const ganGong = findHome(pan, ganYi);
  const tianPan = rotateRingIn(STAR_RING, fuStar, ganGong, false);

  // 八门：值使本宫 +（日干旬内位次 − 1），阳顺阴逆走九宫数序，落中五寄坤二
  const ganXu = STEMS.findIndex((g) => g.z === dayGan) + 1; // 甲=1 … 癸=10
  const shiGong = zhiShiPalace(fuDoor, ganXu, yang);
  const baMen = rotateRingIn(GATE_RING, fuDoor, shiGong, false);

  // 八神：小值符随大值符（值符星落宫），阳顺阴逆
  const baShen = arrangeGodsIn(ganGong, yang);

  // 天盘干：星带其「本宫」地盘干；天禽（本宫 5）随天芮同宫 → 该宫两干
  const starToHome = {};
  Object.keys(STAR_HOME).forEach((k) => { starToHome[STAR_HOME[k]] = +k; });
  const tianGan = {};
  let qinGong = 0;
  Object.keys(tianPan).forEach((p) => {
    const st = tianPan[p];
    const h = homeOf(starToHome[st] || 2);
    tianGan[p] = pan[h];
    if (st === '天芮') qinGong = +p;
  });

  const cells = [];
  for (let g = 1; g <= 9; g += 1) {
    cells.push({
      宫: g,
      方位: GONG_DIR[g],
      天盘干: tianGan[g] || '',
      地盘干: pan[g] || '',
      星: tianPan[g] || (g === 5 ? '天禽' : ''),
      门: baMen[g] || (g === 5 ? '中宫无门' : ''),
      神: baShen[g] || '',
    });
  }

  return {
    input,
    日期: `${y}年${m}月${d}日`,
    日干支: dayGz,
    日干: dayGan,
    日支: dayZhi,
    日干宫: ganGong,
    日干位次: ganXu,
    遁: yang ? '阳遁' : '阴遁',
    段起点: `${seg.startName}（${seg.起点.y}-${String(seg.起点.m).padStart(2, '0')}-${String(seg.起点.d).padStart(2, '0')}）`,
    元: A.元,
    局: `${ju}局`,
    局数: ju,
    起算甲子日: A.起算甲子日,
    距起算天数: A.距起算天数,
    旬首: xun,
    旬首仪: yi,
    旬首宫: xunGong,
    值符: fuStar,
    值符星: fuStar,
    值使: fuDoor,
    值使门: fuDoor,
    值使本宫: GATE_HOME[fuDoor],
    值使落宫: shiGong,
    地盘: pan,
    天盘: tianPan,
    八门: baMen,
    八神: baShen,
    天盘干: tianGan,
    禽宫: qinGong,
    禽干: qinGong ? pan[5] : null,
    cells,
    口径: [
      '日家以「六十日一局、一百八十日三元」：阳遁 1/7/4 局、阴遁 9/3/6 局（《奇門寶鑑》日奇門起例）。',
      '定元采「甲子日数元」派：以二至前最近的甲子日为起算点，每 60 日进一元。另有「节气分元」派（一元统四气），本实现不采。',
      '值符随日干落宫、值使按日干旬内位次数九宫（阳顺阴逆，中五占位，落中五寄坤二）。',
      '八门数宫另有按八宫环序数一派，跨中五时差一宫；本实现取九宫数序派。',
      '《奇門寶鑑》按日支定局的第三种日奇门另见「排宝鉴日奇」，与本盘并列不合并。',
    ],
  };
}

export { segmentOf, yuanByJiazi, zhiShiPalace };
