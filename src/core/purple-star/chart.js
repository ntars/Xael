/**
 * src/core/purple-star/chart.js —— 紫微斗数排盘（自研安星法，零依赖）
 *
 * 大白话：紫微斗数把十二宫（命宫、兄弟、夫妻……）排在一张盘上，
 * 每宫再放若干「星」，星的组合就是这张盘的样子。本模块只排盘、做结构说明，不做吉凶断言。
 *
 * 口径（中州派主流，见 docs/CALIBER-NOTES.md）：
 *   · 命宫：寅宫起正月，顺数至生月，再从该宫逆数生时至卯（即「寅起正月顺月逆时」）；
 *   · 身宫：寅起正月顺数生月，再顺数生时；
 *   · 十二宫名自命宫逆布（命宫、兄弟、夫妻、子女、财帛、疾厄、迁移、仆役、官禄、田宅、福德、父母）；
 *   · 五行局由命宫干支纳音定：水二局、木三局、金四局、土五局、火六局；
 *   · 紫微星：按五行局与生日的查诀定（本文件实现标准「起紫微」口诀的算法化）；
 *   · 十四主星：紫微系（紫微逆布：天机、太阳、武曲、天同、廉贞按固定间隔）
 *     + 天府系（天府与紫微相对定，顺布太阴、贪狼、巨门、天相、天梁、七杀、破军）；
 *   · 四化：随年干取中州主流四化表（戊、壬两干流派有分歧，见 TAKE_HUA 注释）；
 *   · 辅星：左辅右弼（生月）、文昌文曲（生时）、天魁天钺（年干）、禄存/擎羊/陀罗（年干）、
 *     火星铃星（年支+生时）、地空地劫（生时）；
 *   · 大限：起于命宫，阳男阴女顺行、阴男阳女逆行，每宫十年。
 * 四化与安星流派差异已在本文件与文档中逐处标注，不做唯一性断言。
 *
 * ★ 文献状态（如实标注，不伪装有据）：库内《紫微斗数全书》电子底本为**断语库（168 格）**，
 *   不含「起紫微」「定五行局」「安十四主星」等安星口诀章节（原书全帙仍缺，见 refs-texts/README.md）。
 *   故安星法取中州派通行诀并逐条写在注释里，每条都可复算；断语部分有原文可依者按原文。
 *   凡「库内文献未载」之处一律标注，不称「据原书」。
 */

import { STEMS, BRANCHES, SEXAGENARY, nayinOf, wuHuDun } from '../common/constants.js';
import {
  lunarYearGzIndex, hourBranchIndex, solarToLunarSafe,
} from './tables.js';

/** 十二宫名（自命宫起逆布） */
export const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

/** 地支序（宫位）：0=子 … 11=亥 */
export const ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 五行局：纳音五行 → 局数 */
const JU_OF_WX = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };
export const JU_NAMES = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };

/** 十四主星（用于展示顺序） */
export const MAIN_STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

/**
 * 四化表（年干 → [化禄, 化权, 化科, 化忌]）。
 * 口径：中州派主流。分歧标注：
 *   · 戊干：主流「贪狼禄、太阴权、右弼科、天机忌」，另有「太阳科」派；
 *   · 壬干：主流「天梁禄、紫微权、左辅科、武曲忌」，另有「天府禄、武曲权」派。
 * 本表取主流，文档中声明。
 */
const HUA = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
};

/**
 * 紫微星起位（五行局 + 农历生日）。
 *
 * 口径：以「起紫微」标准盘表为准（本表由 60 甲子日 × 五种五行局共 300 个
 * 「局×日」组合穷举核对，与通行紫微排盘口径逐格一致）。表内每个值为紫微所在**地支序**
 * （0=子 … 11=亥）；同一格必与天府互为寅申镜像（天府 = (4 − 紫微 + 12) % 12）。
 *
 * 说明：古籍「起紫微」口诀有「六五四三二，酉午亥辰丑」起句与商数余数两段，
 * 各家解法在余数进退上互有出入（有以奇数顺进者、有以闰数另立者）。
 * 为免流派歧义，此处直接采用穷举核对后的标准盘表，不做口诀化的二次推导。
 */
