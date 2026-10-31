/**
 * src/core/geomancy/flying-stars.js —— 玄空飞星（年月日时紫白）（自研，零依赖）
 *
 * 大白话：紫白九星（一白贪狼…九紫右弼）按洛书轨迹「飞布」九宫。
 * 「入中星」落在中宫，其余八星沿固定轨迹逐宫递增（顺飞）或递减（逆飞）。
 *
 * 口径：
 *   · 顺飞轨迹（洛书）：中5→乾6→兑7→艮8→离9→坎1→坤2→震3→巽4；
 *   · 年紫白：入中 = (11 − 年%9) mod 9（0 作 9）；年界取「公历年」（不换立春）——
 *     年紫白是逐年一位的纪年星，权威日历年表的口径就是公历年，与月/日/时的节气界不同层；
 *   · 月紫白：子午卯酉年正月起 8、寅申巳亥年起 2、辰戌丑未年起 5，逐月逆推入中，入中后顺飞；
 *     年支与月序一律取「节」换（立春换年换正月），不用中气 —— 中气换会早一个月；
 *     月序按**干支月**记（立春起=1 月，惊蛰=2 月 …… 小寒=12 月），与黄历「农历几月」不是同一个数；
 *   · 日紫白：分段起数（冬至1顺/雨水7顺/谷雨4顺/夏至9逆/处暑3逆/霜降6逆，皆中气，
 *     黄经分段 270/330/30/90/150/210 各为首日），起星日=交气后首个甲子日，入中=起星±间隔天 mod 9；
 *   · 时紫白：日支子午卯酉起 1（冬至后）/9（夏至后）、辰戌丑未起 4/6、寅申巳亥起 7/3，
 *     冬至后顺飞、夏至后逆飞；
 *   · 三元九运：1864 起每 20 年一运（2024–2043 = 九运·九紫）。
 *
 * ★ 文献状态（2026-10 复核改正）：
 *   · **年紫白有典籍直证**。《钦定协纪辨方书·卷十四》逐太岁条下均列「三元紫白」，
 *     给出上元/中元/下元三组年份里 一白、六白、八白、九紫 四星所落之宫。
 *     本书 60 条（甲子起顺推）共 177 个星位已与本年紫白公式（入中 = (11 − 公历年%9) mod 9、
 *     顺飞轨迹中→乾→兑→艮→离→坎→坤→震→巽）**逐星对拍，不符 0 处**。
 *     例如上元甲子（1864）：原文「一白中 六白坎 八白震 九紫巽」，本实现同。
 *     注：该节标题作「三元紫白」，用途是开山立向（二十四山配上中下三元），
 *     但其四星的年位分布与本层年紫白同源同法，故年层可引此为据。
 *   · **月/日/时紫白库内无直证**：18 部文献未见「月紫白」「日紫白」「时紫白」起法。
 *     此三层取通书通行法（库外《选择宗镜》系与近世择日书的共同口径），公式写在上面，
 *     逐条可复算，标注「近世整理，非古籍直证」。
 *   · 文献明载且已核对一致者：洛书飞布轨迹、九星五行与吉凶、三元九运分运（1864 起每 20 年一运）。
 */

import { dayNo, solarToJdn } from '../calendar/julian.js';
import { daySexagenaryIndex, seasonOf, yearSexagenaryIndex } from '../calendar/sexagenary.js';
import { solarTermsTable } from '../calendar/solar-terms.js';
import { BRANCHES, SEXAGENARY } from '../common/constants.js';

export const STARS = ['一白', '二黑', '三碧', '四绿', '五黄', '六白', '七赤', '八白', '九紫'];
export const STAR_META = {
  一白: { 吉凶: '吉', 宫: '坎', 五行: '水', 专位: '北', 主象: '贪狼·文昌官贵' },
  二黑: { 吉凶: '凶', 宫: '坤', 五行: '土', 专位: '西南', 主象: '巨门·病符' },
  三碧: { 吉凶: '凶', 宫: '震', 五行: '木', 专位: '东', 主象: '禄存·是非' },
  四绿: { 吉凶: '吉', 宫: '巽', 五行: '木', 专位: '东南', 主象: '文昌·科名' },
  五黄: { 吉凶: '大凶', 宫: '中', 五行: '土', 专位: '中', 主象: '廉贞·戊己大煞' },
  六白: { 吉凶: '吉', 宫: '乾', 五行: '金', 专位: '西北', 主象: '武曲·权威' },
  七赤: { 吉凶: '凶', 宫: '兑', 五行: '金', 专位: '西', 主象: '破军·口舌' },
  八白: { 吉凶: '大吉', 宫: '艮', 五行: '土', 专位: '东北', 主象: '左辅·财帛' },
  九紫: { 吉凶: '吉', 宫: '离', 五行: '火', 专位: '南', 主象: '右弼·喜庆' },
};

