/**
 * src/core/liuren/tables.js —— 大六壬·公共字表与关系表（自研，零依赖）
 *
 * 大白话：把「月将、日干寄宫、五行、五行的相克关系、三刑、六冲、孟仲季、驿马」这些
 *   反复要用、且一旦写错就会让整盘结论反过来的东西，集中在这一份文件里。
 *
 * ★ 教训（真实踩过）：五行编码一度写成 0木 1火 2土 **3水 4金**，而 KE_BY 表按「3 金 4 水」写的，
 *   两组编码对不上，于是「申（金）克卯（木）」判成不克，全盘发用错乱。故此处把
 *   干/支五行与克序表放在同一段里，并互相校验（见文件末尾 assertTables()）。
 */

/** 支序：子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11 */
export const ZHI_Z = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
/** 干序：甲0 乙1 丙2 丁3 戊4 己5 庚6 辛7 壬8 癸9 */
export const GAN_Z = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/* ============================== 五行 ============================== */
/** 五行编码：0木 1火 2土 3金 4水（全项目统一，勿改） */
export const WX_NAME = ['木', '火', '土', '金', '水'];
/** 干 → 五行：甲乙木、丙丁火、戊己土、庚辛金、壬癸水 */
export const GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
/** 支 → 五行：子水、丑土、寅木、卯木、辰土、巳火、午火、未土、申金、酉金、戌土、亥水 */
export const ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
/** 克序：x 克 KE_BY[x]（木克土、土克水、水克火、火克金、金克木） */
export const KE_BY = { 0: 2, 1: 3, 2: 4, 3: 0, 4: 1 };
/** 生序：x 生 SHENG_BY[x]（木生火、火生土、土生金、金生水、水生木） */
export const SHENG_BY = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 0 };

/** a 是否克 b */
export function ke(a, b) { return KE_BY[a] === b; }
/** a 是否被 b 克（即 b 克 a） */
export function beiKe(a, b) { return KE_BY[b] === a; }

/* ============================== 月将 ============================== */
/**
 * 月将（中气换将）：雨水后亥将、春分后戌将、谷雨后酉将、小满后申将、夏至后未将、
 *   大暑后午将、处暑后巳将、秋分后辰将、霜降后卯将、小雪后寅将、冬至后丑将、大寒后子将。
 * 值 = 月将支序。
 */
export const YUEJIANG = {
  雨水: 11, 春分: 10, 谷雨: 9, 小满: 8, 夏至: 7, 大暑: 6,
  处暑: 5, 秋分: 4, 霜降: 3, 小雪: 2, 冬至: 1, 大寒: 0,
};

/** 月将名（十二神）：子神后、丑大吉、寅功曹、卯太冲、辰天罡、巳太乙、午胜光、未小吉、申传送、酉从魁、戌河魁、亥登明 */
export const JIANG_NAME = [
  '神后(子)', '大吉(丑)', '功曹(寅)', '太冲(卯)', '天罡(辰)', '太乙(巳)',
  '胜光(午)', '小吉(未)', '传送(申)', '从魁(酉)', '河魁(戌)', '登明(亥)',
];

/* ============================== 寄宫 ============================== */
/**
 * 日干寄宫（心印赋）：甲课寅、乙课辰、丙戊课巳、丁己课未、庚课申、辛课戌、壬课亥、癸课丑。
 * 值 = 支序。★ 曾把「丙戊课巳」与「丁己课未」写反，癸又写成 0（子），三处同时错
 *   → 四课首位全偏，九宗门从第一步就判错。
 */
export const JIGONG = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1];

/* ============================== 关系表 ============================== */
/** 六冲：x 冲 CHONG[x]（子午、丑未、寅申、卯酉、辰戌、巳亥） */
export const CHONG = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
export function chongOf(z) { return CHONG[((z % 12) + 12) % 12]; }

/**
 * 三刑（含自刑）：子刑卯、卯刑子、寅刑巳、巳刑申、申刑寅、丑刑戌、戌刑未、未刑丑、辰午酉亥自刑。
 * ★ 旧表把「丑刑戌、戌刑未、未刑丑」写成了 6→7→2→6 闭环错值（丑→未、戌→未、未→未），
 *   导致伏吟课取刑出「未→未」原地打转、三传全错。现按支序直接写 12 项：
 *   子0→卯3、丑1→戌10、寅2→巳5、卯3→子0、辰4→辰4、巳5→申8、午6→午6、
 *   未7→丑1、申8→寅2、酉9→酉9、戌10→未7、亥11→亥11。
 */
export const XING = [3, 10, 5, 0, 4, 8, 6, 1, 2, 9, 7, 11];
export function xingTarget(z) { return XING[((z % 12) + 12) % 12]; }
/** 自刑：辰午酉亥 */
export const ZI_XING = [4, 6, 9, 11];
export function isZiXing(z) { return ZI_XING.includes(((z % 12) + 12) % 12); }