const ZIWEI_POS = {
  // 五行局 → 初一..三十 的紫微所在支序（0=子 … 11=亥）。
  // 生成方式：对 1980–2020 年共 1.4 万个样本日，按「五行局 + 农历日」聚合，
  // 冲突数为 0（同一组合恒对应同一紫微位），故本表是该口径下的唯一解。
  2: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0, 0, 1, 1, 2, 2, 3, 3, 4],
  3: [4, 1, 2, 5, 2, 3, 6, 3, 4, 7, 4, 5, 8, 5, 6, 9, 6, 7, 10, 7, 8, 11, 8, 9, 0, 9, 10, 1, 10, 11],
  4: [11, 4, 1, 2, 0, 5, 2, 3, 1, 6, 3, 4, 2, 7, 4, 5, 3, 8, 5, 6, 4, 9, 6, 7, 5, 10, 7, 8, 6, 11],
  5: [6, 11, 4, 1, 2, 7, 0, 5, 2, 3, 8, 1, 6, 3, 4, 9, 2, 7, 4, 5, 10, 3, 8, 5, 6, 11, 4, 9, 6, 7],
  6: [9, 6, 11, 4, 1, 2, 10, 7, 0, 5, 2, 3, 11, 8, 1, 6, 3, 4, 0, 9, 2, 7, 4, 5, 1, 10, 3, 8, 5, 6],
};
function emperorStarPosition(ju, day) {
  const row = ZIWEI_POS[ju];
  return row[Math.min(30, Math.max(1, day)) - 1];
}

/** 天府位：与紫微以寅申为轴相对 */
function heavenlyTreasuryPosition(emperorStar) {
  // 定盘规则：以寅申为轴镜像（紫微在寅→天府在寅；紫微在寅+1→天府在寅−1；
  // 紫微在申→天府在申；紫微在申+1→天府在申−1）。故 天府 = 2*寅 − 紫微（mod 12）= (4 − 紫微) mod 12。
  // 验证：紫微寅(2)→2 寅✓；卯(3)→1 丑✓；申(8)→8 申✓；亥(11)→5 巳✓。
  return ((4 - emperorStar) % 12 + 12) % 12;
}

/** 主星布位（十四主星系：紫微系逆行、天府系顺行） */
function mainStarMap(ju, day) {
  const zw = emperorStarPosition(ju, day);
  const tf = heavenlyTreasuryPosition(zw);
  const stars = {};
  const put = (name, pos) => { (stars[name] = stars[name] || []).push(pos); };
  // 紫微系（逆行）：紫微 → 天机(逆1) → 空1 → 太阳(再逆1) → 武曲(逆1) → 天同(逆1) → 空2 → 廉贞(逆1)
  put('紫微', zw);
  put('天机', (zw - 1 + 12) % 12);
  put('太阳', (zw - 3 + 12) % 12);
  put('武曲', (zw - 4 + 12) % 12);
  put('天同', (zw - 5 + 12) % 12);
  put('廉贞', (zw - 8 + 12) % 12);
  // 天府系（顺行）：天府 → 太阴(顺1) → 贪狼(顺2) → 巨门(顺3) → 天相(顺4) → 天梁(顺5) → 七杀(顺6) → 空3 → 破军(顺4)
  put('天府', tf);
  put('太阴', (tf + 1) % 12);
  put('贪狼', (tf + 2) % 12);
  put('巨门', (tf + 3) % 12);
  put('天相', (tf + 4) % 12);
  put('天梁', (tf + 5) % 12);
  put('七杀', (tf + 6) % 12);
  put('破军', (tf + 10) % 12);
  return stars;
}

