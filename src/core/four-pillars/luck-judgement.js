/**
 * src/core/four-pillars/luck-judgement.js —— 大运与原局的相互作用（自研，零依赖）
 *
 * 大白话：大运排出一串干支只是「时间刻度」，真正要回答的是「这一步对我有利还是有害」。
 *   本模块把《三命通会·论大运》里能落到盘上的几条判据逐条实现——原文怎么讲，就怎么判，不加权重。
 *
 * 依据（同一篇内的四组原文，逐条对应本模块四个导出）：
 *   ① 「凡行运在干兼用地支之神，在支则弃天干之物，盖大运重地支」→ 以运之**地支**为主判，天干为辅。
 *   ② 「甲乙传寅卯运名曰刼财败财……丙丁巳午运名伤官运……庚辛申酉运七煞官乡……
 *      壬癸亥子生气印绶运……辰戌丑未戊己财运」→ 运支五行与日主的五种关系各有「运名」（十干通用）。
 *   ③ 「凡行运长生主有创建作新之事，到临官帝旺主兴盛快乐发福进财生子骨肉之庆，
 *      到衰病之乡多退败破财疾病等事，到死絶乡主骨肉死防自身衰祸钝闷百事蹇塞，
 *      到败运主落魄懒惰酒色昏迷，到胎库成形冠[带]之乡百事得中安康平易」→ 十二长生分段断语。
 *   ④ 「损用神者欲运制之，益用神者欲运生之；身弱欲运引进旺乡」→ 喜忌判据：运制忌神为喜、
 *      运生用神为喜、运克用神为忌、身弱得运生扶为喜。
 *
 * 不做的事（不臆造）：
 *   · 不给「吉几年凶几年」这类分数，原文只给定性判断；
 *   · 不把「纳音得地」「五象得地」等另几段并入——那几段以纳音本命立论，与四柱用神体系不同源，
 *     混排会互相打架，故本模块只取以上四组；
 *   · 天干只作「兼用」提示，不与地支同权重（原文「在支则弃天干之物」）。
 */

import { STEMS, BRANCHES } from '../common/constants.js';
import { fourPillarsChart } from './chart.js';
import { luckCyclesOf } from './luck-cycles.js';
import { chartPatternsOf } from './patterns.js';

const GAN_WX = {};
STEMS.forEach((g) => { GAN_WX[g.z] = g.wx; });
const ZHI_WX = {};
BRANCHES.forEach((b) => { ZHI_WX[b.z] = b.wx; });

const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const SHENG_WO = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' };
const KE_WO = { 土: '木', 水: '土', 火: '水', 金: '火', 木: '金' };

/** ② 运名：运支五行与日主五行的五种关系（原文十干举例，此处按五行关系通用化） */
const YUN_NAME = {
  同我: { 名: '比肩劫财之运', 原文: '甲乙传寅卯运名曰刼财败财，主尅父母及尅财败财争闘之事' },
  我生: { 名: '伤官食神之运', 原文: '丙丁巳午运名伤官运，主尅子女讼事囚系' },
  我克: { 名: '财运', 原文: '辰戌丑未戊己财运，主名利皆通' },
  克我: { 名: '七煞官乡', 原文: '庚辛申酉运七煞官乡，主得名发越，太过则灾病恶疾' },
  生我: { 名: '印绶生气之运', 原文: '壬癸亥子生气印绶运，主吉庆增产' },
};

/** ③ 十二长生顺序与各段断语（原文照录，仅补标点） */
export const STAGE_ORDER = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

const STAGE_JUDGE = {
  长生: '主有创建作新之事',
  沐浴: '到败运主落魄懒惰、酒色昏迷',
  冠带: '到胎库成形冠带之乡，百事得中、安康平易',
  临官: '主兴盛快乐、发福进财、生子骨肉之庆',
  帝旺: '主兴盛快乐、发福进财、生子骨肉之庆',
  衰: '到衰病之乡，多退败、破财、疾病等事',
  病: '到衰病之乡，多退败、破财、疾病等事',
  死: '到死绝乡，主骨肉死丧、自身衰祸、钝闷、百事蹇塞',
  墓: '到胎库成形冠带之乡，百事得中、安康平易（墓为库，与胎养同类）',
  绝: '到死绝乡，主骨肉死丧、自身衰祸、钝闷、百事蹇塞',
  胎: '到胎库成形冠带之乡，百事得中、安康平易',
  养: '到胎库成形冠带之乡，百事得中、安康平易',
};

/** 日干长生之位（甲亥、乙午、丙寅、丁酉、戊寅、己酉、庚巳、辛子、壬申、癸卯） */
const CHANG_SHENG_AT = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' };
const YANG_GAN = '甲丙戊庚壬';

/**
 * 十二长生：日干在某支的「生长老病死」阶段（阳干顺行、阴干逆行）。
 * @param {string} gan 日干
 * @param {string} zhi 运支
 */
export function stageOf(gan, zhi) {
  const home = CHANG_SHENG_AT[gan];
  const h = BRANCHES.findIndex((b) => b.z === home);
  const z = BRANCHES.findIndex((b) => b.z === zhi);
  if (h < 0 || z < 0) return '';
  const step = YANG_GAN.includes(gan) ? (z - h + 12) % 12 : (h - z + 12) % 12;
  return STAGE_ORDER[step];
}

