/**
 * src/core/six-lines/cast.js —— 六爻·装卦主入口（自研，零依赖）
 *
 * 大白话：给定占卦时刻（或手摇六次背数），先定卦，再把六爻的干支、五行、六亲、
 *   六神、世应、空亡/月破/日冲标出来，最后给飞神伏神与基础断语（持世、动爻、用神现藏）。
 *
 * 起卦（京房铜钱法）：每次三枚铜钱记「背」数——
 *   0 背 = 老阴（×，动）；1 背 = 少阳（静）；2 背 = 少阴（静）；3 背 = 老阳（○，动）。
 *   六次自下而上成六爻。未给背数则按占卦时刻确定性派生：★绝不能用 Math.random——
 *   同一份排盘刷新就变卦是踩过的坑，必须同一时刻永远同一个卦。
 *
 * 依据：京房纳甲、八宫世应、《增删卜易》用神法、飞伏取本宫八纯卦同位。
 * 相关模块：tables.js（八宫/纳甲/六亲/六神/旬空速查）、six-lines/strength.js（旺衰进阶）、
 *           gonggua.js（卦象与互卦）、najia.js（纳甲装配的旧接口，保留兼容）。
 */

import { daySexagenaryIndex, monthSexagenary } from '../calendar/sexagenary.js';
import { voidVerdict } from './void.js';
import { shenDongVerdict, buildTransmitVerdict } from './shen-dong.js';
import { SEXAGENARY } from '../common/constants.js';
import {
  movementPattern, hexagramBody, GUA_INDEX, yaGanZhi, qinOf, shenOf, xunKongOf,
  ZHI_WX, YONG, ZHI_Z, LIU_QIN_LEI_XIANG, SHEN_XIANG, shenQinXiang, liuQinHuaOf, JIN, TUI, WX_SHENG, WX_KE, LIU_CHONG,
} from './tables.js';
import { gongImageryOf, benMingGuiOf } from './gong-imagery.js';
import { jianYaoVerdict, luMaGuiRenOf, monthBreakVerdict, qinKeWo, qinSheng, qinShengWo, qinWxOf, suiJinVerdict, xingShaOf, yongAbsentOf } from './classics.js';

const BRANCHES = ZHI_Z.join('');

/* ============================== 起卦 ============================== */

/**
 * 无背数时按占卦时刻派生六爻背数（0–3）：31 哈希定种子 + Park–Miller（乘 16807 在 double 内精确）。
 * h 缺省 12，与「无时辰按 12 时」的口径一致。
 */
export function timeBacks(inp) {
  const o = inp || {};
  const s = `${o.y}-${o.m || 1}-${o.d || 1}-${o.h != null ? o.h : 12}`;
  let h = 1;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  const out = [];
  for (let i = 0; i < 6; i += 1) { h = (h * 16807) % 2147483647; out.push(h % 4); }
  return out;
}

/** 背数 → 六爻 { yin, bian, val }（初→上） */
export function tossToYao(backs, inp) {
  const b6 = backs || timeBacks(inp || {});
  const res = [];
  for (let i = 0; i < 6; i += 1) {
    const b = b6[i];
    const yin = (b === 0 || b === 2);
    const bian = (b === 0 || b === 3);
    res.push({ yin, bian, val: yin ? 0 : 1 });
  }
  return res;
}

/** 三爻位（初→三）→ 八经卦名 */
const TRI_KEY = { '111': '乾', '110': '兑', '101': '离', '100': '震', '011': '巽', '010': '坎', '001': '艮', '000': '坤' };

/**
 * 六爻值（初→上，1 阳 0 阴）→ { 下卦, 上卦, 卦名 }。
 * 卦名走 GUA_INDEX 反查（八宫表已含 64 卦全部上下卦组合），无需另立 64 名表。
 */
export function fromYao(vals) {
  const down = TRI_KEY[vals.slice(0, 3).join('')];
  const up = TRI_KEY[vals.slice(3, 6).join('')];
  const name = Object.keys(GUA_INDEX).find((n) => GUA_INDEX[n].下 === down && GUA_INDEX[n].上 === up) || '';
  return { 下卦: down, 上卦: up, hexagramName: name };
}

/* ============================== 飞神伏神 ============================== */

/**
 * 飞伏：用神不现于本卦时，到「本宫八纯卦」同位取伏神，本卦同位之爻为飞神。
 * 飞伏生克决定伏神能否出伏（京房纳甲通用口径）。
 */
/**
 * 月卦身（《卜筮正宗·安月卦身诀》）
 *   诀曰：「阴世则从午月起，阳世还从子月生，欲得识其卦中意，从初数至世方真。」
 *   世爻为阳爻者自初爻起子、阴爻者自初爻起午，顺数至世爻所在之位，所得地支即卦身。
 *   原书又云「卦身之爻为所占事之主，若无卦身则串无头绪，倘卦身有伤，其事难成」，
 *   故卦身只作「事之主」定位，不另立吉凶权重。
 * @param {{世:number}} info 八宫定位结果
 * @param {Array<{yin:boolean}>} yao 本卦六爻（初爻在前）
 */
export function monthBody(info, yao) {
  const idx = (info.世 || 1) - 1;
  const shiYao = yao[idx];
  const start = shiYao && shiYao.yin ? 6 : 0; // 阴世起午、阳世起子
  const pos = (start + idx) % 12;
  return {
    支: ZHI_Z[pos],
    世爻阴阳: shiYao && shiYao.yin ? '阴' : '阳',
    起例: shiYao && shiYao.yin ? '阴世从午起' : '阳世从子起',
    依据: '《卜筮正宗·安月卦身诀》',
  };
}

