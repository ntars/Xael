/**
 * src/core/plum-blossom/chart.js —— 梅花易数·时间起卦（自研，零依赖）
 *
 * 大白话：梅花用「数」起卦——把年支数、月数、日数加起来除八取余得上卦，
 *   再加时辰数除八取余得下卦，总和除六取余定动爻；然后拆本卦/互卦/变卦，
 *   按体用五行生克断吉凶，最后接断语库出可读文字。
 *
 * 口径（逐条以《梅花易数》原文为据，见下）：
 *   · 依据《梅花易数·年月日时起例》：「年月日为上卦。年月日加时总数为下卦。又以年月日时
 *     总数取爻。如子年一数，丑年二数，直至亥年十二数。月如正月一数，直至十二月，亦作
 *     十二数。日数如初一一数，直至三十日，为三十数。」
 *   · 年支数取「子1 丑2 … 亥12」；月数、日数用**农历**月日（正月=1、初一=1），
 *     故 2024-02-10（农历正月初一）为 年5+月1+日1=7；
 *   · 时辰数 nH = floor(((h+1) mod 24)/2) + 1（子时=1 … 亥时=12；23 时与 0 时同属子时）；
 *   · 上卦 = (年+月+日) mod 8，余 0 作 8；下卦 = (年+月+日+时) mod 8，余 0 作 8；
 *   · 动爻 = (年+月+日+时) mod 6，余 0 作 6（自初爻数起）；
 *   · 六爻自下而上 = 下卦三爻 + 上卦三爻；
 *   · 互卦：二三四爻为下卦、三四五爻为上卦；据《梅花易数·互卦起例》「又云：乾坤无互，
 *     互其变卦」——当互出的两卦恰与本卦相同时（六爻纯阳的乾、纯阴的坤），改取变卦为互卦；
 *   · 变卦：动爻阴阳反转；
 *   · 体用：动爻所在之卦为「用」，另一卦为「体」。
 */

import { BAGUA, guaName } from '../common/hexagrams.js';
import { solarToLunisolar } from '../calendar/lunisolar.js';
import { monthBranchIndex } from '../calendar/sexagenary.js';
import { tiYongOf, guaOf, xiangOf, zhanDuanOf } from './interpretations.js';

/** 先天数 → 卦名 */

/**
 * 卦气盛衰（《梅花易数·体用总诀》）：
 *   「应体之卦气宜盛不宜衰。盛者如春震、巽，秋乾、兑，夏离，冬坎，四季之月坤、艮是也。
 *     衰者，春坤、艮，秋震、巽，夏乾兑，冬离，四季之月坎是也。」
 * 季节按「月建」定：寅卯春、巳午夏、申酉秋、亥子冬、辰戌丑未四季月。
 */
const SHENG_GUA = { 春: ['震', '巽'], 夏: ['离'], 秋: ['乾', '兑'], 冬: ['坎'], 四季: ['坤', '艮'] };
const SHUAI_GUA = { 春: ['坤', '艮'], 夏: ['乾', '兑'], 秋: ['震', '巽'], 冬: ['离'], 四季: ['坎'] };

function seasonOfMonthBranch(zhi) {
  if (['寅', '卯'].includes(zhi)) return '春';
  if (['巳', '午'].includes(zhi)) return '夏';
  if (['申', '酉'].includes(zhi)) return '秋';
  if (['亥', '子'].includes(zhi)) return '冬';
  return '四季';
}

/**
 * 八卦生体 / 克体的类象（《梅花易数·体用总诀》逐卦原文，只摘首句与主要条目）。
 * 原文分「生体」「克体」两栏，各八卦一条。
 */
export const GUA_SHENG_TI = {
  乾: '主公门中有喜益，或功名上有喜，或因官有财，或问讼得理，或有金宝之利，或有老人进财，或尊长惠送。',
  坤: '主有田土之喜，或田土进财，或得乡人之益，或得阴人之利，或有果谷之利，或有布帛之喜。',
  震: '主山林之益，或因山林得财，或进东方之财，或因动中有喜，或有木货交易之利。',
  巽: '亦主山林之益，或因山林得财，或于东南得财，或以茶果得利，或有茶果菜蔬之喜。',
  坎: '有北方之喜，或受北方之财，或水边人进利，或因鱼盐酒货文书交易之利。',
  离: '主有南方之财，或有文书之喜，或有炉冶场之利，或因火姓人而得财。',
  艮: '有东北方之财，或山田之喜，或因山林田土获财；物当安稳，事有终始。',
  兑: '有西方之财，或喜悦事，或有食物金玉货利之源，或主宾之乐，或朋友讲习之事。',
};
export const GUA_KE_TI = {
  乾: '主有公事之忧，或门户之忧，或有财宝之失，或于金谷有损，或有怒于尊长，或得罪于贵人。',
  坤: '主有田土之忧，或于田土有损，或有阴人之侵，或有小人之害，或失布帛之财。',
  震: '主有虚惊，常多恐惧，或身心不能安静，或家宅见妖灾，或于山林有所失。',
  巽: '有草木姓人相害，或于山林上生忧；谋事乃东南方之人，处家忌阴人小口之厄。',
  坎: '主有险陷之事，或寇盗之忧，或失意于水边人，或生灾于酒后，或北方人见殃。',
  离: '主文书之忧，或失火之惊，或有南方之忧，或火人相害。',
  艮: '诸事多违，百谋中阻；或有山林田土之失，或带土人相侵，防东北方之祸害。',
  兑: '不利西方，主口舌事之纷争；或带口人侵欺，或有毁折之患，或因饮食而生忧。',
};