/**
 * 运名：按运支五行与日主五行的关系定名（原文十干举例的通用化）。
 */
export function yunNameOf(dayGan, yunZhi) {
  const dw = GAN_WX[dayGan];
  const zw = ZHI_WX[yunZhi];
  if (!dw || !zw) return null;
  let rel;
  if (zw === dw) rel = '同我';
  else if (SHENG[dw] === zw) rel = '我生';
  else if (KE[dw] === zw) rel = '我克';
  else if (KE_WO[dw] === zw) rel = '克我';
  else rel = '生我';
  const t = YUN_NAME[rel];
  return { 关系: rel, 名: t.名, 原文: t.原文, 运支五行: zw, 日主五行: dw };
}

/**
 * ④ 喜忌：以「主用（用神天干）之五行」为锚，判这一步运对用神是生是克。
 * 原文「损用神者欲运制之，益用神者欲运生之；身弱欲运引进旺乡」。
 * @param {string} yunZhi 运支
 * @param {string} yongGan 主用天干（可为空：三派都说不出时不给判）
 * @param {boolean} weak 日主是否偏弱
 */
export function xiJiOf(yunZhi, yongGan, dayWx) {
  const zw = ZHI_WX[yunZhi];
  const yw = yongGan ? GAN_WX[yongGan] : '';
  if (!zw) return [];
  const out = [];
  if (yw) {
    if (SHENG[zw] === yw) out.push({ 判: '喜', 由: `运支${yunZhi}（${zw}）生用神${yongGan}（${yw}）——「益用神者欲运生之」` });
    else if (zw === yw) out.push({ 判: '喜', 由: `运支${yunZhi}与用神${yongGan}同气（${yw}），帮身助用` });
    else if (KE[zw] === yw) out.push({ 判: '忌', 由: `运支${yunZhi}（${zw}）克用神${yongGan}（${yw}），运伤用神` });
    else if (SHENG_WO[yw] === zw) out.push({ 判: '忌', 由: `运支${yunZhi}（${zw}）为用神${yongGan}所生，泄用神之气` });
    else out.push({ 判: '平', 由: `运支${yunZhi}（${zw}）为用神${yongGan}所克，用神耗力而不受损` });
  }
  // 身弱：「身弱欲运引进旺乡」——运支生扶日主即入旺乡，反之不入。
  if (dayWx) {
    if (SHENG[zw] === dayWx || zw === dayWx) {
      out.push({ 判: '喜', 由: `身弱而运支${yunZhi}（${zw}）${zw === dayWx ? '同气帮身' : `生扶日主${dayWx}`}，正合「身弱欲运引进旺乡」` });
    } else if (KE[zw] === dayWx) {
      out.push({ 判: '忌', 由: `身弱而运支${yunZhi}（${zw}）克日主${dayWx}，非旺乡` });
    } else {
      out.push({ 判: '平', 由: `身弱而运支${yunZhi}（${zw}）不生不克日主，未入旺乡亦未受克` });
    }
  }
  return out;
}

/**
 * 整盘大运判读：逐步给「运名 + 长生阶段 + 喜忌」，不改大运本身的排法。
 * 入参与 `fourPillarsChart` / `luckCyclesOf` 相同，内部自行取用神与身强弱，避免调用方装配出错。
 * @param {object} input {y,m,d,h,minute,gender}
 * @param {number} limit 判前几步（默认 8）
 */
export function luckJudgementOf(input, limit = 8) {
  const c = fourPillarsChart(input);
  const luck = luckCyclesOf(input, Math.max(limit, 9));
  const ge = chartPatternsOf(input);
  const dayGan = c.pillars['日'].干;
  const strong = ge && ge['身强弱'] ? !!ge['身强弱'].strong : null;
  const weak = strong === false;
  const yong = (ge && ge['三派取用'] && ge['三派取用'].主用) || '';
  const list = ((luck && luck['大运']) || []).slice(0, limit).map((y) => {
    const gz = String(y['干支'] || '');
    const zhi = gz.charAt(1) || '';
    const nm = yunNameOf(dayGan, zhi);
    const stage = stageOf(dayGan, zhi);
    const xj = xiJiOf(zhi, yong, weak ? GAN_WX[dayGan] : '');
    return {
      序: y['序'],
      干支: gz,
      岁数区间: y['岁数区间'],
      运名: nm ? nm.名 : '',
      运名原文: nm ? nm.原文 : '',
      长生: stage,
      长生断语: STAGE_JUDGE[stage] || '',
      喜忌: (xj || []).map((x) => `${x.判}：${x.由}`),
      合判: (() => {
        const tags = (xj || []).map((x) => x.判);
        const hasXi = tags.includes('喜');
        const hasJi = tags.includes('忌');
        if (hasXi && hasJi) return '喜忌相左（用神与日主指向不同，须并看，不合成一句）';
        if (hasXi) return '偏喜';
        if (hasJi) return '偏忌';
        return '平';
      })(),
    };
  });
  return {
    日干: dayGan,
    主用: yong,
    身强弱: strong === true ? '强' : strong === false ? '弱' : '未判',
    步: list,
    口径: '大运以地支为主（原文「在支则弃天干之物」）；运名按运支五行与日主五行之五关系通用化；长生断语照录原文分段；喜忌以主用五行为锚，不打分、不折年数。',
    依据: '《三命通会·论大运》',
  };
}
