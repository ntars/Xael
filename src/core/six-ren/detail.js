/**
 * src/core/six-ren/detail.js —— 大六壬·细分判读（自研，零依赖）
 *
 * 大白话：三传定了之后，还要再算几样「看盘必看」的东西：
 *   旬空（空亡）、驿马、三传遁干、连茹、天马、孤虚、应期。
 *   这些全部只依赖已经算好的 三传 / 日支 / 月支 / 日干支，不改变主盘。
 *
 * 口径来源（库内文献可查者）：
 *   · 旬空/驿马：《六壬大全》卷首「旬空」「驿马」条（驿马取三合局之冲：申子辰马在寅、寅午戌马在申、
 *     巳酉丑马在亥、亥卯未马在巳）；
 *   · 连茹：《六壬大全》「连茹」条（三传支相连递进）；
 *   · 孤虚：《协纪辨方书·卷七·义例》「旬空为虚、其对为孤」＋「年月日时后二辰为孤」；
 *   · 应期：《壬归·卷之二·占例第二》「迟速之应，决于三传……末传是应期」＋「用为岁建则从岁取期，
 *     用为月建则从月取期，日时亦然」——应期取末传支，粒度由发用所临之建定。
 */

import { STEMS, BRANCHES, SEXAGENARY } from '../common/constants.js';
import { chongOf, yimaOf } from './tables.js';

/** 旬空（空亡）：六甲旬首后两位地支，值 = 支序对 */
const XUNKONG = {
  甲子: [10, 11], 甲戌: [8, 9], 甲申: [6, 7],
  甲午: [4, 5], 甲辰: [2, 3], 甲寅: [0, 1],
};

/** 六合（婚合对支）：寅亥、巳申、午未、卯戌、辰酉、子丑 */
const LIUHE = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

/** 四季（真连茹要三传同属一季）：春寅卯辰、夏巳午未、秋申酉戌、冬亥子丑 */
const JIJIE = { 春: [2, 3, 4], 夏: [5, 6, 7], 秋: [8, 9, 10], 冬: [11, 0, 1] };
function jijieOf(z) {
  for (const k of Object.keys(JIJIE)) if (JIJIE[k].includes(z)) return k;
  return null;
}

/** 取日干支所在旬首（如 丙子 → 甲戌） */
export function xunshouOf(dayGzText) {
  const idx = SEXAGENARY.findIndex((g) => g[0] + g[1] === dayGzText);
  if (idx < 0) return '';
  const start = idx - (idx % 10);
  return SEXAGENARY[start][0] + SEXAGENARY[start][1];
}

/** 旬空：返回支序数组（两个字） */
export function xunKong(dayGzText) {
  return XUNKONG[xunshouOf(dayGzText)] || [];
}

/**
 * 三传遁干：旬首起甲，顺推十干；空亡支无遁干（返回「空X」）。
 * @param {number[]} chuan 三传支序
 * @param {string} dayGzText 日干支
 */
export function dunGanOf(chuan, dayGzText) {
  const xun = xunshouOf(dayGzText);
  const start = SEXAGENARY.findIndex((g) => g[0] + g[1] === xun);
  const map = {};
  for (let k = 0; k < 10; k += 1) {
    const gz = SEXAGENARY[(start + k) % 60];
    map[BRANCHES.findIndex((z) => z.z === gz[1])] = gz[0];   // 支序 → 遁干
  }
  const kong = xunKong(dayGzText);
  return chuan.map((z) => (kong.includes(z) ? `空${BRANCHES[z].z}` : `${map[z] || ''}${BRANCHES[z].z}`));
}

/**
 * 连茹：三传在地支环上相邻且同向（顺 +1+1 进连茹 / 逆 −1−1 退连茹）。
 * 真连茹 = 三支还同属一季（春寅卯辰 / 夏巳午未 / 秋申酉戌 / 冬亥子丑）。
 * ★ 注意同名异义：此处「孟仲季」指季节的孟月仲月季月，与涉害层「孟=寅申巳亥」不是一回事。
 */