const NUM2GUA = { 1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 8: '坤' };
/** 卦五行 */
const GUA_WX = { 乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土' };
/** 象名（天泽火雷风水山地） */
const XIANG_OF = { 乾: '天', 兑: '泽', 离: '火', 震: '雷', 巽: '风', 坎: '水', 艮: '山', 坤: '地' };
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/** 除 8 取余，余 0 作 8 */
function mod8(n) { return ((n - 1) % 8 + 8) % 8 + 1; }
/** 除 6 取余，余 0 作 6 */
function mod6(n) { return ((n - 1) % 6 + 6) % 6 + 1; }

/** 三爻爻象（自下而上）反查卦名 */
function triName(bits) {
  const key = bits.join('');
  return Object.keys(BAGUA).find((g) => BAGUA[g].爻.join('') === key) || '坤';
}

/**
 * 梅花起卦。
 * @param {object} input {y,m,d,h?} 时间起卦（另接受 {num1,num2,hourZhi?} 数字起卦，供扩展）
 */
export function plumBlossomChart(input) {
  const o = input || {};
  let nY; let nM; let nD; let nH; let mode;
  // 体气盛衰要按「月建」定季节，故把公历入参提到外层（数字起卦无公历时退化为不用体气判定）
  let cy = o.y; let cm = o.m || 1; let cd = o.d || 1; let ch = o.h != null ? o.h : 14;
  if (o.num1 != null && o.num2 != null) {
    mode = '数字';
    nY = o.num1; nM = o.num2; nD = 0;
    nH = o.hourZhi != null ? o.hourZhi : 1;
  } else {
    mode = '时间';
    const y = cy; const m = cm; const d = cd;
    const h = ch;
    // 《梅花易数·年月日时起例》：「如子年一数，丑年二数……月如正月一数，直至十二月，
    // 亦作十二数。日数如初一一数，直至三十日，为三十数。」—— 年用年支序、月日用**农历**月日。
    const zhiIdx = (((y - 4) % 12) + 12) % 12;
    nY = zhiIdx + 1;
    const lun = solarToLunisolar(y, m, d);
    nM = lun.m; nD = lun.d;
    // 时辰数：子一丑二……亥十二。23:00 与 00:00 同属子时，必须先 +1 再取模 24，
    // 否则 23 时会算成第十三数（越界、且同一子时算出两个不同的卦）。
    nH = Math.floor((((h % 24) + 24) % 24 + 1) % 24 / 2) + 1;
  }

  const s = nY + nM + nD;
  const sh = mod8(s);       // 上卦数
  const x = mod8(s + nH);   // 下卦数
  const dy = mod6(s + nH);  // 动爻位（1–6）

  const upper = NUM2GUA[sh];
  const lower = NUM2GUA[x];
  const bits = [...BAGUA[lower].爻, ...BAGUA[upper].爻];

  // 变卦：动爻反转（先算，因「乾坤无互，互其变卦」要用到它）
  const bianBits = bits.slice();
  bianBits[dy - 1] = 1 - bianBits[dy - 1];
  const bianLower = triName(bianBits.slice(0, 3));
  const bianUpper = triName(bianBits.slice(3));

  // 互卦：二三四爻为下、三四五爻为上
  // 《梅花易数·互卦起例》：「互卦以重卦去了初爻及第六爻，以中间四爻分作两卦，看得何卦。」
  //                     「又云：乾坤无互，互其变卦。」
  // 六爻纯阳（乾）、纯阴（坤）的互卦仍是本卦，等于没有变化，故此时改取变卦充当互卦。
  let huBits = [bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]];
  let huLower = triName(huBits.slice(0, 3));
  let huUpper = triName(huBits.slice(3));
  const noMutual = huLower === lower && huUpper === upper; // 乾、坤（及任何互出本卦者）
  if (noMutual) {
    huBits = bianBits.slice();
    huLower = bianLower;
    huUpper = bianUpper;
  }

  // 体用：动爻在下卦（dy<=3）→ 下为用、上为体
  const dongInLower = dy <= 3;
  const ti = dongInLower ? upper : lower;
  const yong = dongInLower ? lower : upper;
  const tw = GUA_WX[ti]; const yw = GUA_WX[yong];
  let rel;
  if (tw === yw) rel = '比和';
  else if (SHENG[tw] === yw) rel = '体生用';
  else if (SHENG[yw] === tw) rel = '用生体';
  else if (KE[tw] === yw) rel = '体克用';
  else rel = '用克体';
  // 吉凶按《梅花易数·体用总诀》原文：
  //   体克用，诸事吉；用克体，诸事凶；体生用，有耗失之患；用生体，有进益之喜；体用比和，则百事顺遂。
  const JI_XIONG = {
    比和: '吉（百事顺遂）',
    用生体: '吉（有进益之喜）',
    体克用: '吉（诸事吉）',
    体生用: '不利（有耗失之患）',
    用克体: '凶（诸事凶）',
  };
  const jiXiong = JI_XIONG[rel] || '未定';

  // 体气盛衰（《梅花易数·体用总诀》：「应体之卦气宜盛不宜衰……」按占时月建定季节）
  const mZhi = cy != null
    ? ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][monthBranchIndex(cy, cm, cd, ch)]
    : null;
  const season = mZhi ? seasonOfMonthBranch(mZhi) : null;
  const tiQi = !season ? '未判'
    : (SHENG_GUA[season] || []).includes(ti) ? '盛'
      : (SHUAI_GUA[season] || []).includes(ti) ? '衰' : '平';

  // 互、变对体的生克合参（「宜受他卦之生，不宜他卦之克。他卦者，谓用互变也」）
  const relToTi = (g) => {
    const gw = GUA_WX[g];
    if (gw === tw) return '比和';
    if (SHENG[gw] === tw) return '生体';
    if (SHENG[tw] === gw) return '体生';
    if (KE[gw] === tw) return '克体';
    return '体克';
  };
  const huUpperRel = relToTi(huUpper);
  const huLowerRel = relToTi(huLower);
  const bianUpperRel = relToTi(bianUpper);
  const bianLowerRel = relToTi(bianLower);
  const 互组 = [huUpper, huLower];
  const 变组 = [bianUpper, bianLower];
  const 生体卦 = [upper, lower, ...互组, ...变组].filter((g) => g !== ti && SHENG[GUA_WX[g]] === tw);
  const 克体卦 = [upper, lower, ...互组, ...变组].filter((g) => g !== ti && KE[GUA_WX[g]] === tw);
  // 党多：「如卦体是金，而互变皆金，则是体之党多」——互变四卦同体五行者 ≥3 即体党多，反之用党多
  const 互变同体 = [...互组, ...变组].filter((g) => GUA_WX[g] === tw).length;
  const 互变同用 = [...互组, ...变组].filter((g) => GUA_WX[g] === yw).length;
  const 党势 = 互变同体 >= 3 ? '体党多（体势盛）' : 互变同用 >= 3 ? '用党多（体势衰）' : '';

  const benName = guaName(upper, lower);
  const huName = guaName(huUpper, huLower);
  const bianName = guaName(bianUpper, bianLower);

  return {
    input: o,
    起卦: mode,
    上卦: upper,
    下卦: lower,
    本卦: {
      name: benName, imageName: XIANG_OF[upper] + XIANG_OF[lower], 上卦: upper, 下卦: lower, 爻: bits,
    },
    互卦: {
      name: huName, imageName: XIANG_OF[huUpper] + XIANG_OF[huLower], 上卦: huUpper, 下卦: huLower, 爻: huBits,
    },
    变卦: {
      name: bianName, imageName: XIANG_OF[bianUpper] + XIANG_OF[bianLower], 上卦: bianUpper, 下卦: bianLower, 爻: bianBits,
    },
    动爻: dy,
    体用: {
      体: `${ti}(${tw})`, 用: `${yong}(${yw})`, 体卦: ti, 用卦: yong, 体五行: tw, 用五行: yw, 关系: rel, 吉凶: jiXiong,
    },
    体气: {
      月建: mZhi || undefined, 季节: season || undefined, 体卦: ti, 盛衰: tiQi,
      说明: !season
        ? '数字起卦不涉月建，体气盛衰无凭，只以体用生克论。'
        : `体卦${ti}（${tw}）在${season}月（月建${mZhi}）为${tiQi}——`
          + `《梅花易数·体用总诀》「应体之卦气宜盛不宜衰」，${tiQi === '盛' ? '体盛则吉' : tiQi === '衰' ? '体衰则凶，宜待时' : '非旺非衰，看生克为主'}。`,
    },
    互变合参: {
      互卦: `${huUpper}${huLower}（上${huUpper}·${huUpperRel}，下${huLower}·${huLowerRel}）`,
      变卦: `${bianUpper}${bianLower}（上${bianUpper}·${bianUpperRel}，下${bianLower}·${bianLowerRel}）`,
      生体卦, 克体卦, 党势,
      说明: '《梅花易数·体用总诀》「宜受他卦之生，不宜他卦之克。他卦者，谓用互变也」；'
        + '「互卦为事之中间，变卦为事之终」；「用吉变凶者先吉后凶，用凶变吉者先凶后吉」。',
    },
    类象生克: {
      生体: 生体卦.map((g) => ({ 卦: g, 象: GUA_SHENG_TI[g] })),
      克体: 克体卦.map((g) => ({ 卦: g, 象: GUA_KE_TI[g] })),
    },
    断语: {
      体用: tiYongOf(rel),
      本卦: guaOf(benName),
      类象: [xiangOf(ti), xiangOf(yong)].filter(Boolean),
    },
    口径: '先天八卦数起卦：上卦（年支+月+日）除8、下卦再加时辰数除8、动爻除6；互卦取二三四/三四五；体用取动爻所在卦为用；断语为单点参考，须与互变、应期合看。',
  };
}