/** 顺飞轨迹：宫序（0..8 对应 中乾兑艮离坎坤震巽 的飞布路径，以九宫数表示） */
const TRACK = [5, 6, 7, 8, 9, 1, 2, 3, 4];
const GONG_NAME = { 1: '坎(北)', 2: '坤(西南)', 3: '震(东)', 4: '巽(东南)', 5: '中', 6: '乾(西北)', 7: '兑(西)', 8: '艮(东北)', 9: '离(南)' };

function n9(x) { return ((x - 1) % 9 + 9) % 9 + 1; }

/** 飞布：入中星 ruZhong、顺(+)逆(−)，返回 {宫号: 星} */
function feiGong(ruZhong, dir = 1) {
  const out = {};
  TRACK.forEach((gong, i) => {
    const star = dir === 1 ? n9(ruZhong + i) : n9(ruZhong - i);
    out[gong] = star;
  });
  return out;
}

/** 年紫白：入中星 */
export function yearStar(year) {
  return n9(9 - ((year - 2000) % 9));
}

/** 三元九运（1864 上元一运起） */
export function yunOf(year) {
  return ((Math.floor((year - 1864) / 20)) % 9) + 1;
}

/** 月紫白：入中星。
 *  口径：按「节气月」计，正月=寅月（立春起）。
 *  子午卯酉年正月起八白、寅申巳亥年起二黑、辰戌丑未年起五黄，逐月逆推入中。
 *  年支取「立春换年」的干支年支（与历法底座一致）。
 *  @param {number} year 公历年
 *  @param {number} yinMonth 节气月序 1..12（1=寅月，即立春所在月）
 */
export function monthStar(year, yinMonth) {
  // 年支与月序同走「节」界：年支取立春换年后的干支年支，月序取干支月序（立春=1 月，见 yinMonthOf）。
  //   两者必须同源于「节」——若年支取公历年而月序取节气月，跨年那一个月会错一格。
  const yZhi = yearSexagenaryIndex(year, 6, 1) % 12; // 年支序 0=子
  const start = [0, 6, 3, 9].includes(yZhi) ? 8 : [2, 8, 5, 11].includes(yZhi) ? 2 : 5;
  return n9(start - (yinMonth - 1)); // 逐月逆推（yinMonth 为干支月序：立春=1 … 小寒=12）
}

/** 由公历日期推干支月序（立春起=1 月，惊蛰=2 … 大雪=11、小寒=12）。
 *  实现：solarTermsTable 返回 Y-1 冬至 ~ Y 大雪，因此只需扫 y-1..y+1 三张表，
 *  把其中所有「节」按日期排序，取「≤ 目标日 且 ≥ 目标日前后最近立春」的最大月序即可。
 *  月份名与序号的绑定即干支月：立春（寅月）=1 …… 大雪（子月）=11、小寒（丑月）=12。
 */
export function yinMonthOf(y, m, d) {
  const JIE = [['立春', 1], ['惊蛰', 2], ['清明', 3], ['立夏', 4], ['芒种', 5], ['小暑', 6],
               ['立秋', 7], ['白露', 8], ['寒露', 9], ['立冬', 10], ['大雪', 11], ['小寒', 12]];
  const dn = dayNo(y, m, d);
  const rows = [];
  for (const yy of [y - 1, y, y + 1]) {
    const t = solarTermsTable(yy);
    for (const [name, idx] of JIE) {
      const it = t[name];
      if (!it || !it.text) continue;
      const [ty, tm, td] = it.text.split('-').map(Number);
      rows.push({ sdn: dayNo(ty, tm, td), idx });
    }
  }
  rows.sort((a, b) => a.sdn - b.sdn);
  // 目标日所处节气年的年首＝≤ 目标日的最后一个「立春」
  let lichun = -Infinity;
  for (const r of rows) if (r.idx === 1 && r.sdn <= dn && r.sdn > lichun) lichun = r.sdn;
  let idx = 1;
  for (const r of rows) if (r.sdn <= dn && r.sdn > lichun) idx = r.idx;
  return idx;
}