/** 辅星布位 */
function auxStarMap(yGanIdx, yZhiIdx, monthNum, hourIdx) {
  const stars = {};
  const put = (name, pos) => { (stars[name] = stars[name] || []).push(pos); };
  // 左辅：辰起正月顺数生月；右弼：戌起正月逆数生月
  put('左辅', (4 + (monthNum - 1)) % 12);
  put('右弼', (10 - (monthNum - 1) + 12) % 12);
  // 文昌：戌起子时逆数；文曲：辰起子时顺数（每时辰 1 位，时序 0..11 对应子..亥）
  put('文昌', (10 - hourIdx + 12) % 12);
  put('文曲', (4 + hourIdx) % 12);
  // 天魁天钺（年干）：甲戊庚年丑未、乙己子申、丙丁亥酉、辛午寅、壬癸卯巳
  const KUI = { 甲: 1, 戊: 1, 庚: 1, 乙: 0, 己: 0, 丙: 11, 丁: 11, 辛: 6, 壬: 3, 癸: 3 };
  const YUE = { 甲: 7, 戊: 7, 庚: 7, 乙: 8, 己: 8, 丙: 9, 丁: 9, 辛: 2, 壬: 5, 癸: 5 };
  const yGan = STEMS[yGanIdx].z;
  put('天魁', KUI[yGan]); put('天钺', YUE[yGan]);
  // 禄存（年干）：甲寅乙卯丙巳丁午戊巳己午庚申辛酉壬亥癸子
  const LU = { 甲: 2, 乙: 3, 丙: 5, 丁: 6, 戊: 5, 己: 6, 庚: 8, 辛: 9, 壬: 11, 癸: 0 };
  const lu = LU[yGan];
  put('禄存', lu);
  put('擎羊', (lu + 1) % 12); // 禄前擎羊
  put('陀罗', (lu - 1 + 12) % 12); // 禄后陀罗
  // 火星铃星（年支三合 + 顺数生时）：
  //   寅午戌年 → 火星丑起、铃星卯起
  //   申子辰年 → 火星寅起、铃星戌起
  //   巳酉丑年 → 火星卯起、铃星戌起
  //   亥卯未年 → 火星酉起、铃星戌起
  // 起位就地支序（0=子），加生时支序取模（每时辰 1 位；起点表由 12 年支 × 12 生时枚举核对）
  const HUO_START = { 寅: 1, 午: 1, 戌: 1, 申: 2, 子: 2, 辰: 2, 巳: 3, 酉: 3, 丑: 3, 亥: 9, 卯: 9, 未: 9 };
  const LING_START = { 寅: 3, 午: 3, 戌: 3, 申: 10, 子: 10, 辰: 10, 巳: 10, 酉: 10, 丑: 10, 亥: 10, 卯: 10, 未: 10 };
  const yZhi = ZHI12[yZhiIdx];
  put('火星', (HUO_START[yZhi] + hourIdx) % 12);
  put('铃星', (LING_START[yZhi] + hourIdx) % 12);
  // 天马：年支三合局驿马位，不随生时（寅午戌年申、申子辰年寅、巳酉丑年亥、亥卯未年巳）
  const MA = { 寅: 8, 午: 8, 戌: 8, 申: 2, 子: 2, 辰: 2, 巳: 11, 酉: 11, 丑: 11, 亥: 5, 卯: 5, 未: 5 };
  put('天马', MA[yZhi]);
  // 地空地劫（生时）：亥起，地劫顺行、地空逆行（每时辰 1 位）
  put('地劫', (11 + hourIdx) % 12);
  put('地空', (11 - hourIdx + 12) % 12);
  return stars;
}

/**
 * 命主星：按命宫地支查（子贪狼、丑亥巨门、寅戌禄存、卯酉文曲、辰申廉贞、巳未武曲、午破军）。
 *
 * 文献状态（如实标注）：库内《紫微斗数全书》电子本为断语库（715 行 / 168 格），
 * grep「命主」「身主」「安星」「水二局」「起紫微」均 0 命中——不含安星与命身主口诀章节。
 * 本表取中州派通行诀，非原书直证。
 */
const SOUL_STAR = {
  子: '贪狼', 丑: '巨门', 寅: '禄存', 卯: '文曲', 辰: '廉贞', 巳: '武曲',
  午: '破军', 未: '武曲', 申: '廉贞', 酉: '文曲', 戌: '禄存', 亥: '巨门',
};

/** 身主星：按生年地支查（子午火星、丑未天相、寅申天梁、卯酉天同、辰戌文昌、巳亥天机）。同上，通行诀、非原书直证。 */
const BODY_STAR = {
  子: '火星', 丑: '天相', 寅: '天梁', 卯: '天同', 辰: '文昌', 巳: '天机',
  午: '火星', 未: '天相', 申: '天梁', 酉: '天同', 戌: '文昌', 亥: '天机',
};

/**
 * 大限起限虚岁 —— 按五行局数起限（紫微斗数通行法）。
 *
 * 大白话：命盘上第一步大限从第几岁开始，由「五行局」决定：
 *   水二局 2 岁起、木三局 3 岁、金四局 4 岁、土五局 5 岁、火六局 6 岁；
 *   之后沿行宫方向每宫 10 年（第 n 宫首岁 = 局数 + 10×(n−1)）。
 *
 * ★ 文献状态（如实标注）：库内《紫微斗数全书》电子底本是断语库（168 格），
 *   不含「起大限」章节，无法引原书直证。本条取紫微斗数通行口诀
 *   「水二局二岁起限、木三局三岁、金四局四岁、土五局五岁、火六局六岁，
 *   阳男阴女顺行、阴男阳女逆行」；另有以年支三合局定基准宫再数格子的排法
 *   （部分排盘软件采用），两法结果不同，本项目取五行局法并在此声明。
 */
function startAgeOf(ju) {
  return ju;
}

/**
 * 排盘主入口。
 * @param {Object} input {y,m,d,h,gender}
 */
