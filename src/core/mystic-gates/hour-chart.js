/**
 * src/core/mystic-gates/hour-chart.js —— 奇门遁甲·时家转盘·拆补法（自研，零依赖）
 *
 * 大白话：奇门遁甲把时间装进九宫格（洛书），天盘九星、人盘八门、神盘八神
 * 分别在不同层上按规则转动，落定后的九宫格局就是排盘结果。
 *
 * 规则口径（见 docs/CALIBER-NOTES.md）：
 *   · 阴阳遁：冬至~夏至前阳遁、夏至~冬至前阴遁（按交节日）；
 *   · 符头：《奇门宝鉴·释符头》「甲子、己卯、甲午、己酉四日为符头……符头为体，节气为用，
 *     非节气则不能入局，非符头则不能起元」——符头支 子午卯酉=上元、寅申巳亥=中元、
 *     辰戌丑未=下元，这一段两派共用。
 *   · 定局：节气定三元局数（表见 JUREQI）。★ 元法两派并存，本模块取「拆补法」
 *     （目标日前最近的甲/己日为符头，节气一到即换局）；
 *     《奇门宝鉴》钦定本主张「超神接气置闰」——「接气为拆补，谓拆补宁多二三时，
 *     起超不可过九日，如过九日即当置闰」，并指「李氏……何得创为拆补以乱符头」。
 *     两法在交节前后数日可差一元（局数不同），本模块不合并，遇贴身日期需注明元法。
 *   · 地盘：三奇六仪（戊己庚辛壬癸丁丙乙）自局数宫起，阳顺阴逆飞布九宫（中五宫照排，寄坤二只在落宫取值）；
 *   · 旬首：日干支所在旬 → 对应仪（甲子戊/甲戌己/甲申庚/甲午辛/甲辰壬/甲寅癸）；
 *   · 值符星=旬首仪所在地盘宫的本位星；值使门=该宫本位门；
 *   · 值符落宫：值符星随时干落宫（六甲时无时干，居旬首仪本宫），九星按环序整体旋转；
 *   · 值使落宫：自旬首仪所在宫起，按「时柱在本旬中的位次」数九宫（阳顺阴逆，落中五寄坤二），
 *     八门自值使门起沿门环铺——《奇门遁甲统宗》卷一「直符常以加时干，直使逆顺时支去」，
 *     同书另有成段算例（值符加时干法、值使数宫法）逐条可复算。
 *     ★ 不是「按时辰差转宫」：那样算只有 1/6 的时辰能撞对，本轮已按算例改正；
 *   · 八神：值符起，阳遁顺、阴遁逆布八神；
 *   · 天盘干 = 星本位宫的地盘仪随星移动；
 *   · 23:00 晚子时日柱归次日（奇门口径），时柱五鼠遁随换日后日干重算。
 */

import { daySexagenaryIndex, hourSexagenary, yearSexagenary, monthSexagenary, monthBranchIndex } from '../calendar/sexagenary.js';
import { solarTermsTable } from '../calendar/solar-terms.js';
import { STEMS, BRANCHES, SEXAGENARY } from '../common/constants.js';
import { gateStatesOf } from './gate-states.js';
import { starStatesOf } from './star-states.js';
import { GODS as GODS_BASE, godRolesOf } from './god-roles.js';
import { dayProfilesOf } from './day-profiles.js';
import { imageryOf } from './imagery.js';

import { isYangTerm } from './terms.js';
/** 九宫环序（顺时针）：坎1 艮8 震3 巽4 离9 坤2 兑7 乾6 */
export const CLOCK = [1, 8, 3, 4, 9, 2, 7, 6];

/**
 * 星本位宫：蓬1 芮2 冲3 辅4 禽5 心6 柱7 任8 英9
 * 《奇门宝鉴·释星》「九宫者：一为天蓬，二为天内，三为天冲，四为天辅，五为天禽，
 *   六为天心，七为天柱，八为天任，九为天英」（天内即天芮）。
 * 环序「蓬任冲辅英芮柱心（禽）」亦见同篇「蓬任冲辅英芮柱心禽，其立义皆本于甲」。
 */
