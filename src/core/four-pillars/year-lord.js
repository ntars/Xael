/**
 * src/core/four-pillars/year-lord.js —— 流年太岁与日主的关系（自研，零依赖）
 *
 * 大白话：流年干支叫「太岁」，当年当家；看它跟日主、日支、大运碰在一起是和还是打，
 * 是本命盘里「某一年顺不顺」最直接的一层判断。本模块只按原书条件判关系，不额外打分。
 *
 * 口径来源：《三命通会·论太岁》（明·万民英，refs-texts 第 365 行）原文：
 *   ·「岁伤日干有祸必轻，日犯岁君灾殃必重」——太岁干克日干为「岁伤日干」（偏官，君治臣，
 *      灾晦不为大害）；日干克太岁干为「日犯岁君」（偏财，臣弑君，下凌上，其凶决不能免）。
 *   ·「若五行有救、四柱有情：如甲日克戊年，四柱元有庚申金，或大运中亦有，将甲木制伏纯粹，
 *      不能克戊土，为有救……如大运并四柱中有一癸字，与戊相合，为有情……若二字俱全，其年凶
 *      反为吉；有一字者凶半；二字俱无，凶莫能解。」——故「救」「情」须逐条查四柱与大运天干。
 *   ·「生时相逢真太岁，假如甲子生人又见甲子年，谓之真太岁，又名转趾煞」。
 *   ·「如癸巳日逢丁亥流年，日干支冲克太岁曰征；运干支伤冲太岁亦曰征；太岁干支冲日干支亦曰
 *      征，其年则凶，灾祸未免。」——「征太岁」按天克地冲判。
 *   ·「甲子流年又是甲子运，谓之岁运并临，独羊刃七煞为凶，财官印绶亦吉」。
 *   ·「甲子日见甲子太岁，谓之日年相并……君子得之谓之君臣庆会」。
 *
 * 流年与大运之间还有一层（「岁运」），据《三命通会·明通赋》注（refs-texts 第 5945–5946 行）：
 *   ·「劫财羊刃切忌时逢，岁运并临灾殃立至」「岁冲运则崩，运冲岁则晦」；
 *   · 注文：「太岁冲运其祸重，运克太岁则祸轻」——方向不同、轻重不同，故分「岁冲运」「运冲岁」两判；
 *   · 注文末又自承异说：「考渊源、渊海诸说俱以运克岁为重」——本书两存，输入出并列不取舍。
 *   ·《三命通会·巫咸撮要》注（第 5109 行）：「最忌者日干冲运，所喜者运干生于日干也」。
 * 逐条见 docs/CALIBER-NOTES.md「八字·流年太岁」节。
 */

import { SEXAGENARY, STEMS, SHENG, KE } from '../common/constants.js';
import { fourPillarsChart } from './chart.js';

/** 干支文本 → 六十甲子序号（找不到返回 -1） */
function idxOf(gz) {
  const t = Array.isArray(gz) ? gz.join('') : String(gz);
  return SEXAGENARY.findIndex((it) => it.join('') === t);
}

/** 五行相克关系：a 克 b */
function ke(a, b) {
  return !!a && !!b && KE[a] === b;
}

/** 天干五行 */
function ganWx(g) {
  const s = STEMS.find((x) => x.z === g);
  return s ? s.wx : null;
}

/** 地支六冲 */
function chong(a, b) {
  if (!a || !b) return false;
  return Math.abs('子丑寅卯辰巳午未申酉戌亥'.indexOf(a) - '子丑寅卯辰巳午未申酉戌亥'.indexOf(b)) === 6;
}

/**
 * 流年太岁判定。
 * @param {object} input 四柱同参 {y,m,d,h,minute,gender}
 * @param {number} year 要看的公历年（流年）
 * @param {object} [opts] { 大运干支 } 可选，用于「岁运并临」「运冲太岁」，以及「救」中的大运天干
 * @returns {object} {流年, 太岁, 日主, 判[], 救, 情, 结论, 依据}
 */