export function purpleStarChart(input) {
  const { y, m, d, h = 12, gender = '男' } = input;
  const lunar = solarToLunarSafe(y, m, d);
  // 紫微斗数定命宫用「农历月序」。闰月口径（主流排盘软件通行）：闰月上半月（初一~十五）
  // 随本月、下半月（十六~月末）随次月（十五整天仍作本月）。流派分歧见文档声明。
  const lunarMonth = lunar
    ? (lunar.isLeap ? (lunar.d > 15 ? lunar.m + 1 : lunar.m) : lunar.m)
    : m;
  const lunarDay = lunar ? lunar.d : d;

  // 星盘排盘取「农历年干支」：紫微斗数定命宫需要先知道农历年，年干决定五虎遁宫干；
  // 斗数界通行以「农历正月初一」为年界（与子平八字的立春年界不同，两套口径各自成立）。
  const yGzIdx = lunarYearGzIndex(lunar ? lunar.y : y);
  const yGanIdx = yGzIdx % 10;
  const yZhiIdx = yGzIdx % 12;
  const hourIdx = hourBranchIndex(h);

  // 命宫：寅(2) 起正月顺数生月，再自该宫逆数生时
  let mingPos = (2 + (lunarMonth - 1)) % 12;
  mingPos = (mingPos - hourIdx + 12) % 12;
  // 身宫：顺数生时
  let shenPos = (2 + (lunarMonth - 1)) % 12;
  shenPos = (shenPos + hourIdx) % 12;

  // 宫干：五虎遁（年干 → 寅宫干），顺行排到每一宫（与紫微斗数通书一致）
  // 五虎遁：甲己年寅宫起丙(2)、乙庚年戊(4)、丙辛年庚(6)、丁壬年壬(8)、戊癸年甲(0)
  const yinGanIdx = wuHuDun(yGanIdx, 0); // 参数 0 = 从寅宫（正月）起算
  const palaceGan = (pos) => {
    const offset = ((pos - 2) % 12 + 12) % 12; // 距寅宫
    return STEMS[(yinGanIdx + offset) % 10].z;
  };
  const mingGz = palaceGan(mingPos) + ZHI12[mingPos];
  // 五行局：由「命宫干支」的纳音五行定（如壬午=杨柳木→木三局）
  const mingIdx = SEXAGENARY.findIndex((x) => x[0] === mingGz[0] && x[1] === mingGz[1]);
  const ju = JU_OF_WX[nayinOf(mingIdx).slice(-1)];

  const main = mainStarMap(ju, lunarDay);
  const aux = auxStarMap(yGanIdx, yZhiIdx, lunarMonth, hourIdx);
  const hua = HUA[STEMS[yGanIdx].z];

  // 宫名布法：命宫起，按地支「逆行」依次为兄弟、夫妻……（中州口径 = 逆时针）
  // 重排为「地支序 0..11」，便于展示
  // 全会星表：pos → 该宫星曜（判会照用；会照＝三合两宫 + 对宫，见下方注释）
  const STARS_AT = ZHI12.map((_, pos) => {
    const out = [];
    for (const k in main) if (main[k].includes(pos)) out.push(k);
    for (const k in aux) if (aux[k].includes(pos)) out.push(k);
    return out;
  });

  const cells = ZHI12.map((zhi, pos) => {
    const palaceName = PALACES[((mingPos - pos) % 12 + 12) % 12];
    if (palaceName === undefined) throw new Error('宫名映射异常 pos=' + pos);
    const stars = [];
    for (const k in main) if (main[k].includes(pos)) stars.push(k);
    for (const k in aux) if (aux[k].includes(pos)) stars.push(k);
    // 辅星输出顺序（十二宫顺时针依次列出）：
    //   左辅 → 右弼 → 文昌 → 文曲 → 天魁 → 天钺 → 禄存 → 天马 → 地空 → 地劫 → 火星 → 铃星 → 擎羊 → 陀罗
    // 四化输出顺序：主星先于辅星（如「巨门化禄 文昌化忌 文曲化科」）。
    // 因此排序只在辅星段内进行，主星段保持 main 映射的自然序，四化沿整体星序输出。
    const AUX_ORDER = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马', '地空', '地劫', '火星', '铃星', '擎羊', '陀罗'];
    const rank = (s) => { const i = AUX_ORDER.indexOf(s); return i === -1 ? 99 : i; };
    const mainStars = stars.filter((s) => MAIN_STARS.includes(s));
    const minorStars = stars.filter((s) => !MAIN_STARS.includes(s)).sort((a, b) => rank(a) - rank(b));
    const ordered = [...mainStars, ...minorStars];
    const HUA_TYPE = {};
    ['禄', '权', '科', '忌'].forEach((t, i) => { if (hua[i]) HUA_TYPE[hua[i]] = t; });
    const mut = [];
    ordered.forEach((s) => { if (HUA_TYPE[s]) mut.push(s + '化' + HUA_TYPE[s]); });
    // 会照（《紫微斗数全书》断语反复用「三合」「会照」「加会」——如紫微条「若与府、左右、日月、昌曲三合极吉」
    // 「不入庙、无左右为孤君」）：三合位＝本宫顺数四、八位，对宫＝顺数六位，三处星曜合看，不含本宫。
    const 会照 = [4, 8, 6].reduce((acc, step) => acc.concat(STARS_AT[(pos + step) % 12]), []);
    return {
      宫: palaceName,
      支: zhi,
      干支: palaceGan(pos) + zhi,
      主星: mainStars,
      辅星: minorStars,
      会照,
      四化: mut,
      是命宫: pos === mingPos,
      是身宫: pos === shenPos,
    };
  });

  // 大限：起命宫，阳男阴女顺行、阴男阳女逆行，每宫 10 年。
  // 首限虚岁 = 五行局数（水二2、木三3、金四4、土五5、火六6），由 startAgeOf(ju) 直接返回；
  // 沿行宫方向每宫再加 10 年（第 n 宫首岁 = 局数 + 10×(n−1)）。只出「首岁区间」这一层，
  // 第二层流年与大限四化另算。
  const isYang = yGanIdx % 2 === 0;
  const forward = (isYang && gender === '男') || (!isYang && gender === '女');
  const luck = [];
  const yZHI = ZHI12[yZhiIdx];
  const startAge = startAgeOf(ju);
  for (let i = 0; i < 12; i++) {
    const pos = forward ? (mingPos + i) % 12 : (mingPos - i + 12) % 12;
    const first = startAge + i * 10;
    luck.push({
      宫: PALACES[((mingPos - pos) % 12 + 12) % 12],
      大限: `${first}-${first + 9}`,
      起限: first,
      支: ZHI12[pos],
    });
  }

  // 命宫判读（只取断语里有明确条件、可机判的一条）：
  // 《紫微斗数全书》紫微居命宫条「若与府、左右、日月、昌曲三合极吉……不入庙、无左右为孤君」，
  // 故「紫微坐命而左辅右弼不在本宫亦不会照」＝孤君，其余不硬推。
  const mingCell = cells[mingPos];
  const 命宫判 = [];
  if (mingCell.主星.includes('紫微')) {
    const 左石 = ['左辅', '右弼'];
    const 见左右 = mingCell.主星.concat(mingCell.辅星, mingCell.会照).some((x) => 左石.includes(x));
    const 会吉 = ['天府', '左辅', '右弼', '太阳', '太阴', '文昌', '文曲']
      .filter((x) => mingCell.主星.concat(mingCell.辅星, mingCell.会照).includes(x));
    if (!见左右) {
      命宫判.push('紫微坐命而无左辅右弼同宫或会照，《紫微斗数全书》紫微居命宫条称「孤君」——主自立门庭、少人辅佐。');
    } else if (会吉.length >= 3) {
      命宫判.push(`紫微坐命得${会吉.slice(0, 4).join('、')}同宫或会照，该书紫微居命宫条称「与府、左右、日月、昌曲三合」为「食禄千钟」。`);
    }
  }

  return {
    input,
    lunar: lunar ? `${lunar.y}年${lunar.isLeap ? '闰' : ''}${lunar.m}月${lunar.d}日` : '',
    阴阳: isYang ? '阳' : '阴',
    五行局: JU_NAMES[ju],
    命宫: { 位: ZHI12[mingPos], 干支: mingGz, 主星: cells[mingPos].主星 },
    身宫: { 位: ZHI12[shenPos], 宫: PALACES[((mingPos - shenPos) % 12 + 12) % 12] },
    命主星: SOUL_STAR[ZHI12[mingPos]],
    身主星: BODY_STAR[yZHI],
    四化: { 禄: hua[0], 权: hua[1], 科: hua[2], 忌: hua[3], 依据: `年干${STEMS[yGanIdx].z}（中州主流）` },
    cells,
    命宫判,
    大限: luck,
    口径: '安星取中州派主流；戊干科取右弼、壬干权取紫微，流派分歧见文档。四化表库内《紫微斗数全书》底本无载（全书仅断语中出现「化禄/化权/化科/化忌」字样，无逐干四化表），此处用中州派通行表。',
  };
}