export const STAR_HOME = { 天蓬: 1, 天芮: 2, 天冲: 3, 天辅: 4, 天禽: 5, 天心: 6, 天柱: 7, 天任: 8, 天英: 9 };
export const STAR_ORDER = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];

/** 九星转盘环序（与洛书地理环 CLOCK 配合使用；天禽寄天芮不单列） */
export const STAR_RING = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心'];

/**
 * 门本位宫：休1 死2 伤3 杜4 开6 惊7 生8 景9
 * 《奇门宝鉴·释门》：「庚制而退休于坎……故正北为休门」「有向明而治之象……故正南为景门」
 *   「金水之间，西北为开门」「对开为杜门」「水木之间、东北为生门」「对生为死门」
 *   「正西为惊门，正东为伤门」——与本表逐宫相符。
 */
export const DOOR_HOME = { 休门: 1, 死门: 2, 伤门: 3, 杜门: 4, 开门: 6, 惊门: 7, 生门: 8, 景门: 9 };
export const DOOR_ORDER = ['休门', '死门', '伤门', '杜门', '开门', '惊门', '生门', '景门'];
/** 八门转盘环序（顺时针相对次序永不变，与洛书地理环 CLOCK 配合使用） */
export const GATE_RING = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];

/**
 * 八神序（自值符起，阳顺阴逆）：
 *   值符 → 螣蛇 → 太阴 → 六合 → 朱雀 → 白虎 → 九地 → 九天（从《奇门宝鉴·释八神》）。
 * 《奇门遁甲统宗·卷之一》作「八神：一值符、二腾蛇、三太阴、四六合、五勾陈、六朱雀、
 *   七九地、八九天，此谓阳遁也」，并自注「朱雀下有玄武，勾陈下又白虎」——
 *   即勾陈/白虎、朱雀/玄武为同位的两种称法，序列结构一致，本实现取通行名（白虎、玄武）。
 * 《奇门宝鉴·释八神》另作「八神者：天乙、螣蛇、太阴、六合、朱雀、白虎、九地、九天也。
 *   天乙常随甲而加时干，故亦名直符……或有用元武、勾陈者，朱雀之下即可兼看玄武，
 *   勾陈之下即可兼看白虎」——三位（统宗第五作勾陈、宝鉴第五作朱雀、通行第五作白虎）
 *   在第五、六位用名上分歧，位置与顺逆一致，本实现取通行名并在 CALIBER-NOTES 登记。
 */
export const GODS = GODS_BASE;

/** 三奇六仪落宫序（九宫 1..9 → 仪序戊己庚辛壬癸丁丙乙） */
export const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];

/** 六甲旬首 → 仪 */
export const TEN_DAY_LEADER = { '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸' };
/** SEXAGENARY 是 ['甲','戌'] 这样的数组对，取键须拼成「甲戌」 */
const xunKey = (gz) => gz[0] + gz[1];

/** 节气定局表：[上, 中, 下]（阳遁为顺局数，阴遁同数值、符号由遁性定） */
export const JUREQI = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
  立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4],
  立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2],
  立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
};

/** 中五宫寄宫（落宫取值用） */
const HOME5 = 2;

/** 九宫洛书方位 */
export const GONG_DIR = { 1: '北', 8: '东北', 3: '东', 4: '东南', 9: '南', 2: '西南', 7: '西', 6: '西北', 5: '中' };

/**
 * 判断 y-m-d h时所处节气与阴阳遁、三元局。
 * 节气归属：取 y-1/y/y+1 年节气表，找「交节时刻 ≤ 该时刻」的最近节气（跨年安全）。
 * ★ 交节粒度对齐参照实现：只取「交节小时」，分秒截断（如 20:57 交节记为 20 时——
 *   出生 20 时即算已交节）。这是参照排盘的实际口径，非天文精确，特此声明。
 */