export function yearLordOf(input, year, opts = {}) {
  const c = fourPillarsChart(input);
  const dayGan = c.pillars.日.干;
  const dayZhi = c.pillars.日.支;
  const dayGz = c.pillars.日.干支;
  const birthGz = c.pillars.年.干支;

  const liuIdx = ((year - 4) % 60 + 60) % 60; // 公元 4 年为甲子
  const liuGz = SEXAGENARY[liuIdx].join('');
  const liuGan = liuGz.charAt(0);
  const liuZhi = liuGz.charAt(1);

  const dayWx = ganWx(dayGan);
  const liuWx = ganWx(liuGan);

  const 判 = [];

  // ① 岁伤日干 / 日犯岁君：只看天干五行相克
  if (ke(liuWx, dayWx)) {
    判.push({
      名: '岁伤日干',
      吉凶: '轻',
      说明: `太岁${liuGan}（${liuWx}）克日干${dayGan}（${dayWx}），为偏官——君治臣、父治子，上下之分顺，虽有灾晦不为大害`,
    });
  } else if (ke(dayWx, liuWx)) {
    判.push({
      名: '日犯岁君',
      吉凶: '重',
      说明: `日干${dayGan}（${dayWx}）克太岁${liuGan}（${liuWx}），为偏财——臣弑君、子弑父，下凌其上，其凶决不能免`,
    });
  } else if (dayWx === liuWx) {
    判.push({ 名: '干支一气', 吉凶: '平', 说明: `日干${dayGan}与太岁${liuGan}同属${dayWx}，不比不克` });
  } else {
    判.push({
      名: '相生',
      吉凶: '平',
      说明: `太岁${liuGan}（${liuWx}）与日干${dayGan}（${dayWx}）${SHENG[liuWx] === dayWx ? '太岁生日干' : '日干生太岁'}，不在克战之列`,
    });
  }

  // ② 救 / 情：只在「日犯岁君」时才有意义（原书只在此处论救与情）
  const 四柱干 = [c.pillars.年.干, c.pillars.月.干, c.pillars.日.干, c.pillars.时.干];
  const 运干 = opts.大运干支 ? String(opts.大运干支).charAt(0) : null;
  const 全干 = 运干 ? [...四柱干, 运干] : 四柱干;
  const 救 = []; // 「有救」= 柱中（或大运）有制日干之物（克日干者）
  const 情 = []; // 「有情」= 柱中（或大运）有与太岁干相合之干
  const GAN_HE = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
  for (const g of 全干) {
    if (g === dayGan) continue;
    if (ke(ganWx(g), dayWx)) 救.push(`${g}（${ganWx(g)}克日干${dayWx}，制伏日干）`);
    if (GAN_HE[g] === liuGan) 情.push(`${g}（与太岁${liuGan}相合）`);
  }

  const 犯君 = 判.some((x) => x.名 === '日犯岁君');
  let 救情结 = null;
  if (犯君) {
    const n = (救.length ? 1 : 0) + (情.length ? 1 : 0);
    const 级 = n === 2 ? '凶反为吉' : (n === 1 ? '凶半' : '凶莫能解');
    救情结 = { 救, 情, 级, 说明: n === 2
      ? '五行有救、四柱有情，二字俱全——「其年凶反为吉」'
      : (n === 1 ? '救、情只得其一——「有一字者凶半」' : '既无制伏之神、又无合太岁之干——「二字俱无，凶莫能解」') };
  }

  // ③ 真太岁（转趾煞）：生年干支 = 流年干支
  if (birthGz === liuGz) {
    判.push({
      名: '真太岁',
      吉凶: '看刑冲',
      说明: `生年${birthGz}又见${liuGz}年，谓之真太岁，又名转趾煞——与大运日主相和相顺则吉，值刑冲破害互相战克则凶`,
    });
  }

  // ④ 日年相并：日柱干支 = 流年干支
  if (dayGz === liuGz) {
    判.push({ 名: '日年相并', 吉凶: '吉', 说明: `日柱${dayGz}与太岁${liuGz}相同——「君子得之谓之君臣庆会，其年利奏对」` });
  }

  // ⑤ 征太岁：日柱 / 大运 与太岁天克地冲（任一方向皆曰征）
  const 天克 = (a, b) => ke(ganWx(a), ganWx(b)) || ke(ganWx(b), ganWx(a));
  if (天克(dayGan, liuGan) && chong(dayZhi, liuZhi)) {
    判.push({ 名: '征太岁', 吉凶: '凶', 说明: `日柱${dayGz}与太岁${liuGz}天克地冲——「日干支冲克太岁曰征……其年则凶，灾祸未免」` });
  }
  if (opts.大运干支) {
    const yGz = String(opts.大运干支);
    if (天克(yGz.charAt(0), liuGan) && chong(yGz.charAt(1), liuZhi)) {
      判.push({ 名: '运征太岁', 吉凶: '凶', 说明: `大运${yGz}与太岁${liuGz}天克地冲——「运干支伤冲太岁亦曰征」` });
    }
    // ⑥ 岁运并临
    if (yGz === liuGz) {
      判.push({ 名: '岁运并临', 吉凶: '看格局', 说明: `流年${liuGz}又是${yGz}大运——「岁运并临，独羊刃七煞为凶，财官印绶亦吉」` });
    }

    // ⑦ 岁冲运 / 运冲岁：地支相冲，但方向不同轻重不同
    const yGan = yGz.charAt(0);
    const yZhi = yGz.charAt(1);
    const yunWx = ganWx(yGan);
    if (chong(yZhi, liuZhi)) {
      判.push({
        名: '岁冲运',
        吉凶: '重',
        说明: `太岁${liuZhi}冲大运${yZhi}——「岁冲运则崩」「太岁冲运其祸重」。冲无方向，此处记太岁为主动方；若视为运逆岁，则见「运冲岁」为轻`,
      });
    }
    if (ke(yunWx, liuWx)) {
      判.push({
        名: '运克太岁',
        吉凶: '轻',
        说明: `大运${yGan}（${yunWx}）克太岁${liuGan}（${liuWx}）——「运克太岁则祸轻」；但同篇注又云「考渊源、渊海诸说俱以运克岁为重」，两说并存，不作独断`,
      });
    } else if (ke(liuWx, yunWx)) {
      判.push({
        名: '岁克运',
        吉凶: '轻',
        说明: `太岁${liuGan}（${liuWx}）克大运${yGan}（${yunWx}）——来克者在上，受克者在下，按「运克太岁则祸轻」的反向理解，此属岁制运而非运犯岁`,
      });
    }

    // ⑧ 日干冲运 / 运干生日干（《三命通会·巫咸撮要》注）
    const GAN_CHONG = { 甲: '庚', 庚: '甲', 乙: '辛', 辛: '乙', 丙: '壬', 壬: '丙', 丁: '癸', 癸: '丁' };
    if (GAN_CHONG[dayGan] === yGan) {
      判.push({
        名: '日干冲运',
        吉凶: '忌',
        说明: `日干${dayGan}与运干${yGan}相冲——「最忌者日干冲运」`,
      });
    }
    if (SHENG[yunWx] === dayWx) {
      判.push({
        名: '运干生日干',
        吉凶: '喜',
        说明: `运干${yGan}（${yunWx}）生日干${dayGan}（${dayWx}）——「所喜者运干生于日干也」`,
      });
    }
  }

  return {
    流年: year,
    太岁: liuGz,
    日主: `${dayGan}（${dayWx}）`,
    日柱: dayGz,
    判,
    救情: 救情结,
    依据: '《三命通会·论太岁》',
  };
}