export function isLianru(chuan) {
  if (!chuan || chuan.length !== 3) return { 是: false };
  const [a, b, c] = chuan;
  let 方向 = null; let 名 = null;
  if (b === (a + 1) % 12 && c === (b + 1) % 12) { 方向 = '顺'; 名 = '进连茹'; }
  else if (b === (a + 11) % 12 && c === (b + 11) % 12) { 方向 = '逆'; 名 = '退连茹'; }
  else return { 是: false };
  const jj = chuan.map(jijieOf);
  const 同季 = !!jj[0] && jj[0] === jj[1] && jj[1] === jj[2];
  return {
    是: true,
    方向,
    名,
    季节: jj,
    同季,
    真连茹: 同季,
    // 断语文案统一措辞（便于逐字比对）
    断: 同季
      ? `${名}且三传${chuan.map((z) => BRANCHES[z].z).join('')}同属${jj[0]}季一路（孟仲季相连无缺），为**真连茹**（连珠格，《六壬大全》「联珠连茹兼进退」条），主事无阻滞而速遂。`
      : `${名}，但三传${chuan.map((z) => BRANCHES[z].z).join('')}跨${jj.join('/')}不同季，三传不成一路，**非真连茹**（《六壬大全》连茹须「联珠连茹」即支相连属），事杂而应缓。`,
  };
}

/**
 * 天马（月家神煞）——《六壬大全·卷一·起例》「天马午顺六阳」。
 *
 * 大白话：天马不看日支，看「月建」。正月（寅月）天马在午，之后每进一个月
 *   顺行两个地支（只走六个阳支：午→申→戌→子→寅→辰，再回午）。
 * 原书逐月神煞表可验：正月「午 天马」、二月「申 天马」、四月「子 天马」；
 *   三月表内「天马」一行排到「酉」系该版错行（按歌诀与相邻月份推应为戌），此处从卷首歌诀。
 * ★ 注意天马与驿马不同源：驿马取日支三合之冲（日家），天马取月建六阳顺行（月家）。
 *
 * @param {Number} monthZhiIdx 月建支序（子=0 … 寅=2）
 * @param {Number[]} [chuan] 三传支序，用于判「三传带马」
 */
export function tianmaOf(monthZhiIdx, chuan) {
  const ma = ((6 + ((monthZhiIdx - 2) % 12) * 2) % 12 + 24) % 12;
  return { 天马: BRANCHES[ma].z, 三传带马: (chuan || []).includes(ma) };
}

/**
 * 孤虚（《钦定协纪辨方书·卷七·义例》「孤虚」条，引刘歆库外《风后孤虚》旧说）：
 *   原文「古人以旬空为虚，其对为孤，如甲子旬中无戌亥，则戌亥为虚，辰巳即为孤也」——
 *   **旬空的两支为「虚」，这两支的对冲为「孤」**。
 * 故这里由日干支所在旬取空亡两支，再取其冲为孤（月建同法作参考）。
 */

/**
 * 行年（《六壬大全·卷三·歌赋（观月经）》注）
 *   原文：「男行年一岁起丙寅，逆总顺零，四十九在甲寅。妇行年一岁起壬申，顺总逆零，三十四在己亥也。」
 *   校算：丙寅为六十甲子第 3 位（序 2），2 + (49−1) = 50 → 甲寅（序 50）✓；
 *         壬申为序 8，8 − (34−1) = −25 ≡ 35 → 己亥（序 35）✓。
 *   故男命自丙寅顺行、女命自壬申逆行，一岁一辰。
 * @param {number} age 虚岁
 * @param {'男'|'女'} gender
 * @returns {{序:number, 干支:string, 支:string, 说明:string}}
 */
export function xingNian(age, gender) {
  const n = Math.max(1, Math.floor(Number(age) || 1));
  const step = n - 1;
  const base = gender === '女' ? 8 : 2; // 壬申序 8 / 丙寅序 2
  const idx = ((base + (gender === '女' ? -step : step)) % 60 + 60) % 60;
  const gz = SEXAGENARY[idx];
  return {
    序: n,
    干支: gz.join(''),
    支: gz[1],
    说明: `虚岁 ${n}（${gender === '女' ? '女命自壬申逆行' : '男命自丙寅顺行'}，《六壬大全·观月经》注）`,
  };
}