function jieqiOf(y, m, d, hh = 12) {
  // 参照实现把「日期 + 小时分数」压成一个可比的数：日期部分 = y*10000+m*100+d（数值相加，非日历日序），
  // 小时部分 = hh/24。这样比较只会差出「小时分数」，不会因日历日序而整体偏移。
  // 例：1901-07-22 23 时 vs 大暑 1901-07-23 22:23 → 19010722.958 < 19010723.916，未交大暑。
  // 目标时刻（日期 + 当日小时分数）
  const now = calendarNum(y, m, d) + hh / 24;
  let best = null, bestT = -Infinity;
  for (const yy of [y - 1, y, y + 1]) {
    const t = solarTermsTable(yy);
    for (const k in t) {
      const jt = calendarNum(t[k].y, t[k].m, t[k].d) + t[k].hh / 24;
      if (jt <= now && jt > bestT) { bestT = jt; best = k; }
    }
  }
  return best;
}

/**
 * 把「公历年月日」压成一个可在同一年内比较的整数：年*10000 + 月*100 + 日。
 * 注意不能直接用 y*10000 + m*100 + d 相加——那样月加了 100 倍权重会把「日」的比较彻底搅乱。
 */
function calendarNum(y, m, d) {
  return y * 10000 + m * 100 + d;
}

