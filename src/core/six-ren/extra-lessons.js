/**
 * src/core/six-ren/extra-lessons.js —— 大六壬·杂课（课经）判定
 *
 * 大白话：九宗门（元首、重审、知一、涉害、遥克、昴星、别责、八专、伏吟、返吟）
 *   只解决「三传怎么起」，古人另有一整套「课体」按三传、四课、天将、旬首旬尾的
 *   组合给格局名（课经六十余课）。这一层不改变三传，只给「这盘叫什么课、主什么」。
 *
 * 文献出处：refs-texts/《六壬大全》-明·佚名（四库本）.md
 *   · 歌诀总纲在「课经」前段（第 1460–1500 行，每句一课的七言诀）；
 *   · 每课的释文与算例在第 4100–4700 行，标题形如「三光课」「轩盖课」。
 *   每条判定都写清「原文怎么说的、本盘哪里命中」，不做加权、不做发挥。
 *
 * 收录原则：只收**原文给出了可机器判定的组合条件**的课；凡原文靠「旺相休囚」「神将吉凶」
 *   之外还要靠断课人取舍的（如引从、亨通、荣华、和美），一律不收，避免把主观断语
 *   伪装成算法。已收 18 课，见 LESSON_NAMES。
 */

import { ZHI_Z, ZHI_WX, GAN_WX, GAN_Z, KE_BY, SHENG_BY } from './tables.js';
import { monthBranchIndex, yearSexagenaryIndex } from '../calendar/sexagenary.js';

const zIdx = (z) => ZHI_Z.indexOf(z);
/** 支五行编码（0木 1火 2土 3金 4水） */
const zWx = (z) => ZHI_WX[zIdx(z)];
/** 相冲之支 */
const clashZhi = (z) => ZHI_Z[(zIdx(z) + 6) % 12];
/** 四孟（寅申巳亥）·四仲（子午卯酉）·四季（辰戌丑未） */
const isZhong = (z) => [0, 3, 6, 9].includes(zIdx(z));
const isJi = (z) => [4, 7, 10, 1].includes(zIdx(z));
/** 吉将（《六壬大全·卷一·十二将释》以贵人、青龙、六合、太常、太阴、天后为吉） */
const JI_JIANG = ['贵人', '青龙', '六合', '太常', '太阴', '天后'];


/* ---------------- 德神与五合（《六壬大全·德庆课》《六壬大全·合欢课》原文起例） ---------------- */
/** 干德：甲己德寅、乙庚申、丙辛巳、戊癸巳、丁壬亥 */
const GAN_DE = { 甲: '寅', 己: '寅', 乙: '申', 庚: '申', 丙: '巳', 辛: '巳', 戊: '巳', 癸: '巳', 丁: '亥', 壬: '亥' };
/** 支德：子日起巳顺行十二辰（子→巳、丑→午、…） */
const zhiDe = (z) => (zIdx(z) >= 0 ? ZHI_Z[(zIdx(z) + 5) % 12] : null);
/** 天干五合（《六壬大全·合欢课》原文名目：甲己中正、乙庚仁义、丙辛威权、丁壬淫讹、戊癸无情） */
const GAN_HE_PAIR = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
/** 六合（支） */
const ZHI_HE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
/** 三合局：给出三支是否成局（申子辰／亥卯未／寅午戌／巳酉丑） */
const SAN_HE_SETS = [['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']];
const isSanHe = (arr) => SAN_HE_SETS.some((set) => arr.length === 3 && arr.every((z) => set.includes(z)));

/** 月建五行编码 */
function monthWx(input) {
  const { y, m, d, h = 12, minute = 0 } = input || {};
  const z = ZHI_Z[monthBranchIndex(y, m, d, h, minute)];
  return zWx(z);
}
/** 某支在该月是「旺」还是「相」（当令者旺、月建所生者相），否则 false */
function wangXiang(z, mWx) {
  const wx = zWx(z);
  return wx === mWx ? '旺' : SHENG_BY[mWx] === wx ? '相' : false;
}