export function guXuOf(dayZhiIdx, monthZhiIdx, dayGanZhiIdx) {
  const pair = (a, b) => ({
    孤: [BRANCHES[chongOf(a)].z, BRANCHES[chongOf(b)].z],
    虚: [BRANCHES[a].z, BRANCHES[b].z],
  });
  // 日孤虚：旬空两支为虚、其冲为孤（《协纪辨方书·卷七·义例》「古人以旬空为虚，其对为孤，
  //   如甲子旬中无戌亥，则戌亥为虚，辰巳即为孤也」；《六壬大全·兵机》「孤虚法如甲子旬
  //   孤在戌亥、虚在辰巳」按孤虚两字互易，以《协纪》与《增删》通行说为正）
  const xunStart = Math.floor(((dayGanZhiIdx == null ? 0 : dayGanZhiIdx)) / 10) * 10;
  const k1 = (xunStart + 10) % 12;
  const k2 = (xunStart + 11) % 12;
  const byXun = pair(k1, k2);
  // 月孤虚：年月日时「后二辰」为孤、其对为虚——《协纪辨方书·卷七·义例》
  //   「又有年孤月孤日孤时孤，乃年月日时后二辰，如子年月日时则戌亥为孤、辰巳为虚」；
  //   《奇门遁甲统宗·年家孤虚方位》另列单辰表（子年孤亥、月孤自丑起），只取一辰，此处从《协纪》两支说。
  // 后二辰为「孤」，其对为「虚」——注意与日孤虚（旬空为虚）的角色相反
  const m1 = ((monthZhiIdx - 2) % 12 + 12) % 12;
  const m2 = ((monthZhiIdx - 1) % 12 + 12) % 12;
  const byMonth = {
    孤: [BRANCHES[m1].z, BRANCHES[m2].z],
    虚: [BRANCHES[chongOf(m1)].z, BRANCHES[chongOf(m2)].z],
  };
  return {
    月: byMonth,
    日: byXun,
    旬空: [BRANCHES[k1].z, BRANCHES[k2].z],
    口径: '孤虚按《协纪辨方书·卷七·义例》「古人以旬空为虚，其对为孤」：'
      + '日孤虚取日干支所在旬的旬空两支为虚、其冲为孤；'
      + '月孤虚取月建「后二辰」为孤、其冲为虚（《钦定协纪辨方书·卷七·义例》：「年孤月孤日孤时孤，乃年月日时后二辰，'
      + '如子年月日时则戌亥为孤、辰巳为虚」）。'
      + '《奇门遁甲统宗·年家孤虚方位》另列「子年孤亥」单辰表且月孤自丑起，只取一辰，与《协纪》两支说不合，此处从《协纪》。',
  };
}

/**
 * 应期——《壬归·卷之二·占例第二》「迟速之应，决于三传……末传是应期」，
 *   并「凡用为岁建，则从岁取期；用为月建，则从月取期；日时亦然」。
 *   故：① 以初传（发用）所临建（岁建/月建/日辰/时辰）定「期之粒度」；
 *       ② 以末传（归计）为应期之支；③ 迟速另据三传所乘旺相休囚（旺速、相稍缓、休囚迟）。
 */
export function yingqiOf(chuan, ctx) {
  if (!chuan || chuan.length < 3) return { 期: null, 粒度: null, 速迟: null };
  const c = ctx || {};
  const yong = chuan[0];
  const pairs = [['岁', c.年支], ['月', c.月支], ['日', c.日支], ['时', c.时支]];
  const hit = pairs.find((x) => x[1] && x[1] === yong);
  return {
    期: chuan[2],
    粒度: hit ? hit[0] : '未定',
    速迟: '旺相乘气则速、休囚死气则迟（据三传所乘）',
    note: hit
      ? `应期：《壬归》「末传是应期」——用神${yong}临${hit[0]}建，故从${hit[0]}取期，应于末传${chuan[2]}。`
      : `应期：《壬归》「末传是应期」——末传${chuan[2]}为归计之支；发用${yong}不临岁/月/日/时建，期之粒度须另参旺衰与所问之事。`,
  };
}

/** 日干支文本（'丙子'） */
export function sexagenaryText(gz) { return gz[0] + gz[1]; }

/** 日干序（0..9） */
export function ganIdxOf(dayGan) { return STEMS.findIndex((g) => g.z === dayGan); }