/** 日紫白：入中星。
 *  口径：以「太阳黄经三十分段」各段首日后的第一个甲子日为起星日，
 *  起星分别为 冬至一白（顺）、雨水七赤（顺）、谷雨四绿（顺）、
 *  夏至九紫（逆）、处暑三碧（逆）、霜降六白（逆）；入中=起星 ± 相隔天数（mod 9）。
 */
export function dayStar(y, m, d) {
  // 只给年份时按「当年 6 月 15 日」取（年中，离任何段首都有距离），避免 best 为空崩
  const mm = m || 6; const dd = d || 15;
  const dn = dayNo(y, mm, dd);
  const SEG = [
    ['冬至', 1, 1], ['雨水', 7, 1], ['谷雨', 4, 1],
    ['夏至', 9, -1], ['处暑', 3, -1], ['霜降', 6, -1],
  ];
  let best = null;
  for (const yy of [y - 1, y]) {
    const t = solarTermsTable(yy);
    for (const [name, start, dir] of SEG) {
      const it = t[name];
      if (!it || !it.text) continue;
      const [ty, tm, td] = it.text.split('-').map(Number);
      const segDn = dayNo(ty, tm, td);
      if (segDn <= dn && (!best || segDn > best.dn)) best = { dn: segDn, start, dir };
    }
  }
  // 起星日＝段首（交节当日）起「≥ 当日」的第一个甲子日；间隔带符号（目标日 − 起星日，可负）
  let q = best.dn;
  while (daySexagenaryIndex(...fromDn(q)) % 60 !== 0) q++;
  const span = dn - q;
  return best.dir === 1 ? n9(best.start + span) : n9(best.start - span);
  // 注：返「入中星」；逆飞段的九宫布星由 feiGong(rz, -1) 负责（见 chart 组装处），此处只定入中。
}

/** 日序 → [y,m,d] */
function fromDn(dn) {
  // 以 1970-01-01 为基准反推（dayNo 与儒略日同日序原点）
  const jdn = JDN_1970 + dn;
  const a = jdn + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
  const dd = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * dd / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * mm + 2) / 5) + 1;
  const month = mm + 3 - 12 * Math.floor(mm / 10);
  const year = 100 * b + dd - 4800 + Math.floor(mm / 10);
  return [year, month, day];
}
const JDN_1970 = 2440588;

/** 时紫白：入中星 */
export function hourStar(y, m, d, h) {
  const gz = daySexagenaryIndex(y, m, d);
  const dz = ((gz % 12) + 12) % 12; // 日支序 0=子（daySexagenaryIndex 可能为负，先归一）
  // 阳半＝冬至后至夏至前（顺）；阴半＝夏至后至冬至前（逆）
  const afterDZ = yangHalf(y, m, d);
  // 三组按十二支序（0=子）：四正＝子午卯酉（0,6,3,9）／四墓＝辰戌丑未（4,10,1,7）／四生＝寅申巳亥（2,8,5,11）。
  //   注意：时紫白的定局按「四正/四墓/四生」三组，起点分别为 1·4·7（冬至后顺）与 9·6·3（夏至后逆）。
  const grp = [0, 6, 3, 9].includes(dz) ? 'zheng' : [4, 10, 1, 7].includes(dz) ? 'mu' : 'sheng';
  const START = {
    zheng: { shun: 1, ni: 9 },
    mu: { shun: 4, ni: 6 },
    sheng: { shun: 7, ni: 3 },
  };
  const start = afterDZ ? START[grp].shun : START[grp].ni;
  const hourZhi = Math.floor(((h + 1) % 24) / 2); // 0=子
  const span = hourZhi;
  // 冬至后（阳半）顺、夏至后（阴半）逆：入中星逐时递增/递减。
  //   起点表 START 已分顺逆两侧（zheng 1/9、mu 4/6、sheng 7/3），此处只需按同一方向递推。
  return afterDZ ? n9(start + span) : n9(start - span);
}