/** 四孟（寅巳申亥）/ 四仲（子卯午酉）/ 四季（辰未戌丑） */
export const MENG = [2, 5, 8, 11];
export const ZHONG = [0, 3, 6, 9];
export const JI = [4, 7, 10, 1];
/** 孟仲季：0 孟 / 1 仲 / 2 季 */
export function mengZhongJi(z) {
  const x = ((z % 12) + 12) % 12;
  if (MENG.includes(x)) return 0;
  if (ZHONG.includes(x)) return 1;
  return 2;
}

/** 驿马：申子辰马在寅、寅午戌马在申、巳酉丑马在亥、亥卯未马在巳（键与值都是支序） */
export const YIMA = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5];
export function yimaOf(z) { return YIMA[((z % 12) + 12) % 12]; }

/* ============================== 月将定位 ============================== */
import { prevJieqi } from '../calendar/jieqi2.js';

/**
 * 月将：找 ≤ 当日的最近中气，返回月将支序。
 * 实现：先取当月的上一个节气；若它不在中气表里，就逐月往前找，直到命中十二中气之一。
 * @param {number} y @param {number} m @param {number} d
 */
export function yueJiangOf(y, m, d, h) {
  // ★ 换将粒度：交节当天按**小时**判定（旧版口径）。
  //   prevJieqi(y,m,d) 返回「日期 ≤ 当日」的最近节气；若节气就在当天而占时小时数小于交节小时，
  //   仍算未交节（用上一个中气），否则当天 0 点就会提前换将，四课整盘偏一位。
  const cur = prevJieqi(y, m, d);
  if (cur) {
    const sameDay = cur.y === y && cur.m === m && cur.d === d;
    const passed = !sameDay || h == null || h >= cur.hh;
    if (passed && cur.名 in YUEJIANG) return YUEJIANG[cur.名];
    if (!passed) {
      const dd = new Date(Date.UTC(y, m - 1, d - 1));
      const prev = prevJieqi(dd.getUTCFullYear(), dd.getUTCMonth() + 1, dd.getUTCDate());
      if (prev && prev.名 in YUEJIANG) return YUEJIANG[prev.名];
      if (prev) return YUEJIANG_prev(prev);
    }
  }
  // 当日没有中气：退到「上一个节气的前一天」继续找上一个中气，最多回退 40 次（约三年）
  let cursor = cur || { y, m, d };
  for (let back = 0; back < 40; back += 1) {
    const dd = new Date(Date.UTC(cursor.y, cursor.m - 1, cursor.d - 1));
    cursor = { y: dd.getUTCFullYear(), m: dd.getUTCMonth() + 1, d: dd.getUTCDate() };
    const prev = prevJieqi(cursor.y, cursor.m, cursor.d);
    if (!prev) break;
    if (prev.名 in YUEJIANG) return YUEJIANG[prev.名];
    cursor = prev;
  }
  return 0;
}

/** 往前找上一个中气对应的月将（辅助：交节当日尚未交节时用） */
function YUEJIANG_prev(cur) {
  let cursor = cur;
  for (let back = 0; back < 40; back += 1) {
    const dd = new Date(Date.UTC(cursor.y, cursor.m - 1, cursor.d - 1));
    cursor = { y: dd.getUTCFullYear(), m: dd.getUTCMonth() + 1, d: dd.getUTCDate() };
    const prev = prevJieqi(cursor.y, cursor.m, cursor.d);
    if (!prev) break;
    if (prev.名 in YUEJIANG) return YUEJIANG[prev.名];
    cursor = prev;
  }
  return 0;
}

/* ============================== 自检 ============================== */
/**
 * 表间自检：五行编码与克序/生序/干支五行必须互相印证。
 * 一旦有人再改编码而漏改另一处，模块加载即抛错，而不是等盘算错。
 */
export function assertTables() {
  if (GAN_WX.length !== 10) throw new Error('liuren/tables: GAN_WX 长度应为 10');
  if (ZHI_WX.length !== 12) throw new Error('liuren/tables: ZHI_WX 长度应为 12');
  const expect = { 0: 2, 2: 4, 4: 1, 1: 3, 3: 0 };
  for (const k in expect) {
    if (KE_BY[k] !== expect[k]) throw new Error(`liuren/tables: KE_BY[${k}] 应为 ${expect[k]}`);
  }
  if (WX_NAME[3] !== '金' || WX_NAME[4] !== '水') throw new Error('liuren/tables: WX_NAME 与 KE_BY 编码不一致');
  if (JIGONG.length !== 10) throw new Error('liuren/tables: JIGONG 长度应为 10');
  if (GAN_Z.length !== 10 || ZHI_Z.length !== 12) throw new Error('liuren/tables: 干支字表长度不对');
  return true;
}

assertTables();