/**
 * 分类占断：给定占问类别，返回该门的模板断语 + 本卦体用断语。
 * @param {object} r plumBlossomChart 的返回值
 * @param {string} men 人事/家宅/婚姻/求财/疾病/失物/出行/官讼
 */
export function meihuaMen(r, men) {
  const tpl = zhanDuanOf(men);
  const out = [];
  if (tpl) out.push(tpl);
  if (r && r.体用) out.push(`本卦体用：${r.体用.关系} → ${r.体用.吉凶}`);
  return out;
}

/* ==========================================================================
 * 先天卦的「卦气」应期
 *
 * 大白话：梅花易数分两路——「以数起卦」是先天，「以卦起数」是后天。
 *   按年月日时（数字）起卦属先天；先天定应期不看卦数，而看「卦气」：
 *   乾兑属金，就应在庚辛日、申酉日时；震巽属木，就应在甲乙日、卯辰日时。
 *
 * 依据（库内原文，《梅花易数·先天后天论》refs-texts 第 575 行）：
 *   「又先天之卦，定事应之期，则取之卦气，如干、兑则应如庚、辛及申金之日，
 *     或坤为戌、亥之日时，兑为酉日时。如震、巽当应于甲、乙及支木之日，或震取卯，巽取辰之类。」
 *
 * 不做的事：
 *   · 原书只举了乾兑、坤、震巽四例，坎离艮未举——这几行标「原书未举例，按干支同法推」，
 *     不冒充原文；
 *   · 坤那条原文作「戌、亥之日时」（通行说作辰戌丑未），此处照录不改，并注明异说。
 * ========================================================================== */