export function flyingHidden(info, curGz) {
  const p = info.宫;
  const pureGz = yaGanZhi(p, p);
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const out = [];
  for (let j = 0; j < 6; j += 1) {
    const fgz = pureGz[j];
    const fWx = ZHI_WX[fgz.charAt(1)];
    const cgz = curGz[j];
    const cWx = ZHI_WX[cgz.charAt(1)];
    let rel;
    if (SHENG[cWx] === fWx) rel = '飞生伏（易出）';
    else if (KE[cWx] === fWx) rel = '飞克伏（受压难出）';
    else if (SHENG[fWx] === cWx) rel = '伏生飞（泄气）';
    else if (KE[fWx] === cWx) rel = '伏克飞（可出）';
    else rel = '比和';
    out.push({
      爻: j + 1,
      飞神: { 干支: cgz, 五行: cWx, 六亲: qinOf(cWx, info.宫五行) },
      伏神: { 干支: fgz, 五行: fWx, 六亲: qinOf(fWx, info.宫五行) },
      飞伏关系: rel,
      同位: info.代 === 0 ? '本宫纯卦，飞伏同位' : '',
    });
  }
  return out;
}

/* ============================== 基础断语 ============================== */
/**
 * 六亲持世断（通书持世歌，属近世通行断语）。
 * 《增删卜易·用神章》只讲「持世者为何六亲」→ 用神是否得地，不逐六亲给吉凶套话；
 * 故本表只作入门提示，真正判吉凶仍须看用神旺衰与日月动爻生克（见 judge 输出的旺衰行）。
 */
export const SHI_QIN = {
  父母: '父母持世主身劳，求嗣妾众也难招；官动财旺宜赴试，财摇谋利莫心焦；占身财动无贤妇，又恐区区寿不高。',
  子孙: '子身持世事无忧，求名切忌坐当头；避乱许安失可得，官讼从今了便休；有生无克诸般吉，有克无生反见愁。',
  官鬼: '鬼爻持世事难安，占身不病也遭官；财物时时忧失脱，功名最喜世当权；入墓愁疑无散日，逢冲转祸变成欢。',
  妻财: '财爻持世益财荣，兄若交重不可逢；更遇子孙明暗动，利身克父丧文风；求官问讼宜财托，动变兄官万事凶。',
  兄弟: '兄弟持世莫求财，官兴须虑祸将来；朱雀井临防口舌，如摇必定损妻财；夬母相生身有寿，化官化鬼有奇灾。',
};
/**
 * 持世断语的出处与读法（《卜筮正宗·诸爻持世诀》原文五首，逐句照录不改写）。
 * 底本先有总诀「世爻旺相最为强，作事亨通大吉昌，谋望诸般皆遂意，用神生合妙难量，
 *   旬空月破达非吉，克害刑冲遇不良」——即持世之爻本身还须旺相、不受空破刑冲，否则吉凶全反。
 * 底本「夬母相生身有寿」句中「夬母」为「父母」之讹（旧刻误字），照录并注明，不改底本字。
 */
export const SHI_QIN_NOTE = '《卜筮正宗·诸爻持世诀》；原文总诀「世爻旺相最为强……旬空月破达非吉，克害刑冲遇不良」——持世之爻须先看旺相与空破刑冲，歌诀只是常理。';
/** 五行墓库：木墓未、火墓戌、土墓辰、金墓丑、水墓辰（生克表已自 tables.js 引入，勿重复声明） */
const WX_TOMB = { 木: '未', 火: '戌', 土: '辰', 金: '丑', 水: '辰' };

/**
 * 伏神出伏判定。依《增删卜易·飞伏神章第二十八》原文：
 *   「伏神有用者有六：伏神得日月生者一也；伏神旺相者二也；伏神得飞神生者三也；
 *     伏神得动爻生者四；伏神得遇日月动爻冲克飞神者五也；伏神得遇飞神空破休囚墓绝者六也。」
 *   「又伏神终不得出者有五：伏神休囚无气者一也；伏神被日月冲克者二也；
 *     伏神被旺相之飞神克者三也；伏神墓绝于日月飞爻者四也；伏神伏囚值空月破者五也。」
 * 二者并存时以「无用者」优先（原文「虽有如无，终不能出」）。
 * @param {{伏神:{干支,五行,六亲}, 飞神:{干支,五行,六亲}, 飞伏关系:string, 爻:number}} h 一条伏神
 * @param {object} ctx { 月支, 日支, lines, 动爻 }
 * @returns {{有用:string[], 无用:string[], 判:string}}
 */
export function hiddenVerdict(h, ctx) {
  const c = ctx || {};
  const f = h.伏神.五行;
  const flyWx = h.飞神.五行;
  const flyZhi = h.飞神.干支.charAt(1);
  const hidZhi = h.伏神.干支.charAt(1);
  const mZhi = c.月支;
  const dZhi = c.日支;
  const mWx = mZhi ? ZHI_WX[mZhi] : null;
  const dWx = dZhi ? ZHI_WX[dZhi] : null;
  const 冲 = (a, b) => !!a && !!b && (ZHI_Z.indexOf(a) + 6) % 12 === ZHI_Z.indexOf(b);
  const 有用 = [];
  const 无用 = [];
  // 「旺相」与「休囚无气」互斥、皆以月建为主（日辰之克归「被日月冲克」条）：
  //   临月建或月建生之 = 旺相；月建克之或月建不生不同 = 休囚无气。
  const hidProsper = !!mWx && (mWx === f || WX_SHENG[mWx] === f);

  // —— 伏神有用者六 ——
  if ((mWx && WX_SHENG[mWx] === f) || (dWx && WX_SHENG[dWx] === f)) 有用.push('得日月生');
  if (hidProsper) 有用.push('伏神旺相');
  if (WX_SHENG[flyWx] === f) 有用.push('得飞神生');
  const dongLines = (c.动爻 || []).map((n) => (c.lines || [])[n - 1]).filter(Boolean);
  if (dongLines.some((l) => WX_SHENG[l.五行] === f)) 有用.push('得动爻生');
  if (冲(mZhi, flyZhi) || 冲(dZhi, flyZhi) || dongLines.some((l) => WX_KE[l.五行] === flyWx)) 有用.push('日月动爻冲克飞神');
  const flyLine = (c.lines || [])[h.爻 - 1];
  const flyMark = (flyLine && flyLine.标记) || '';
  if (flyMark.indexOf('空亡') >= 0 || flyMark.indexOf('月破') >= 0
    || (mWx && WX_KE[mWx] === flyWx)) 有用.push('飞神空破休囚墓绝');

  // —— 终不得出者五 ——
  if (!hidProsper) 无用.push('伏神休囚无气');
  if (冲(mZhi, hidZhi) || 冲(dZhi, hidZhi) || (mWx && WX_KE[mWx] === f) || (dWx && WX_KE[dWx] === f)) 无用.push('伏神被日月冲克');
  if (WX_KE[flyWx] === f && mWx && (mWx === flyWx || WX_SHENG[mWx] === flyWx)) 无用.push('被旺相飞神克');
  if (WX_TOMB[f] === hidZhi || WX_TOMB[f] === mZhi || WX_TOMB[f] === dZhi) 无用.push('伏神墓于日月飞爻');
  const kong = c.旬空 || [];
  const po = mZhi ? ZHI_Z[(ZHI_Z.indexOf(mZhi) + 6) % 12] : null;
  if (kong.indexOf(hidZhi) >= 0 || (po && hidZhi === po)) 无用.push('伏神值空月破');

  return { 有用, 无用, 判: 无用.length ? '终不得出（无用之伏神）' : (有用.length ? '可用之伏神' : '未定（原文六条五条皆不中，宜再占）') };
}