/** 与 calendar/solar 的 dayNo 同口径的日序（避免循环依赖，本地实现） */
function jdnOf(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + a * 12 - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

/**
 * 拆补定元：目标日前最近「甲/己」日为符头（含当日）。
 * 依据《奇门遁甲统宗·定三元法》：「三元者，上中下三局也。一元五日，以甲己二干为一元之首，
 *   谓之符头。符头所临之支值子午卯酉则为上元；值寅申巳亥则为中元；值辰戌丑未则为下元。」
 * @returns {0|1|2} 上/中/下元序
 */
function dayuanOf(y, m, d) {
  let gz = daySexagenaryIndex(y, m, d);
  while (STEMS[gz % 10].z !== '甲' && STEMS[gz % 10].z !== '己') gz = (gz + 59) % 60;
  const zhi = BRANCHES[gz % 12].z;
  if (['子', '午', '卯', '酉'].includes(zhi)) return 0;
  if (['寅', '申', '巳', '亥'].includes(zhi)) return 1;
  return 2;
}

/** 布地盘：局数 j（1..9），阳遁顺、阴遁逆，自 j 宫起布 戊己庚辛壬癸丁丙乙 */
export function diPan(j, yang) {
  const pan = {}; // 宫号(1..9) → 仪
  for (let i = 0; i < 9; i++) {
    const gong = yang ? ((j - 1 + i) % 9) + 1 : ((j - 1 - i) % 9 + 9) % 9 + 1;
    pan[gong] = YI[i];
  }
  return pan;
}

/** 环上宫序旋转：取 CLOCK 环（不含中五），home → offset 步 */
function rotateRing(homeGong, steps) {
  const idx = CLOCK.indexOf(homeGong);
  if (idx < 0) return homeGong;
  return CLOCK[(idx + steps % 8 + 8) % 8];
}

/**
 * 时家奇门排盘。
 * @param {Object} input {y,m,d,h}
 */
export function mysticGatesHourChart(input) {
  const { y, m, d, h = 12 } = input;
  // 晚子归次日
  // 晚子（23 时）日柱归次日：只把「日柱/符头」的取日推后一天，
  // 时节气归属仍按真实出生时刻判（否则 22 日 23 时会错算成第二天已交的大暑）
  let yy = y, mm = m, dd = d, hh = h;
  let dayY = y, dayM = m, dayD = d;
  if (h === 23) {
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    dayY = next.getUTCFullYear(); dayM = next.getUTCMonth() + 1; dayD = next.getUTCDate();
  }
  const dayGzIdx = daySexagenaryIndex(dayY, dayM, dayD);
  const dayGz = SEXAGENARY[dayGzIdx];
  const hourGz = hourSexagenary(dayGz[0], hh);
  const hourGan = hourGz[0];
  const hourZhi = hourGz[1];

  // 定局
  const jq = jieqiOf(y, m, d, hh);
  const yang = isYangTerm(jq);
  const yuan = dayuanOf(dayY, dayM, dayD);
  const ju = JUREQI[jq][yuan];

  // 地盘
  const dp = diPan(ju, yang);

  // 旬首：时干支 → 旬（甲干倒推）。时家奇门以「时柱所在旬」定旬首仪，
  // 值符/值使皆由此出（用日柱找旬是子平八字口径，此处不通）。
  const JIAZI_STR = SEXAGENARY.map((x) => x[0] + x[1]);
  const hourGzIdx = JIAZI_STR.indexOf(hourGz[0] + hourGz[1]);
  let xunGanZhi;
  {
    const off = hourGzIdx % 10; // 距甲的时辰数
    xunGanZhi = SEXAGENARY[(hourGzIdx - off + 60) % 60];
  }
  const xunshouYi = TEN_DAY_LEADER[xunKey(xunGanZhi)];

  // 值符星/值使门：旬首仪在地盘的宫
  let fuGong = 0;
  for (let g = 1; g <= 9; g++) if (dp[g] === xunshouYi) fuGong = g;
  const fuGongRaw = fuGong || 2; // 值使数宫的起点须含中五，故另存原值
  if (fuGong === 5) fuGong = HOME5; // 中五寄坤二
  const fuStar = Object.keys(STAR_HOME).find((k) => STAR_HOME[k] === fuGong);
  const fuDoor = Object.keys(DOOR_HOME).find((k) => DOOR_HOME[k] === fuGong);

  // 值符随时干落宫。《奇门宝鉴·释直符直使》歌诀「直符常以加时干，直使逆顺时支去」，
  // 《奇门遁甲统宗·卷之二·值符加时干法》把这条写成算例：「看用时之干临于地盘何宫，
  //   即以天盘值符加于此宫。假如阳遁一局甲子时，即以天蓬为值符而加甲子坎一宫，
  //   所谓伏吟者也。若用乙丑时，则地盘乙在九宫，即以天蓬加九宫。」——两书同法：
  //   值符星加于「时干所居之地盘宫」；时干为甲（六甲时）则仍居旬首仪本宫，
  //   因六甲不遁于六仪、甲即以旬首仪为体（原文「六甲随元遁于仪」）。
  let zhiFuGong = 0;
  if (hourGan === '甲') {
    zhiFuGong = fuGong;
  } else {
    for (let g = 1; g <= 9; g += 1) if (dp[g] === hourGan) zhiFuGong = g;
    if (zhiFuGong === 5) zhiFuGong = HOME5;
  }
  if (!zhiFuGong) zhiFuGong = fuGong;

  // 九星转动：值符星 → zhiFuGong，其余星沿环序保持相对位置（不含中五；天禽寄天芮）
  const ringStars = STAR_ORDER.filter((s) => s !== '天禽');
  const starsPan = {}; // 宫 → 星
  const fuRingIdx = CLOCK.indexOf(zhiFuGong);
  const fuStarRingIdx = CLOCK.indexOf(fuGong);
  // 值符星原在 fuGong（环位 fuStarRingIdx），现移到 zhiFuGong（环位 fuRingIdx）→ 整体平移 delta
  const delta = fuRingIdx - fuStarRingIdx;
  for (const s of ringStars) {
    const home = STAR_HOME[s] === 5 ? HOME5 : STAR_HOME[s];
    const ringIdx = CLOCK.indexOf(home);
    if (ringIdx < 0) continue;
    const target = CLOCK[(ringIdx + delta % 8 + 8) % 8];
    starsPan[target] = s;
    if (s === '天芮') starsPan[target] = '天芮(禽)'; // 天禽寄天芮同宫
  }

  // 天盘干：星本位宫的地盘仪随星移动
  const tianPanGan = {};
  for (const g in starsPan) {
    const s = starsPan[g].replace('(禽)', '');
    tianPanGan[g] = dp[STAR_HOME[s]];
  }

  // 值使门落宫。《奇门遁甲统宗·卷之二》把值使的推法也写成了算例（该条题作「值符加时干」，
  //   实讲值使，属原书小题之讹）：「看用时之支临于地盘何宫，即以天盘值符加于此宫。
  //   假如阳遁一局，甲子时子在一宫，休门即在子上，即所谓伏吟者也。丑时则休门加于二宫，
  //   寅时则加三宫，卯时则加四宫，余仿此。阴遁须用逆布，如九局甲子时子在九宫，
  //   景门即在九宫；丑时在八宫，寅时在七宫，余仿此。」——即自旬首仪所在宫起，
  //   按该时辰在本旬中的位次数九宫，阳遁顺行、阴遁逆行。
  //   另以《奇门宝鉴·释玉女守门》六时（甲子旬庚午、甲戌旬己卯、甲申旬戊子、甲午旬丁酉、
  //   甲辰旬丙午、甲寅旬乙卯）反推校验：六例值使皆落丁奇宫，按本式复算全中。
  //   旬首仪所在宫起，按「该时辰在本旬中的位次（0 起）」数九宫——阳遁顺行、阴遁逆行。
  //   原书六时（甲子旬庚午时、甲戌旬己卯时、甲申旬戊子时、甲午旬丁酉时、甲辰旬丙午时、
  //   甲寅旬乙卯时）值使皆落丁奇所居之宫，按本式复算六例全中。
  //   数宫走「洛书数序 1→2→3…9→1」（可穿中五），落中五者寄坤二（阳局寄二、阴局寄八，
  //   此处取与星盘一致的 HOME5 = 2）。
  const hourIdxInXun = hourGzIdx % 10; // 旬内位次：甲X时为 0
  let zhiShiGong = fuGongRaw;
  for (let k = 0; k < hourIdxInXun; k += 1) {
    zhiShiGong = yang ? (zhiShiGong % 9) + 1 : ((zhiShiGong + 7) % 9) + 1;
  }
  if (zhiShiGong === 5) zhiShiGong = HOME5;
  const doorHome = DOOR_HOME[fuDoor];
  const doorsPan = {};
  {
    const gi = CLOCK.indexOf(zhiShiGong);
    const ai = GATE_RING.indexOf(fuDoor);
    // 环序固定「顺时针」铺（洛书地理环 CLOCK 正向）；阴阳遁只改局数不改飞布几何
    for (let j = 0; j < 8; j += 1) {
      doorsPan[CLOCK[(gi + j) % 8]] = GATE_RING[(ai + j) % 8];
    }
  }

  // 八神：自值符宫（zhiFuGong）起，阳顺阴逆
  const godsPan = {};
  const gIdx = CLOCK.indexOf(zhiFuGong);
  for (let i = 0; i < 8; i++) {
    const p = yang ? CLOCK[(gIdx + i) % 8] : CLOCK[(gIdx - i % 8 + 8) % 8];
    godsPan[p] = GODS[i];
  }

  // 组九宫输出（1..9）
  const cells = [];
  for (let g = 1; g <= 9; g++) {
    cells.push({
      宫: g,
      方位: GONG_DIR[g],
      天盘干: tianPanGan[g] || '',
      地盘干: dp[g] || '',
      星: starsPan[g] || '',
      门: doorsPan[g] || '',
      神: godsPan[g] || '',
    });
  }

  // 八门与三奇的得时得地（《奇门宝鉴·释义四十四则》「凡八门皆然，三奇亦然」）
  const 八门旺衰 = gateStatesOf(cells, BRANCHES[monthBranchIndex(yy, mm, dd, hh)]?.z || BRANCHES[monthBranchIndex(yy, mm, dd, hh)]);

  const out = {
    input: { y, m, d, h },
    干支: { 日: dayGz, 时: hourGz },
    四柱: { 年: yearSexagenary(yy, mm, dd, hh), 月: monthSexagenary(yy, mm, dd, hh), 日: dayGz[0] + dayGz[1], 时: hourGz[0] + hourGz[1] },
    节气: jq,
    遁: yang ? '阳遁' : '阴遁',
    局: `${['上', '中', '下'][yuan]}元${ju}局`,
    旬首: xunGanZhi,
    值符: fuStar,
    值符宫: zhiFuGong,
    值使: fuDoor,
    值使落宫: zhiShiGong,
    地盘: dp,
    日家属性: dayProfilesOf(dayGz, jq, hourGz[0]),
    cells,
    八神所司: godRolesOf(cells),
    九星气应: starStatesOf(cells, (BRANCHES[monthBranchIndex(yy, mm, dd, hh)] && BRANCHES[monthBranchIndex(yy, mm, dd, hh)].z) || BRANCHES[monthBranchIndex(yy, mm, dd, hh)]),
    八门旺衰,
    口径: '时家转盘·拆补法；天禽寄天芮；中五寄坤二；晚子日柱归次日',
  };
  // 「谁管什么事」：值使门所主、值符星所主、三奇落宫喜怒（原文照录，见 imagery.js）
  out['类象'] = imageryOf(out);
  return out;
}

/* ==========================================================================
 * 以下为「刻家 / 飞盘 / 年家月家 / 宝鉴」等子模块复用的公共几何工具。
 * 这些函数原本内联在 mysticGatesHourChart 里，抽出来是为了让各子盘共用同一份实现，
 * 避免「同一件事各写一遍、口径各自漂移」。
 * ========================================================================== */

/** 旬首：干支 → 该干支所在旬的旬首（甲子/甲戌/甲申/甲午/甲辰/甲寅） */
export function firstXunshou(gz) {
  const s = typeof gz === 'string' ? gz : gz[0] + gz[1];
  const JIAZI_STR = SEXAGENARY.map((x) => x[0] + x[1]);
  const idx = JIAZI_STR.indexOf(s);
  if (idx < 0) return null;
  return JIAZI_STR[(idx - (idx % 10) + 60) % 60];
}

/** 地盘里某仪所在的宫号（1..9）；找不到回 0 */
export function findHome(dp, gan) {
  for (let g = 1; g <= 9; g += 1) if (dp[g] === gan) return g;
  return 0;
}

/**
 * 中五寄坤二：宫号 5 → 2，其余原样。
 *
 * ★ 两说并存（如实标注）：《奇门宝鉴》卷首论五行分位——「惟中央无门，故虚而土寄合于西南……
 *   以中五所以合于坤二也。一本阳局中五合于二、阴局中五合于八……但其说于理尤为周备，
 *   而旧本多从前说，故遵之」。原书明言旧本不分阴阳遁一律寄坤二，本实现从旧本。
 *   若取「阴局寄艮八」一派，阴遁各盘会整盘位移，两说不可混用。详见 docs/CALIBER-NOTES.md。
 */
export function homeOf(gong) {
  return gong === 5 ? HOME5 : gong;
}

/**
 * 沿洛书八宫环（CLOCK）整体铺环：锚 anchor 落到 pal 宫，其余按环序铺开。
 * @param {string[]} ring 环序（STAR_RING 或 GATE_RING）
 * @param {string} anchor 锚（值符星 / 值使门）
 * @param {number} pal 锚落宫
 * @param {boolean} [rev] 是否反向铺（八门逆行用）
 */
export function rotateRingIn(ring, anchor, pal, rev) {
  const out = {};
  const gi = Math.max(0, CLOCK.indexOf(homeOf(pal)));
  const ai = Math.max(0, ring.indexOf(anchor));
  for (let j = 0; j < 8; j += 1) {
    const item = ring[(ai + j) % 8];
    const p = rev ? CLOCK[((gi - j) % 8 + 8) % 8] : CLOCK[(gi + j) % 8];
    out[p] = item;
  }
  out[2] = out[2] || ring[ai];
  return out;
}

/** 八神：自 g 宫起，阳遁顺、阴遁逆，铺八实宫 */
export function arrangeGodsIn(g, yang) {
  const out = {};
  const gi = Math.max(0, CLOCK.indexOf(homeOf(g)));
  for (let j = 0; j < 8; j += 1) {
    out[yang ? CLOCK[(gi + j) % 8] : CLOCK[((gi - j) % 8 + 8) % 8]] = GODS[j];
  }
  return out;
}