export const QI_YING = {
  乾: { 日干: '庚辛', 日支: '申酉', 原文: '干、兑则应如庚、辛及申金之日' },
  兑: { 日干: '庚辛', 日支: '申酉（原文另云「兑为酉日时」）', 原文: '干、兑则应如庚、辛及申金之日；兑为酉日时' },
  坤: { 日干: '戊己', 日支: '戌亥（原文如此）', 原文: '坤为戌、亥之日时', 注: '通行说作辰戌丑未，此处照录原文不改' },
  艮: { 日干: '戊己', 日支: '辰戌丑未', 原文: '', 推: '原书未举例，按干支同法推' },
  震: { 日干: '甲乙', 日支: '卯（原文云「震取卯」）', 原文: '震、巽当应于甲、乙及支木之日，或震取卯' },
  巽: { 日干: '甲乙', 日支: '辰（原文云「巽取辰」）', 原文: '震、巽当应于甲、乙及支木之日，巽取辰' },
  坎: { 日干: '壬癸', 日支: '子', 原文: '', 推: '原书未举例，按干支同法推' },
  离: { 日干: '丙丁', 日支: '午', 原文: '', 推: '原书未举例，按干支同法推' },
};

/**
 * 先天卦气应期。
 * @param {string} gua 八卦名（乾/兑/离/震/巽/坎/艮/坤）
 */
export function qiYingOf(gua) {
  const g = String(gua || '').trim();
  const hit = QI_YING[g];
  if (!hit) return null;
  return {
    卦: g,
    应期: `${hit.日干}日、${hit.日支}日时`,
    备注: hit.原文 ? `原文「${hit.原文}」${hit.注 ? '；' + hit.注 : ''}` : hit.推,
    依据: hit.原文
      ? '《梅花易数·先天后天论》——先天之卦定事应之期取之卦气'
      : '《梅花易数·先天后天论》同法推（原书未举此卦之例）',
  };
}