/** 支 → 五行（本文件内小工具，供用神两现排序用） */
function mWxOf(zhi) { return zhi ? ZHI_WX[zhi] : null; }
const dWxOf = mWxOf;

/** 基础断语：六亲持世 / 六神持世 / 世爻状态 / 动爻 / 用神现藏 */
export function judge(info, lines, yongKey, fh, dongYao, ctx) {
  const out = [];
  const shi = lines[info.世 - 1];
  if (shi) {
    if (SHI_QIN[shi.六亲]) {
      out.push({ 类: '持世', 爻: info.世, 项: `${shi.六亲}持世`, 断: `${SHI_QIN[shi.六亲]}（${SHI_QIN_NOTE}）` });
    }
    if (shi.六神 && SHEN_XIANG[shi.六神]) {
      // 六神断语不再用「近世通行持世歌」，直接取《卜筮正宗·六神辨象结合六亲辨象之断法》原文：
      //   六神本象 + 该神临此亲的交表象意。原文本身就是这样用的（青龙临财＝正义之财/发妻，
      //   玄武临财＝骗伪之财/苟合之妇），比单看六神或单看六亲都准。
      const 交象 = shenQinXiang(shi.六神, shi.六亲);
      out.push({
        类: '六神', 爻: info.世, 项: `${shi.六神}临${shi.六亲}`,
        断: `本象：${SHEN_XIANG[shi.六神] || '—'}。`
          + (交象 ? `临${shi.六亲}则：${交象}。` : '')
          + '（《卜筮正宗·六神辨象结合六亲辨象之断法》；《黄金策·总断》「虎兴而遇吉神，不害其为吉；龙动而逢凶曜，难掩其为凶」——六神只作附助，须与用神旺衰、日月生克合参）',
      });
    }
    // 世应生克空亡动静诀（《卜筮正宗·世应生克空亡动静诀》原文：
    //   「世应相生则吉，世应相克则凶，世应比和事却中，作事谋为可用。
    //     应动他人反变，应空他意难同，世空世动我心慵，只恐自家懒动。」）
    const ying = lines[info.应 - 1];
    if (ying) {
      const sw = mWxOf(shi.干支 ? shi.干支.charAt(1) : '');
      const yw = mWxOf(ying.干支 ? ying.干支.charAt(1) : '');
      if (sw && yw) {
        const rel = sw === yw ? '比和'
          : (WX_SHENG[sw] === yw ? '世生应' : (WX_SHENG[yw] === sw ? '应生世'
            : (WX_KE[sw] === yw ? '世克应' : '应克世')));
        const 判 = rel === '比和' ? '世应比和事却中，作事谋为可用。'
          : (rel === '世生应' || rel === '应生世' ? '世应相生则吉。'
            : (rel === '应克世' ? '世应相克则凶（应克世，他人制我，谋事受制）。'
              : '世应相克则凶（世克应，我制他人，事在我手而须费力）。'));
        const 动空 = [];
        if (ying.动静 && ying.动静 !== '静') 动空.push('应动他人反变');
        if (String(ying.标记 || '').indexOf('空亡') >= 0) 动空.push('应空他意难同');
        if (String(shi.标记 || '').indexOf('空亡') >= 0) 动空.push('世空我心慵');
        if ((shi.动静 && shi.动静 !== '静')) 动空.push('世动恐自家懒动');
        out.push({
          类: '世应', 爻: info.世,
          项: `世${shi.干支}·应${ying.干支}·${rel}`,
          断: `${rel}（世${sw}、应${yw}）——${判}`
            + (动空.length ? `另：${动空.join('、')}。` : '')
            + '（《卜筮正宗·世应生克空亡动静诀》）',
        });
      }
    }
    if (shi.标记 && shi.标记.trim()) {
      const mk = shi.标记.trim();
      // 《卜筮正宗·用神空亡诀》「发动逢冲不谓空，静空遇克却为空……三冬逢火是真空」——
      //   真空/假空按voidVerdict 逐条判，不再只写泛泛的「须看有无生扶」。
      const 世支 = shi.干支 ? shi.干支.charAt(1) : '';
      const 世Wx = shi.五行 || ZHI_WX[世支];
      const 空判 = (mk.indexOf('空亡') >= 0 || mk.indexOf('旬空') >= 0) && 世支
        ? voidVerdict(世支, 世Wx, ctx && ctx.月支, ctx && ctx.日支,
          !!(shi.动静 && shi.动静 !== '静'),
          (dongYao || []).map((n) => { const x = lines[n - 1]; return x && x.干支 ? x.干支.charAt(1) : ''; }))
        : null;
      const emptyNote = 空判
        ? `空亡判为「${空判.类}」（${空判.依据}）——`
          + (空判.到底空 ? '既真空又受克，到底成空，此占难得实。'
            : 空判.真空 ? '空而受克，眼下无实，须待出旬逢生扶方有转机。'
              : '不作真空论，出旬（或逢冲、逢生扶）自实，事迟而可成。')
        : '';
      const poNote = mk.indexOf('月破') >= 0
        ? '月破之爻「逢合逢值之月日方实」（《增删卜易·月破章第二十七》），眼下受损、待填实之期方应。'
        : '';
      out.push({
        类: '世爻状态',
        爻: info.世,
        项: `世爻${mk}`,
        断: [emptyNote, poNote].filter(Boolean).join('')
          || '世爻受冲，主动摇不安；冲散与否须看旺衰（旺相冲之不散）。',
      });
    }
  }
  // 动爻化变：不写「宜看变卦同位之爻」这种空话，直接把变出之爻与化变关系算出来。
  //   依据《增删卜易·进神退神章第二十九》（亥化子、寅化卯…为进神，反向为退神）
  //   与《增删卜易·独发章第三十一》（附论变出回头生克）（变爻五行生/克本爻）、《增删卜易·月破章第二十七》（变爻被月建冲为化破）、《增删卜易·旬空章》（化空）。
  // 六兽歌断要用到「用神／忌神／仇神」的六亲与世爻五行：此处就地推一次，避免跨模块取。
  //   链条出自京房纳甲：生我者父母、我生者子孙、我克者妻财、克我者官鬼、同我者兄弟。
  const SHI_WX = shi ? ZHI_WX[shi.干支 ? shi.干支.charAt(1) : ''] : null;
  const 逆生 = Object.keys(WX_SHENG).reduce((m, k) => { m[WX_SHENG[k]] = k; return m; }, {});
  const 逆克 = Object.keys(WX_KE).reduce((m, k) => { m[WX_KE[k]] = k; return m; }, {});
  let yongQin = null; let jiQin = null; let chouQin = null;
  if (yongKey && yongKey !== '世' && yongKey !== '应') {
    yongQin = yongKey;
    const hit = lines.find((x) => x && x.六亲 === yongKey);
    const 用Wx = hit ? ZHI_WX[hit.干支.charAt(1)] : null;
    if (用Wx) {
      const 忌Wx = 逆克[用Wx]; const 原Wx = 逆生[用Wx];
      jiQin = 忌Wx ? qinOf(忌Wx, info.宫五行) : null;
      const 仇Wx = 原Wx ? 逆克[原Wx] : null;
      chouQin = 仇Wx ? qinOf(仇Wx, info.宫五行) : null;
    }
  }
  // 日月建传符（《卜筮正宗·日月建传符》）：爻支正临日建／月建者，按所临六神出断。
  lines.forEach((l, i) => {
    if (!l) return;
    const v = buildTransmitVerdict(l.干支.charAt(1), l.六神, { 日支: ctx && ctx.日支, 月支: ctx && ctx.月支 });
    if (v) out.push({ 类: '日月建', 爻: i + 1, 项: v.判, 断: `${v.说明}（${v.依据}）` });
  });
  (dongYao || []).forEach((n) => {
    const l = lines[n - 1];
    if (!l) return;
    const bian = ctx && ctx.变卦纳甲 ? ctx.变卦纳甲[n - 1] : null;
    const 本支 = l.干支.charAt(1);
    const parts = [];
    let 项 = `第${n}爻动（${l.六亲}·${l.六神 || '—'}）`;
    if (bian) {
      const 变支 = bian.charAt(1);
      const 变Wx = ZHI_WX[变支];
      const 本Wx = ZHI_WX[本支];
      const 变亲 = qinOf(变Wx, info.宫五行);
      项 = `第${n}爻动（${l.六亲}·${l.六神 || '—'}）→ 变出 ${bian}（${变亲}·${变Wx}）`;
      if (变支 === 本支) parts.push('伏吟：动而化出同支，主呻吟反复、进退两难');
      else if (JIN[本支] === 变支) parts.push(`化进神（${本支}→${变支}）：势增，吉事增吉、凶事加凶`);
      else if (TUI[本支] === 变支) parts.push(`化退神（${本支}→${变支}）：势减，虎头蛇尾`);
      if (WX_SHENG[变Wx] === 本Wx) parts.push('回头生：得后续支援，谋事易成');
      else if (WX_KE[变Wx] === 本Wx) parts.push('回头克：半路折损，功败垂成（野鹤云「不论用神衰旺，皆以凶推」）');
      else if (变Wx === 本Wx) parts.push('化比和：力持平');
      if (ctx && ctx.旬空 && ctx.旬空.indexOf(变支) >= 0) parts.push('化空：变化落空，出旬方应');
      if (ctx && ctx.月支 && 变支 === LIU_CHONG[ctx.月支]) parts.push('化破：变爻被月建冲，出月方应');
      if (ctx && ctx.日支 && 变支 === LIU_CHONG[ctx.日支]) parts.push('变爻受日冲：动而不安，旺相冲之不散');
      // 《卜筮正宗·六亲变化歌》：六亲一变，事情性质就变，直接查原表，不推公式。
      const 变化歌 = liuQinHuaOf(l.六亲, 变亲);
      if (变化歌) parts.push(`六亲变化：${变化歌}（《卜筮正宗·六亲变化歌》）`);
      // 本支与变支既非同支、非进退神，也非回头生克时（如土化金＝本生变），
      // 原文无专门名目，此处只作中性说明，不臆造「化泄」「化耗」之类术语。
      if (!parts.length) {
        parts.push(`本爻${本Wx}化${变Wx}（${本支}→${变支}），非回头生克、亦非化进退，只按变爻旺衰参看`);
      }
    } else {
      parts.push('无动无变（此爻安静）');
    }
    // 《卜筮正宗·六兽歌断》：六神发动之吉凶，看它附在谁身上（附用则吉、临仇忌则凶）。
    const sd = shenDongVerdict({
      神: l.六神, 六亲: l.六亲, 五行: ZHI_WX[l.干支.charAt(1)], 动: true,
      空亡: !!(ctx && ctx.旬空 && ctx.旬空.indexOf(l.干支.charAt(1)) >= 0),
      月破: !!(ctx && ctx.月支 && l.干支.charAt(1) === LIU_CHONG[ctx.月支]),
      逢冲: !!(ctx && ctx.日支 && l.干支.charAt(1) === LIU_CHONG[ctx.日支]),
      世五行: SHI_WX, 用神六亲: yongQin, 忌神六亲: jiQin, 仇神六亲: chouQin,
    });
    if (sd) parts.push(`${sd.判}：${sd.说明}（${sd.依据}）`);
    out.push({ 类: '动爻', 爻: n, 项, 断: parts.join('；') + '。' });
  });
  // 随鬼入墓——《增删卜易·随鬼入墓章第三十》：
  //   古有日墓、动墓、化墓三墓，世爻／用神随鬼入墓者凶。原文作者觉子自注其实验：
  //   「见世爻旺者二身随鬼入墓而不死也……一而十，十而百，全不验者，始尽删之，
  //    便是世爻用爻随鬼入日墓入动墓或动而化墓，亦是休囚无气始见危，若旺而有扶亦有求解。」
  //   故本实现只判「六亲为官鬼」的爻（世或用神）入三墓，并必按旺衰分判吉凶，不作一律凶断。
  {
    const wangOf = (l) => {
      if (!l) return false;
      const wx = ZHI_WX[l.干支.charAt(1)];
      const mWx = ctx && ctx.月支 ? ZHI_WX[ctx.月支] : null;
      const dWx = ctx && ctx.日支 ? ZHI_WX[ctx.日支] : null;
      return (!!mWx && (mWx === wx || WX_SHENG[mWx] === wx))
        || (!!dWx && (dWx === wx || WX_SHENG[dWx] === wx));
    };
    const tombCase = (l, n) => {
      if (!l || l.六亲 !== '官鬼') return null;
      const zhi = l.干支.charAt(1);
      const mu = WX_TOMB[ZHI_WX[zhi]];
      if (!mu) return null;
      const kinds = [];
      if (ctx && ctx.日支 === mu) kinds.push('日墓');
      if ((dongYao || []).some((k) => k !== n && lines[k - 1] && lines[k - 1].干支.charAt(1) === mu)) kinds.push('动墓');
      const bian = ctx && ctx.变卦纳甲 && n ? ctx.变卦纳甲[n - 1] : null;
      if (bian && bian.charAt(1) === mu && (dongYao || []).indexOf(n) >= 0) kinds.push('化墓');
      return kinds.length ? { 墓: mu, kinds } : null;
    };
    const targets = [];
    if (shi) targets.push({ l: shi, n: info.世, 名: '世爻' });
    if (yongKey && yongKey !== '世' && yongKey !== '应') {
      lines.forEach((l, i) => { if (l && l.六亲 === yongKey) targets.push({ l, n: i + 1, 名: '用神' }); });
    }
    // 卦身随鬼入墓：卦身之支所在之爻若为官鬼，同样入三墓论（《卜筮正宗·安月卦身诀》
    // 「卦身之爻为所占事之主」；《增删卜易·随鬼入墓章第三十》列卦身为四主体之一）。
    const bodyZhi = (ctx || {}).卦身支;
    if (bodyZhi) {
      const bi = lines.findIndex((l) => l && l.干支.charAt(1) === bodyZhi);
      if (bi >= 0) targets.push({ l: lines[bi], n: bi + 1, 名: '卦身' });
    }
    // 本命随鬼入墓：占者生年之支所在之爻为官鬼者。
    const lifeZhi = (ctx || {}).本命支;
    if (lifeZhi) {
      const li = lines.findIndex((l) => l && l.干支.charAt(1) === lifeZhi);
      if (li >= 0) targets.push({ l: lines[li], n: li + 1, 名: '本命' });
    }
    const seen = new Set();
    targets.forEach(({ l, n, 名 }) => {
      if (seen.has(n + 名)) return;
      seen.add(n + 名);
      const t = tombCase(l, n);
      if (!t) return;
      const wang = wangOf(l);
      out.push({
        类: '随鬼入墓',
        爻: n,
        项: `${名}${l.六亲}（${l.干支}）入${t.kinds.join('、')}（墓于${t.墓}）`,
        断: `《增删卜易·随鬼入墓章第三十》：「世爻随鬼入墓、本命随鬼入墓、卦身随鬼入墓、世身随鬼入墓」，`
          + '古法以此为凶；同篇觉子自注其实验则谓「亦是休囚无气始见危，若旺而有扶亦有求解」。'
          + '（第四主体「世身」不取：其起法见库外《卜筮全书》「子午持世身居初……」，'
          + '《卜筮正宗·辟卜筮全书世身之谬》专章辟之，谓「以世为我以定吉凶是也」，故本实现不立世身。）'
          + (wang
            ? '此爻得月建／日辰生扶，属旺相有扶——按觉子之说「旺而有扶亦有求解」，不作死断，'
              + '事虽困而可解，宜待冲开墓库之期（《增删卜易·各门类应期总注章》「入三墓俱喜冲开」）。'
            : '此爻休囚无气、又无日月生扶——按觉子之说「休囚无气始见危」，凶信较重，'
              + '宜守不宜进；占病尤须留意，冲开墓库之月日方有转机。'),
      });
    });
  }
  // 「世」为自占类（自身/疾病/出行）的用神——《增删卜易·出行章》「占卜应以世爻为先」，
  //   自占病「若得世爻旺相…立保安康」。此时用神就是世爻本身，不走六亲检索。
  if (yongKey === '世' && shi) {
    out.push({
      类: '用神',
      爻: [info.世],
      项: `自占以世爻为用神（第${info.世}爻 ${shi.干支}·${shi.六亲}）`,
      断: '《增删卜易·用神章》：自占以世爻为先，世旺相则吉、空破休囚则难成；'
        + (shi.标记 && shi.标记.trim() ? `世爻现临${shi.标记.trim()}，其力受损。` : '世爻无空破，可据旺衰与日月生克定吉凶。'),
    });
  } else if (yongKey === '应') {
    // 《卜筮正宗·世应论用神第二》：「凡占无尊卑之称呼、未曾深交之朋友、九流术士、仇人、敌国，
    //   或指实某处地头……俱以应爻为用神也。」——此即「应爻为用」，不走六亲检索。
    const ying = lines[info.应 - 1];
    if (ying) {
      out.push({
        类: '用神',
        爻: [info.应],
        项: `以应爻为用神（第${info.应}爻 ${ying.干支}·${ying.六亲}）`,
        断: '《卜筮正宗·世应论用神第二》：无尊卑称呼、未深交之友、九流术士、仇人敌国，及指实某处地头者，'
          + '俱以应爻为用神——「世为自己，应作他人」，此占以应爻所临之六亲、旺衰定对方情实。'
          + (ying.标记 && ying.标记.trim() ? `应爻现临${ying.标记.trim()}，对方之意见阻。` : '应爻无空破，可据旺衰与日月生克定对方之意。'),
      });
    }
  } else if (yongKey && fh) {
    const visible = lines.filter((l) => l.六亲 === yongKey);
    if (visible.length) {
      const marks = visible.filter((l) => l.标记 && l.标记.trim());
      // 用神两现：《增删卜易·两现章第三十二》「择其旺者为用神、择其动者为用神」。
      //   取用次序照原文：动者优先，其次临月建、临日辰者；旬空月破者降权。
      const mWxB = mWxOf(ctx && ctx.月支);
      const dWxB = dWxOf(ctx && ctx.日支);
      // ★ 不用加权分：原文只说「择其旺者、择其动者」，是先后次序而非分值。
      //   判据顺序（逐级比较，先满足者胜）：
      //     ① 动者优先（「择其动者为用神」）
      //     ② 临月建者优先（月建为一月之权，最旺）
      //     ③ 临日辰者优先（日辰为一卦之主）
      //     ④ 无旬空月破者优先（空破则力损）
      //     ⑤ 同列则并取（原文未给进一步判据，输出两爻并列而不硬选）
      //   注：两现必同六亲，同六亲即同五行，故「临月建/临日辰」两级对两爻同时成立或同时不成立，
      //   真正能分辨的只有「动」与「空破」两级——这与原文只讲「择旺择动」而不列分值正好吻合。
      const clean = (l) => !(l.标记 && (l.标记.indexOf('空亡') >= 0 || l.标记.indexOf('旬空') >= 0 || l.标记.indexOf('月破') >= 0));
      const tiers = [
        (l) => !!l.动静 && l.动静 !== '静',
        (l) => !!mWxB && l.五行 === mWxB,
        (l) => !!dWxB && l.五行 === dWxB,
        clean,
      ];
      let pool = visible.slice();
      for (const t of tiers) {
        const hit = pool.filter(t);
        if (hit.length === 1) { pool = hit; break; }
        if (hit.length > 1) pool = hit;
      }
      const best = pool[0];
      const tie = pool.length > 1;
      const multi = visible.length > 1;
      out.push({
        类: '用神',
        爻: visible.map((l) => l.爻),
        项: multi
          ? `${yongKey}两现于第${visible.map((l) => l.爻).join('/')}爻，`
            + (tie ? `第${pool.map((l) => l.爻).join('/')}爻同列，并取参看` : `取第${best.爻}爻（${best.干支}）为用神`)
          : `${yongKey}现于第${best.爻}爻（${best.干支}）`,
        断: (multi
          ? '《增删卜易·两现章第三十二》：「择其旺者为用神、择其动者为用神」——'
            + `此处按「动者 → 临月建 → 临日辰 → 无空破」的次序取`
            + (tie ? `（至末级仍并列：第${pool.map((l) => l.爻).join('/')}爻）` : `（第${best.爻}爻）`)
            + '。'
          : '')
          + (best.标记 && best.标记.trim()
            ? `所取用神临${best.标记.trim()}，其力受损，事成中有阻。`
            : '所取用神无空破，可直接据其旺衰（月建日辰生克）判断。')
          + (multi && visible.length > 1 && visible.some((l) => l !== best && l.标记 && l.标记.trim())
            ? `另一现爻临${visible.filter((l) => l !== best && l.标记 && l.标记.trim()).map((l) => l.标记.trim()).join('、')}，`
              + '可作参考而不取用——此古法「舍其休囚用其旺相、舍其月破用其不破、舍其旬空用其不空」'
              + `（《增删卜易·两现章第三十二》）。`
            : '')
          + (multi
            ? '野鹤又曰「得其验者，应乎旬空月破，舍其不空而用旬空，舍其不破而用月破」——'
              + '取用以旺者为主，而应期反多落在两现中那一空一破之爻（原书三例皆应于实空实破之年），须两说并存。'
            : ''),
      });
    } else {
      // ★ 依《增删卜易·飞伏神章第二十八》首句：「若用神不现，即以日月为用神，倘日月非用神者，
      //   则于宫首卦寻之」——先用月建/日辰代用神，日月也不是该六亲才寻伏神。
      const mZhi2 = (ctx || {}).月支;
      const dZhi2 = (ctx || {}).日支;
      const mQin = mZhi2 ? qinOf(ZHI_WX[mZhi2], info.宫五行) : null;
      const dQin = dZhi2 ? qinOf(ZHI_WX[dZhi2], info.宫五行) : null;
      if (mQin === yongKey || dQin === yongKey) {
        const which = mQin === yongKey ? '月建' : '日辰';
        const zhi = mQin === yongKey ? mZhi2 : dZhi2;
        out.push({
          类: '用神',
          项: `${yongKey}不上卦，以${which}为用神（${which}${zhi}正临此六亲）`,
          断: '《增删卜易·飞伏神章第二十八》：「若用神不现，即以日月为用神」——此卦不必寻伏神，'
            + `直接看${which}对诸爻的生克即可定吉凶；${which}当权，力大于卦中之爻。`,
        });
        return out;
      }
      const hid = fh.filter((f) => f.伏神.六亲 === yongKey);
      if (hid.length) {
        hid.forEach((f) => {
          const v = hiddenVerdict(f, { 月支: (ctx || {}).月支, 日支: (ctx || {}).日支, 旬空: (ctx || {}).旬空, lines, 动爻: dongYao });
          out.push({
            类: '用神',
            爻: f.爻,
            项: `${yongKey}不现，伏于第${f.爻}爻（伏神 ${f.伏神.干支}·${f.伏神.五行}）`,
            断: `飞神 ${f.飞神.干支}（${f.飞神.六亲}）${f.飞伏关系}；`
              + `${v.判}：有用者〔${v.有用.join('、') || '无'}〕，无用者〔${v.无用.join('、') || '无'}〕（《增删卜易·飞伏神章第二十八》六条/五条）。`,
          });
        });
      } else {
        out.push({
          类: '用神', 项: `${yongKey}本卦与本宫纯卦皆无`,
          断: '用神与本宫首卦皆不见此六亲：依《增删卜易》可「以日月为用神」——看月建/日辰是否即此六亲；否则宜另占一卦。',
        });
      }
    }
  }
  return out;
}