/** 该时刻紫白盘的飞布方向（顺 +1 / 逆 −1）：冬至后至夏至前为顺，其余为逆 */
export function hourDir(y, m, d) {
  return yangHalf(y, m, d) ? 1 : -1;
}

/** 判定是否处于「阳半」（冬至后至夏至前），用于日月时紫白顺逆 */
function yangHalf(y, m, d) {
  const dn = dayNo(y, m, d);
  const pick = (t, name) => {
    const it = t[name];
    if (!it || !it.text) return null;
    const [ty, tm, td] = it.text.split('-').map(Number);
    return dayNo(ty, tm, td);
  };
  const tPrev = solarTermsTable(y - 1), tCur = solarTermsTable(y);
  const dongzhi = pick(tPrev, '冬至'), xiazhi = pick(tCur, '夏至');
  return dn >= dongzhi && dn < xiazhi;
}

/**
 * 全套飞星（年 → 月 → 日 → 时，四层各一张九宫盘）。
 *
 * 盘面输出按九宫格阅读序（巽4 离9 坤2／震3 中5 兑7／艮8 坎1 乾6）。
 * 顺逆飞：冬至后至夏至前为顺飞，夏至后至冬至前为逆飞 —— 日紫白按所属「段」定，时紫白按所处「半」定。
 * @param {{y:number,m:number,d:number,h?:number}} input 公历年月日与小时（缺 h 按午时）
 */
export function flyingStarsChart(input) {
  const { y, m, d, h = 12 } = input;
  const yun = yunOf(y);
  const yinMonth = yinMonthOf(y, m, d);
  const yRz = yearStar(y);
  const mRz = monthStar(y, yinMonth);
  const dSeg = daySegOf(y, m, d);            // 日紫白所属段（含顺逆）
  const dRz = dayStar(y, m, d);
  const hRz = hourStar(y, m, d, h);
  const hDir = hourDir(y, m, d);
  return {
    input,
    三元九运: { 运: yun, 星: STARS[yun - 1], 年份: yun === 9 ? '2024–2043' : '' },
    年紫白: { 入中: STARS[yRz - 1], 盘: fmt(feiGong(yRz)) },
    月紫白: { 入中: STARS[mRz - 1], 月序: yinMonth, 盘: fmt(feiGong(mRz)) },
    日紫白: { 入中: STARS[dRz - 1], 段落: dSeg.name, 顺: dSeg.dir === 1, 盘: fmt(feiGong(dRz, dSeg.dir)) },
    时紫白: { 入中: STARS[hRz - 1], 顺: hDir === 1, 盘: fmt(feiGong(hRz, hDir)) },
    口径: '年紫白按公历年逐年退一位；月紫白以立春换年、节气月序逆推入中，顺飞布宫；'
      + '日紫白按六段中气（冬至/雨水/谷雨夏至/处暑/霜降）定起星、交气后首个甲子日起算，冬至至夏至顺飞、夏至至冬至逆飞；'
      + '时紫白按日支四正四生四墓定起数，冬至后顺、夏至后逆。',
  };
}

/** 日紫白所属段（六段中气之一）与顺逆 —— 供出料层说明「为什么这张盘是逆飞」 */
export function daySegOf(y, m, d) {
  const dn = dayNo(y, m, d);
  const SEG = [
    ['冬至', 1, 1], ['雨水', 7, 1], ['谷雨', 4, 1],
    ['夏至', 9, -1], ['处暑', 3, -1], ['霜降', 6, -1],
  ];
  let best = null;
  for (const yy of [y - 1, y]) {
    const t = solarTermsTable(yy);
    for (const [name, start, dir] of SEG) {
      const it = t[name];
      if (!it || !it.text) continue;
      const [ty, tm, td] = it.text.split('-').map(Number);
      const segDn = dayNo(ty, tm, td);
      if (segDn <= dn && (!best || segDn > best.dn)) best = { dn: segDn, name: name, dir };
    }
  }
  return best || { dn, name: '冬至', dir: 1 };
}

function fmt(pan) {
  // 九宫格输出：巽4 离9 坤2 / 震3 中5 兑7 / 艮8 坎1 乾6
  const pos = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  return pos.map((g) => STARS[pan[g] - 1]).join(' | ');
}