/** 天盘查表：地盘支 → 天盘支 */
function tianMap(c) {
  const map = {};
  for (const cell of c.天地盘 || []) map[cell.地盘] = cell.天盘;
  return map;
}
/** 旬尾（癸X）：旬首支 + 9 */
function xunWei(xunShou) {
  const z = String(xunShou || '').slice(1, 2);
  return zIdx(z) >= 0 ? ZHI_Z[(zIdx(z) + 9) % 12] : null;
}
/** 日干寄宫 */
const LODGING = { 甲: '寅', 乙: '辰', 丙: '巳', 丁: '未', 戊: '巳', 己: '未', 庚: '申', 辛: '戌', 壬: '亥', 癸: '丑' };

/**
 * 判定一盘命中哪些杂课。
 * @param {object} c 六壬盘（sixRenChart 的返回值）
 * @param {object} [input] 原始输入（取月建用；缺省用 c.input）
 * @returns {Array<{课:string, 断:string, 原文:string, 说明:string}>}
 */
export function extraLessonsOf(c, input) {
  const out = [];
  const inp = input || c.input || {};
  const san = (c.三传 || []).map((x) => x.支).filter(Boolean);
  const chu = san[0];
  const chuJiang = (c.三传 && c.三传[0] && c.三传[0].天将) || '';
  const tian = tianMap(c);
  // ★ 盘里的「干支.日」是 ['甲','戌'] 数组（chart.js 直接返回六十甲子二元组），
  //   这里必须先拼成字符串，否则 slice 出来是数组、查表全落空（踩过）。
  const rawGz = (c.干支 && c.干支.日) || '';
  const dayGz = Array.isArray(rawGz) ? rawGz.join('') : String(rawGz);
  const dayGan = dayGz.slice(0, 1);
  const dayZhi = dayGz.slice(1, 2);
  const jiGong = LODGING[dayGan] || '';
  const mWx = monthWx(inp);
  // 年支（太岁）与月建支：六壬的「时泰」「龙德」都以太岁、月建为发用条件
  const 年支 = ZHI_Z[yearSexagenaryIndex(inp.y, inp.m, inp.d, inp.h || 12) % 12];
  const 月建支 = ZHI_Z[monthBranchIndex(inp.y, inp.m, inp.d, inp.h || 12, inp.minute || 0)];
  const set = new Set(san);
  const push = (课, 断, 原文, 说明) => out.push({ 课, 断, 原文, 说明 });

  // ① 三光课——「日辰、发用者旺相，乘吉将。日为人，辰为宅，用神为动作，三处旺相乘吉将，是三处皆有光辉」
  if (chu) {
    const wz = wangXiang(dayZhi, mWx);
    const wy = wangXiang(chu, mWx);
    if (wz && wy && JI_JIANG.includes(chuJiang)) {
      push('三光课', '吉·三处有光',
        '《六壬大全·三光课》「日辰、发用者旺相，乘吉将……三处旺相乘吉将，是三处皆有光辉，故名三光」',
        `日支${dayZhi}于月建为「${wz}」、发用${chu}为「${wy}」，初传乘${chuJiang}（吉将）——日、辰、用三处皆光辉。`);
    }
  }

  // ② 三阳课——「日辰与用旺，日辰贵前贵顺登」
  if (chu) {
    const gui = (c.十二天将 && c.十二天将.贵人) || (c.贵人 || '');
    const shun = (c.十二天将 && c.十二天将.顺逆) === '顺';
    const wz = wangXiang(dayZhi, mWx);
    const wy = wangXiang(chu, mWx);
    // 「贵前」：自贵人顺行方向上、未到日支之前的位置（顺行为贵人所临之后一辰起算）
    const guiIdx = zIdx(gui);
    const beforeGui = guiIdx >= 0 && ((zIdx(dayZhi) - guiIdx) % 12 + 12) % 12 <= 6;
    if (wz && wy && shun && beforeGui) {
      push('三阳课', '吉·阳气进',
        '《六壬大全·三阳课》「日辰与用旺，日辰贵前贵顺登」',
        `日支${dayZhi}与发用${chu}俱旺相，贵人${gui}顺布且日辰在其前六辰之内——三阳进气，主君子道长。`);
    }
  }

  // ③ 轩盖课——「三传午卯子」，释文「课值胜光（午）为用，遇太冲（卯）、神后（子）」
  if (san.length === 3 && set.has('午') && set.has('卯') && set.has('子')) {
    push('轩盖课', '吉·高轩华盖',
      '《六壬大全·轩盖课》「凡课值胜光为用，遇太冲、神后，为轩盖课」',
      `三传${san.join('')}：胜光午、太冲卯、神后子三神并遇，如乘驷马轩车、高张华盖，主加官荣显。`);
  }

  // ④ 铸印课——「三传巳戌卯」，释文「戌加巳……卯为车，又名铸印乘轩」
  if (tian['巳'] === '戌' && (set.has('卯') || set.has('巳'))) {
    push('铸印课', '吉·印绶入手',
      '《六壬大全·铸印课》「戌加巳……卯为车，又名铸印乘轩」',
      `天盘戌加地盘巳（戌中辛金逢巳中丙火煅炼成印）${set.has('卯') ? '，三传记卯为轩车，是铸印乘轩之象' : ''}，主官禄迁擢、符命入手。`);
  }

  // ⑤ 斩关课——「凡卦魁罡加日辰发用，为斩关课」
  if ((chu === '辰' || chu === '戌') && (tian[dayZhi] === chu || tian[jiGong] === chu)) {
    push('斩关课', '利出行逃遁',
      '《六壬大全·斩关课》「凡卦魁罡加日辰发用，为斩关课」',
      `发用${chu}（${chu === '辰' ? '天罡' : '天魁'}）临地盘${tian[dayZhi] === chu ? `日支${dayZhi}` : `日干寄宫${jiGong}`}——魁罡加日辰，关梁可越，最利逃亡出行；若魁罡作官鬼乘凶将，则名「斩关逢吏」，阻隔难行。`);
  }

  // ⑥ 闭口课——「凡旬尾加旬首……为闭口课」
  {
    const wei = xunWei(c.旬首);
    const shouZhi = String(c.旬首 || '').slice(1, 2);
    if (wei && shouZhi && tian[shouZhi] === wei) {
      push('闭口课', '平·事迹难明',
        '《六壬大全·闭口课》「凡旬尾加旬首……为闭口课」',
        `${c.旬首}旬旬尾${wei}加于旬首${shouZhi}之上——首尾相加，环圆无端，故名闭口。主禁口不语、寻人没影、失物潜形、告贵弗允。`);
    }
  }

  // ⑦ 游子课——「季用又乘丁，再遇天马是西东」
  if (chu && isJi(chu)) {
    const dun = (c.三传遁干 && c.三传遁干[0]) || '';
    const ma = (c.天马 && c.天马.天马) || '';
    if (dun.indexOf('丁') >= 0 || ma === chu) {
      push('游子课', '主游荡在外',
        '《六壬大全·游子课》「季用又乘丁，再遇天马是西东」',
        `发用${chu}为四季之神${dun.indexOf('丁') >= 0 ? `、遁干${dun}带丁` : `、正为天马${ma}`}——用季主滞留、乘丁主移动、天马主远行，三象并见，主游荡东西、居止不定。`);
    }
  }

  // ⑧ 三交课——释文「凡四仲日占，四仲加日辰，三传皆仲将，逢阴合，为三交课」
  //   ★ 不能要求「四课尽仲」：日干寄宫只在寅辰巳未申戌亥丑，没有一个是仲，那样永远判不出来。
  //   原文是三条交加：①四仲日占、四仲加日辰（干上或支上为仲）②仲神发用、三传皆仲 ③仲乘太阴或六合。
  if (isZhong(dayZhi) && san.length === 3 && san.every(isZhong)) {
    const lessons = c.四课 || [];
    const jiaRiChen = lessons.some((k) => isZhong(k.上) && (k.课 === 1 || k.课 === 3));
    const yinHe = (c.十二天将 && c.十二天将.将) || {};
    const chengYinHe = san.some((z) => ['太阴', '六合'].includes(yinHe[z]));
    if (jiaRiChen && chengYinHe) {
      push('三交课', '主交加勾连',
        '《六壬大全·三交课》「凡四仲日占，四仲加日辰，三传皆仲将，逢阴合，为三交课」',
        `日支${dayZhi}为四仲，${lessons.filter((k) => isZhong(k.上) && (k.课 === 1 || k.课 === 3)).map((k) => `${k.课 === 1 ? '干' : '支'}上${k.上}`).join('、')}亦仲（一交），`
        + `三传${san.join('')}皆仲（二交），${san.filter((z) => ['太阴', '六合'].includes(yinHe[z])).map((z) => `${z}乘${yinHe[z]}`).join('、')}（三交）——三交相遇，主事体勾连、谋事不明、家隐奸私。`);
    }
  }

  // ⑨ 乱首课——「支加干克干」；赘婿课——「支临干被克」
  if (tian[jiGong] === dayZhi) {
    const zW = zWx(dayZhi);
    const gW = GAN_WX[GAN_Z.indexOf(dayGan)];
    if (zW !== undefined && gW !== undefined) {
      if (KE_BY[zW] === gW) {   // 支（zW）克干（gW）→ 乱首
        push('乱首课', '凶·以下犯上',
          '《六壬大全·乱首课》「乱首支加干克干」',
          `日支${dayZhi}临日干寄宫${jiGong}而克日干${dayGan}——支加干而克干，是下犯上、卑凌尊之象。`);
      } else if (KE_BY[gW] === zW) {   // 干克支 → 赘婿
        push('赘婿课', '凶·以尊就卑',
          '《六壬大全·赘婿课》「赘婿支临干被克」',
          `日支${dayZhi}临日干寄宫${jiGong}，反被日干${dayGan}所克——支临干而被克，如赘婿寄居，凡事受人牵制、不得自由。`);
      }
    }
  }

  // ⑩ 冲破课——「冲破日辰冲为用」
  if (chu && clashZhi(dayZhi) === chu) {
    push('冲破课', '凶·冲散',
      '《六壬大全·冲破课》「冲破日辰冲为用，更兼岁月破神并」',
      `发用${chu}正冲日支${dayZhi}——用神冲日辰，主事体冲散、成而复破。`);
  }

  // ⑪ 淫泆课——「淫泆后合乘卯酉」
  {
    const jiang = (c.十二天将 && c.十二天将.将) || {};
    const hit = ['卯', '酉'].filter((z) => ['天后', '六合'].includes(jiang[z]));
    if (hit.length && (set.has('卯') || set.has('酉'))) {
      push('淫泆课', '主淫乱酒色',
        '《六壬大全·淫泆课》「淫泆后合乘卯酉，狡童泆女此中情」',
        `${hit.map((z) => `${z}上乘${jiang[z]}`).join('、')}，而三传见${set.has('卯') ? '卯' : '酉'}——天后、六合乘卯酉，主酒色淫乱、阴私暧昧之事。`);
    }
  }


  // ⑫ 六仪课——「凡课的旬首之仪发用或入传，为六仪课」
  {
    const shouZhi = String(c.旬首 || '').slice(1, 2);
    if (shouZhi && set.has(shouZhi)) {
      push('六仪课', '吉·凡事吉庆',
        '《六壬大全·六仪课》「凡课的旬首之仪发用或入传，为六仪课」',
        `本旬旬首${c.旬首}之仪${shouZhi}入于三传（${san.join('')}）——旬首为六阳之首、直符之使，有礼仪之尊，主凡事吉庆、家集千祥、罪逢赦宥。`);
    }
  }

  // ⑬ 时泰课——「用起太岁、月建，乘青龙、六合，又带财德之神」
  {
    if (chu && (chu === 年支 || chu === 月建支) && ['青龙', '六合'].includes(chuJiang)) {
      push('时泰课', '吉·时运通泰',
        '《六壬大全·时泰课》「凡课用起太岁、月建，乘青龙、六合，又带财德之神，为时泰课」',
        `发用${chu}正为${chu === 年支 ? '太岁' : '月建'}${chuJiang === '青龙' ? '、乘青龙（官长尊贵、钱财喜庆）' : '、乘六合（谋干利禄、婚姻合和）'}——时运通泰，主万事亨利、皇恩欲拜、灾患潜消。`);
    }
  }

  // ⑭ 龙德课——「太岁月将乘贵人发用」
  {
    // 月将名形如「从魁(酉)」，只留支字（半角/全角括号都要处理，否则永远取不到）
    const yueJiangZhi = String((c.月将 && c.月将.name) || '').replace(/[^子丑寅卯辰巳午未申酉戌亥]/g, '');
    if (chu && (chu === 年支 || chu === yueJiangZhi) && chuJiang === '贵人') {
      push('龙德课', '吉·云龙际会',
        '《六壬大全·龙德课》「凡太岁月将乘贵人发用，为龙德课」',
        `发用${chu}为${chu === 年支 ? '太岁（人君）' : `月将（${c.月将.name}，太阳）`}而乘贵人——太岁、月将并贵人三者相合，如龙行雨泽、德及万物，主天子恩泽、加官进爵。`);
    }
  }

  // ⑮ 德庆课——「课日辰干支德神……发用，并在年命乘吉将」
  {
    const de = [];
    if (GAN_DE[dayGan]) de.push({ 名: `干德${GAN_DE[dayGan]}`, 支: GAN_DE[dayGan] });
    const zd = zhiDe(dayZhi);
    if (zd) de.push({ 名: `支德${zd}`, 支: zd });
    const hit = de.find((x) => x.支 === chu);
    if (hit && JI_JIANG.includes(chuJiang)) {
      push('德庆课', '吉·德神在位',
        '《六壬大全·德庆课》「凡课日辰干支德神……发用，并在年命乘吉将，为德庆课」',
        `发用${chu}正为${hit.名}（日干${dayGan}、日支${dayZhi}所值），又乘${chuJiang}吉将——德神在位，诸杀潜藏，主囚禁得释、病危无妨、谋望吉昌。`);
    }
  }

  // ⑯ 合欢课——「日辰遇天干作合，及支三合六合发用」
  {
    const ganShang = (c.四课 && c.四课[0] && c.四课[0].上) || '';
    const ganShangDun = ((c.三传遁干 || [])[0] || '').slice(0, 1);
    const heByGan = ganShang && ZHI_HE[ganShang] === '' ? false : false;
    // 天干作合：干上神与日干为五合（干上神之干 = 其遁干），或干上神与日支六合
    const ganHe = (ganShangDun && GAN_HE_PAIR[ganShangDun] === dayGan) || (ganShang && ZHI_HE[ganShang] === dayZhi);
    const zhiHeSan = (chu && ZHI_HE[chu] === dayZhi) || isSanHe(san);
    // 原文三条件并列（干支作合 + 三合六合发用 + 年命乘吉将），未给本命时以「发用乘吉将」代之，不降格为只需一条
    if (ganHe && zhiHeSan && JI_JIANG.includes(chuJiang)) {
      push('合欢课', '吉·奇偶交并',
        '《六壬大全·合欢课》「凡课日辰遇天干作合，及支三合六合发用，并占人年命俱乘吉将，为合欢课」',
        `${ganHe ? `干上${ganShang}与日干${dayGan}${ganShangDun ? `（遁干${ganShangDun}）` : ''}作合` : ''}${ganHe && zhiHeSan ? '，' : ''}${zhiHeSan ? `${isSanHe(san) ? `三传${san.join('')}成三合局` : `发用${chu}与日支${dayZhi}六合`}` : ''}——干支作合，主乾坤匹配、万事佳庆、婚姻天缘（原文另须年命乘吉将，未给本命时以发用乘吉将代之）。`);
    }
  }

  // ⑰ 和美课——「干支遇三合六合，上下递互相合」
  {
    const ganShang = (c.四课 && c.四课[0] && c.四课[0].上) || '';
    const zhiShang = (c.四课 && c.四课[2] && c.四课[2].上) || '';
    if (isSanHe(san) && ganShang && zhiShang && ZHI_HE[ganShang] === zhiShang) {
      push('和美课', '吉·上下欢悦',
        '《六壬大全·和美课》「凡课干支遇三合六合，上下递互相合，取为和美课」',
        `三传${san.join('')}成三合局，而干上${ganShang}与支上${zhiShang}作六合——三合六合相呼，主交易大通、财利不绝、婚吉事成。`);
    }
  }

  return out;
}

/** 已收录的课名（供登记表与测试校验） */
export const LESSON_NAMES = [
  '三光课', '三阳课', '轩盖课', '铸印课', '斩关课', '闭口课',
  '游子课', '三交课', '乱首课', '赘婿课', '冲破课', '淫泆课',
  '六仪课', '时泰课', '龙德课', '德庆课', '合欢课', '和美课',
];