/* ============================== 装卦主入口 ============================== */

/**
 * 六爻装卦。
 * @param {object} inp { y, m, d, h?, backs?:[6], 事?:'财运'… }
 *   backs 给定则按给定起卦；否则按占卦时刻确定性起卦。
 */
export function sixLinesCast(inp) {
  const o = inp || {};
  const yao = tossToYao(o.backs, o);
  const benVals = yao.map((x) => x.val);
  const ben = fromYao(benVals);
  const info = GUA_INDEX[ben.hexagramName];
  if (!info) return { 错误: `未能定位本卦所属八宫：${ben.hexagramName}` };

  // 变卦：动爻取反
  const bianVals = benVals.slice();
  const 动爻 = [];
  for (let i = 0; i < 6; i += 1) {
    if (yao[i].bian) { 动爻.push(i + 1); bianVals[i] = yao[i].val ? 0 : 1; }
  }
  const bianName = 动爻.length ? fromYao(bianVals).hexagramName : null;

  // 纳甲（本卦 + 变卦）
  const gz = yaGanZhi(info.下, info.上);
  const bianInfo = bianName ? GUA_INDEX[bianName] : null;
  const bianGz = bianInfo ? yaGanZhi(bianInfo.下, bianInfo.上) : null;

  // 日干（六神）/ 月建 / 日辰（旺衰·旬空·月破）
  const y = o.y;
  const m = o.m || 1;
  const d = o.d || 1;
  const h = o.h != null ? o.h : 12;
  let dayGan = null; let 月支 = null; let 日支 = null; let 日干支 = null;
  if (y) {
    const idx = daySexagenaryIndex(y, m, d);
    const dayGz = SEXAGENARY[idx];
    日干支 = dayGz.join('');
    dayGan = dayGz[0];
    日支 = dayGz[1];
    月支 = monthSexagenary(y, m, d, h, o.minute)[1];
  }

  // 逐爻：六亲 / 六神 / 空亡 / 月破 / 日冲
  const 空亡 = 日干支 ? xunKongOf(日干支) : [];
  const lines = [];
  for (let j = 0; j < 6; j += 1) {
    const g = gz[j];
    const zhi = g.charAt(1);
    const zWx = ZHI_WX[zhi];
    const shen = dayGan ? shenOf(j, dayGan) : null;
    const qin = qinOf(zWx, info.宫五行);
    const flags = [];
    if (空亡.indexOf(zhi) >= 0) flags.push('空亡');
    if (月支 && zhi === BRANCHES[(BRANCHES.indexOf(月支) + 6) % 12]) flags.push('月破');
    if (日支 && zhi === BRANCHES[(BRANCHES.indexOf(日支) + 6) % 12]) flags.push('日冲');
    lines.push({
      爻: j + 1,
      阴阳: yao[j].yin ? '阴' : '阳',
      动静: yao[j].bian ? (yao[j].yin ? '老阴(×→阳)' : '老阳(○→阴)') : '静',
      干支: g,
      五行: zWx,
      六亲: qin,
      六神: shen,
      世应: info.世 === j + 1 ? '世' : (info.应 === j + 1 ? '应' : ''),
      标记: flags.join(' '),
    });
  }

  const 用神Key = o.事 ? YONG[o.事] : null;
  // 《增删卜易·用神章第八》「凡占必须先问所问何事，而后看用神之衰旺」——
  //   事类没问出来（或问的事不在用神表里）时用神无从取，如实说明，不硬凑一个用神往下断。
  const 用神缺 = !用神Key;
  // 六亲类象：《增删卜易·用神章第八》逐亲列出所主之人与物，随用神一并给出
  const 类象 = 用神Key && LIU_QIN_LEI_XIANG[用神Key] ? LIU_QIN_LEI_XIANG[用神Key] : null;
  const fh = flyingHidden(info, gz);
  const mbEarly = monthBody(info, yao);
  // 本命：占者生年之支（《增删卜易·随鬼入墓章第三十》「本命随鬼入墓」）。入参可给 `本命`
  // （地支字或生年干支），不给则不判此主体——不猜、不默认。
  const 本命支 = (() => {
    const raw = String(o.本命 || '').trim();
    if (!raw) return '';
    if (raw.length === 1 && ZHI_Z.indexOf(raw) >= 0) return raw;
    const m = raw.match(/^([甲乙丙丁戊己庚辛壬癸])?([子丑寅卯辰巳午未申酉戌亥])/);
    return m ? m[2] : '';
  })();
  const 断语 = judge(info, lines, 用神Key, fh, 动爻, { 月支, 日支, 旬空: 空亡, 变卦纳甲: bianGz, 卦身支: mbEarly.支, 本命支 });
  if (用神缺) {
    断语.push({
      类别: '用神',
      项: '用神未定',
      断: '未点明所问何事，用神无从取。用神定则吉凶有所归，请补一句所问（求财、功名、婚姻、疾病、出行、失物之类）再断。',
      依据: '《增删卜易·用神章第八》',
    });
  }

  // —— 《卜筮正宗·碎金赋》制化链：逐动爻判其生、其忌、其解救 ——
  //   原文「子动生财不宜父摆，兄动克财子动能解」云云，是「动一爻则三方联动」的制化关系，
  //   故须先集齐本卦全部动爻的六亲，再逐爻判，不能孤看一爻。
  const 动亲 = lines.filter((x) => x.动静 && x.动静 !== '静').map((x) => x.六亲);
  const 现亲 = [...new Set(lines.map((x) => x.六亲))];
  for (const l of lines) {
    if (!l.动静 || l.动静 === '静') continue;
    const sj = suiJinVerdict(l.六亲, 动亲, 现亲);
    if (!sj) continue;
    断语.push({
      类: '碎金赋',
      爻: [l.爻],
      项: `${sj.判}（${sj.吉凶}）`,
      断: (sj.原文 ? `原文「${sj.原文}」→ ${sj.说明}` : sj.说明) + `（${sj.依据}）`,
    });
  }

  // —— 《卜筮正宗·定间爻歌》：世应之间的两爻为间爻 ——
  const 用亲 = 用神Key || '世';
  const 忌亲 = 用亲 === '世' || 用亲 === '应' ? '' : qinKeWo(用亲);
  const jian = jianYaoVerdict(info.世, info.应, lines, { 用神: 用亲, 忌神: 忌亲 });
  断语.push({ 类: '间爻', 爻: jian.间爻, 项: jian.判, 断: `${jian.说明}（${jian.依据}）` });

  // —— 《增删卜易·飞伏神章第二十八》：用神不上卦，先看日月是否为用神，再寻宫首卦伏神 ——
  let 取用 = null;
  if (用神Key && 用神Key !== '世' && 用神Key !== '应' && 现亲.indexOf(用神Key) < 0) {
    取用 = yongAbsentOf(用神Key, info.宫五行, 月支, 日支);
  }

  // —— 《增删卜易·月破章第二十七》：破而动能伤人，破而静无生助则到底而破 ——
  //   野鹤「神兆机于动」一说与旧说「月破百无所用」相反，本实现两说并列，以野鹤为准出判、旧说入注。
  for (const l of lines) {
    if (String(l.标记 || '').indexOf('月破') < 0) continue;
    // 世爻月破已由 judge 的「世爻月破」条专门交代（含逢合逢值之期），此处不重复
    if (info.世 === l.爻) continue;
    const 日生 = 日支 && BRANCHES ? (ZHI_WX[日支] ? ZHI_WX[日支] : '') : '';
    const 有生助 = !!(日生 && (WX_SHENG[日生] === l.五行 || 日生 === l.五行));
    const mb = monthBreakVerdict({ 动: !!l.动静 && l.动静 !== '静', 有生助 });
    断语.push({ 类: '月破', 爻: [l.爻], 项: `第${l.爻}爻${l.干支}（${l.六亲}）${mb.判}（${mb.吉凶}）`, 断: `${mb.说明}（${mb.依据}）` });
  }

  // —— 《卜筮正宗·禄马羊刃歌》《卜筮正宗·贵人歌诀》——
  const 禄马 = dayGan ? luMaGuiRenOf(dayGan, 日支, lines) : null;
  const 星煞 = dayGan ? xingShaOf(dayGan, 日支, 月支, lines) : null;

  return {
    input: { y, m, d, h },
    本卦: ben.hexagramName,
    变卦: bianName,
    动爻,
    宫: `${info.宫}宫(${info.宫五行})`,
    世: info.世,
    应: info.应,
    上下卦: `下${info.下} 上${info.上}`,
    本卦纳甲: gz,
    变卦纳甲: bianGz,
    变卦宫: bianInfo ? `${bianInfo.宫}宫(${bianInfo.宫五行})` : null,
    爻线: lines,
    伏飞神: fh,
    卦身: monthBody(info, yao),
    卦体: hexagramBody(info.上, info.下, info.代),
    卦宫类象: gongImageryOf(info.宫),
    年命卦宫: benMingGuiOf(本命支, info.宫),
    动静: movementPattern(动爻),
    断语,
    用神: 用神Key ? `${用神Key}（依测事"${o.事}"）` : null,
    禄马贵人: 禄马,
    取用: 取用,
    星煞: 星煞,
    间爻: jian ? { 位: jian.间爻, 判: jian.判, 吉凶: jian.吉凶, 依据: jian.依据, 说明: jian.说明 } : null,
    类象: 类象
      ? `${用神Key}所主——亲属：${类象.亲属}；物事：${类象.物事}`
        + `（《增删卜易·用神章第八》${类象.总纲 ? '「' + 类象.总纲 + '」' : ''}）`
      : null,
    日干: dayGan,
    月建: 月支,
    日辰: 日支,
    旬空: 空亡,
    缺料: (!y
      ? '未给占卦日期，六神/旬空/月破/旺衰未定（仅装卦+飞伏）。可补"年/月/日"以定六神与旺衰。'
      : (dayGan ? '' : '日干未定')),
  };
}

export { GUA_INDEX, YONG };
