/**
 * src/core/six-ren/three-transmissions.js —— 大六壬九宗门发三传（自研，零依赖）
 *
 * 大白话：从四课里挑出「初传」的九套规则，按《六壬大全·总钤》的先后：
 *   伏吟 → 返吟 → 贼克（上克下=元首 / 下贼上=重审）→ 比用(知一) → 涉害（深数→见机→察微→缀瑕）
 *   → 遥克（蒿矢=神遥克日 优先 / 弹射=日遥克神）→ 别责 → 昴星 → 八专。
 * 三传：常规（贼克/比用/涉害/遥克/别责/昴星）中传=天盘[初]、末传=天盘[中]；
 *   伏吟取刑冲、返吟取冲、八专干上顺逆三位另算。
 *
 * ★ 一条必须守死的口径：四课判「克」，第一课的「课位」是**日干**（上神加日干），
 *   不能拿日干寄宫那个支的五行去判——戊土日一课「酉加戊」是戊土生酉金（无克），
 *   若误用寄宫巳火就成火克金（有克），全盘结论就反了。
 *
 * 下标约定（全模块统一）：
 *   · tian[x] = 地盘第 x 支位上的天盘支序号（0..11）
 *   · 四课 { 位, 上, isGan? } 里的 位/上 都是支序号（0..11），不是数组下标
 */

import {
  GAN_WX, ZHI_WX, STEM_LODGING, xingTarget, isZiXing, chongOf, overcomes, overcomeBy, yimaOf,
} from './tables.js';
import { STEMS, BRANCHES } from '../common/constants.js';

/** 日干序 → 汉字（别责要用合干） */
const GAN_Z = STEMS.map((g) => g.z);
/** 天干五合：甲己、乙庚、丙辛、丁壬、戊癸 */
const HE_GAN = ['己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊'];
/** 四孟 / 四仲（涉害取用：深数相等时先孟后仲，季不取） */
const MENG = [2, 5, 8, 11];
const ZHONG = [0, 3, 6, 9];
/** 三合局顺数前一位：申子辰 / 寅午戌 / 亥卯未 / 巳酉丑 */
const SAN_HE = { 0: 4, 4: 8, 8: 0, 2: 6, 6: 10, 10: 2, 11: 3, 3: 7, 7: 11, 5: 9, 9: 1, 1: 5 };

/**
 * 发三传主入口。
 * @param {Object} ctx {tian, fourLessons, dayGan, dayGanIdx, dayZhiIdx, M, T}
 * @returns {{三传:number[], 发用:string, 课体:string}}
 */
export function threeTransmissions(ctx) {
  const { tian, fourLessons, dayGan, dayGanIdx, dayZhiIdx, M, T } = ctx;
  const dayYang = dayGanIdx % 2 === 0;
  const 干上 = fourLessons[0].上;   // 第一课上神（干上）
  const 支上 = fourLessons[2].上;   // 第三课上神（支上）

  /** 顺数三传：中 = 天盘[初]、末 = 天盘[中] */
  const 顺三传 = (初) => [初, tian[初], tian[tian[初]]];

  /** 课位五行：第一课取日干五行，其余取课位地支五行 */
  function weiWX(i) {
    return (fourLessons[i].isGan || i === 0) ? GAN_WX[dayGanIdx] : ZHI_WX[fourLessons[i].位 % 12];
  }

  /** 收集贼克：上神克课位 = 上克下（元首）；课位克上神 = 下贼上（重审） */
  function collect() {
    const 克 = []; const 贼 = [];
    for (let i = 0; i < 4; i += 1) {
      const wW = weiWX(i); const wS = ZHI_WX[fourLessons[i].上 % 12];
      if (overcomes(wS, wW)) 克.push(i);
      if (overcomes(wW, wS)) 贼.push(i);   // 课位克上神 = 下贼上
    }
    return { 克, 贼 };
  }

  /** 受克之神：上克下取「课位」，下贼上取「上神」（初传就是被克的那个） */
  // 上克下（元首）：被克者是课位（第一课取日干本身，其余取课位支）
  // 下贼上（重审）：被克者是上神（天上那个字）
  function clashedBranch(i, kind) {
    return kind === '克' ? fourLessons[i].位 : fourLessons[i].上;
  }

  /** 涉害深数：从受克之神所临地盘位起，顺行历归本位，途经之地盘位克本神者计一重（不计藏干） */
  function sheHaiDepth(from, to) {
    const steps = ((to - from) % 12 + 12) % 12;
    let n = 0;
    for (let k = 0; k < steps; k += 1) {
      if (overcomes(ZHI_WX[(from + k) % 12], ZHI_WX[to % 12])) n += 1;
    }
    return n;
  }

  /**
   * 比用 → 涉害 → 见机/察微 → 缀瑕，逐级裁定。
   * ★ 两派并存（如实标注）：《大六壬指南》作简化说「先以寅申巳亥上乘之神为用…名曰见机；
   *   孟神上无克贼则以子午卯酉上乘之神为用…名曰察微」，即**直取孟/仲**、不逐课数深浅；
   *   《六壬大全·课目》则作「涉害俱比俱不比，度难归家分深浅」，即先数深浅再取孟仲。
   *   本实现取后者（先数深浅、等深再孟仲、复等缀瑕），两派在同一课上多数同解。
   * @param {number[]} cands 候选课序
   * @param {'克'|'贼'|'弹'|'蒿'} kind
   */
  function pickByUse(cands, kind) {
    const 日阴阳 = dayYang ? 1 : 0;
    // 比用（又名知一）：阳日取阳支上神、阴日取阴支上神；俱不比则全取。
    // 依据《六壬大全·课经集》（卷七至卷十，一至四）：「以甲丙戊庚壬为阳日，而用一子寅辰午申戌之神阳与阳比，
    //   虽二三阴勿论也；若乙丁己辛癸为阴日，而用一丑卯巳未酉亥之神阴与阴比。」
    // ★ 地支阳 = 子寅辰午申戌 = 支序偶数（子0、寅2…亥11为阴），
    //   与「日干索引偶数=阳」恰好一致，故用 (上+1)%2===日阴阳 表达「阳日配阳支」。
    const bi = cands.filter((i) => ((fourLessons[i].上 + 1) % 2) === 日阴阳);
    const pool = bi.length ? bi : cands;
    const 底 = kind === '克' ? '元首' : (kind === '贼' ? '重审' : (kind === '弹' ? '弹射' : '蒿矢'));
    if (pool.length === 1) {
      return { idx: pool[0], 课体: cands.length > 1 ? `比用·${底}` : 底, 层级: cands.length > 1 ? '比用' : '单克' };
    }
    // 涉害：深者为用
    const depths = pool.map((i) => sheHaiDepth(fourLessons[i].位, clashedBranch(i, kind)));
    const max = Math.max(...depths);
    let deep = pool.filter((i) => depths[pool.indexOf(i)] === max);
    let 层级 = `涉害(深${max})`;
    if (deep.length > 1) {
      const meng = deep.filter((i) => MENG.includes(fourLessons[i].位));
      if (meng.length) { deep = meng; 层级 += '→见机'; } else {
        const zh = deep.filter((i) => ZHONG.includes(fourLessons[i].位));
        if (zh.length) { deep = zh; 层级 += '→察微'; }
      }
    }
    if (deep.length > 1) {
      // 缀瑕（复等）：阳日取干两课先见者、阴日取支两课先见者
      const first = dayYang ? [0, 1] : [2, 3];
      const sel = deep.filter((i) => first.includes(i));
      deep = [sel.length ? sel[0] : deep[0]];
      层级 += '→缀瑕';
    }
    // 十课正名只到「涉害」；见机/察微/缀瑕是涉害内部的三层取用细则
    //   （《六壬大全·卷一·起例·三 渉害法》「孟深仲浅季当休，复等柔辰刚日宜」），记在发用里。
    let 课体 = '涉害';
    if (层级.includes('见机')) 课体 = '涉害·见机';
    else if (层级.includes('察微')) 课体 = '涉害·察微';
    if (层级.includes('缀瑕')) 课体 += '·缀瑕';
    return { idx: deep[0], 课体, 层级 };
  }

  /** 四课不全（止备三课/二课）判定：任意两课「位与上同时相同」才算重复 */
  function fourLessonsIncomplete() {
    for (let a = 0; a < 4; a += 1) {
      for (let b = a + 1; b < 4; b += 1) {
        if (fourLessons[a].上 === fourLessons[b].上 && fourLessons[a].位 === fourLessons[b].位) return true;
      }
    }
    return false;
  }

  /* ============================ (1) 伏吟 ============================ */
  // 月将 = 占时，天地盘如一。癸日/乙日取干上（不虞）；其余阳日干上（自任）、阴日支上（自信）；
  // 初传自刑 → 中传阳日用支上、阴日用干上；中传自刑 → 末传取中传之冲；末传绕回初传 → 取中传之冲。
  function fuYin() {
    let 初; let 名;
    if (dayGan === '癸') { 初 = 干上; 名 = '伏吟·不虞'; } else if (dayGan === '乙') { 初 = 干上; 名 = '伏吟·不虞'; } else if (dayYang) { 初 = 干上; 名 = '伏吟·自任'; } else { 初 = 支上; 名 = '伏吟·自信'; }
    let 中;
    if (isZiXing(初)) 中 = (dayGan === '乙' || dayYang) ? 支上 : 干上;
    else 中 = xingTarget(初);
    let 末 = isZiXing(中) ? chongOf(中) : xingTarget(中);
    if (末 === 初) 末 = chongOf(中);
    return { 三传: [初, 中, 末], 发用: 名, 课体: '伏吟' };
  }

  /* ============================ (2) 返吟 ============================ */
  // 月将与占时相冲。有克仍走贼克/比用/涉害（中=初冲、末=中冲，初末相同，名「无依」）；
  // 无克只六日（丁丑/己丑/辛丑/丁未/己未/辛未）→ 日支驿马发用（井栏/无亲），中=支上、末=干上；
  // 其中丁未/己未属八专（干寄未 = 日支未）→ 中末皆用干上。
  function fanYin() {
    const { 克, 贼 } = collect();
    if (克.length || 贼.length) {
      const kind = 克.length ? '克' : '贼';
      const p = pickByUse(克.length ? 克 : 贼, kind === '克' ? '克' : '贼');
      const 初 = clashedBranch(p.idx, kind === '克' ? '克' : '贼');
      // 《大六壬指南》：「反吟……克之少者重审、元首取之，多则知一涉害取之。
      // 三传初末相同而冲乎中传。」——有克之返吟不作「无依」，「无依（井栏/无亲）」
      // 专指无克那六日（丁丑/己丑/辛丑/丁未/己未/辛未）。
      return { 三传: [初, chongOf(初), chongOf(chongOf(初))], 发用: `返吟·${p.课体}`, 课体: '返吟' };
    }
    const 马 = yimaOf(dayZhiIdx);
    const 八专 = fourLessons[0].位 === fourLessons[2].位;
    return { 三传: [马, 八专 ? 干上 : 支上, 干上], 发用: '返吟·井栏', 课体: '返吟' };
  }

  /* ============================ (9) 八专 ============================ */
  // 干支同位（日干寄宫 = 日支）→ 四课止二课。八专不取遥克（干支同位无所谓远），
  // 阳日自干上神顺数三位、阴日自支阴上神逆数三位取初传；中末俱用干上；初传恰为干上即「独足」。
  function baZhuan() {
    // ★ 顺逆数的是「地盘位序」，不是天盘上神——早前误用 tian[初] 递推，
    //   顺数三位变成了沿着天盘转，庚申日该给丑却给巳。正法：
    //   阳日 = 干上神在地盘的位次 + 2 位；阴日 = 支阴上神在地盘的位次 − 2 位。
    let 初;
    if (dayYang) {
      初 = ((干上 + 2) % 12 + 12) % 12;
    } else {
      初 = ((fourLessons[3].上 - 2) % 12 + 12) % 12;
    }
    return { 三传: [初, 干上, 干上], 发用: 初 === 干上 ? '八专·独足' : '八专', 课体: '八专' };
  }

  /* ============================ (7) 别责 ============================ */
  // fourLessonsIncomplete（只备三课）且无贼克无遥克。刚日取日干合干之寄宫上神；柔日取日支三合局前一位；
  // 中末皆用干上神（「皆以天上作初传，阴阳中末干中寄」）。
  function bieZe() {
    let 初;
    if (dayYang) {
      const heGong = STEM_LODGING[GAN_Z.indexOf(HE_GAN[dayGanIdx])];
      初 = tian[heGong];
    } else {
      初 = SAN_HE[dayZhiIdx];
    }
    return { 三传: [初, 干上, 干上], 发用: '别责', 课体: '别责' };
  }

  /* ============================ (8) 昴星 ============================ */
  // 四课全备、无克无遥。阳日「仰视」取地盘酉上神为初传；阴日「俯视」取天盘酉所临地盘位为初传；
  // 中传：阳日取支上、阴日取干上；末传：阳日取干上、阴日取支上。
  function maoXing() {
    const you = 9; // 酉
    const 初 = dayYang ? tian[you] : tian.indexOf(you);
    return {
      三传: [初, dayYang ? 支上 : 干上, dayYang ? 干上 : 支上],
      发用: dayYang ? '昴星·虎视' : '昴星·冬蛇掩目',
      课体: '昴星',
    };
  }

  /**
   * 课体归一为《六壬大全·卷一·起例》十课正名：
   *   元首 / 重审 / 知一（比用别名） / 涉害 / 遥克 / 昴星 / 别责 / 八专 / 伏吟 / 返吟。
   *   见机·察微·缀瑕是涉害内部的取用细则，蒿矢·弹射是遥克的两支，
   *   「比用·元首」是取用过程——这些细节一律记在「发用」字段，课体只留正名。
   */
  function normalizeCourse(name) {
    const base = String(name || '').split('·')[0];
    if (base === '比用') return '知一';
    return base || '';
  }

  /* ============================ 主流程 ============================ */
  if (M === T) return fuYin();
  if (((M - T) % 12 + 12) % 12 === 6) return fanYin();

  const { 克, 贼 } = collect();

  // 八专排在遥克之前：干支同位本无「遥」可言（《指南》「无克不复取遥矣，盖遥远也，干支同位何远耶」）。
  // ★ 判据只看「日干寄宫 === 日支」（干支同位），四课自然只剩两课；
  //   早前额外要求「fourLessonsIncomplete」反而把真正的八专日（丁未/己未…）漏掉，落到涉害/昴星上，整盘发用错。
  if (!克.length && !贼.length && fourLessons[0].位 === fourLessons[2].位) return baZhuan();

  if (克.length) {
    const p = pickByUse(克, '克');
    const 初 = clashedBranch(p.idx, '克');
    // 课体取十课正名：《六壬大全·卷一·起例》「一上克下曰元首」「下克上曰重审」，
    //   「二比用法（即知一）」——须经比用择定的课，课名就叫「知一」。
    //   发用仍保留「比用·元首」这样的取用过程说明。
    return { 三传: 顺三传(初), 发用: p.课体, 课体: normalizeCourse(p.课体) };
  }
  if (贼.length) {
    const p = pickByUse(贼, '贼');
    const 初 = clashedBranch(p.idx, '贼');
    return { 三传: 顺三传(初), 发用: p.课体, 课体: normalizeCourse(p.课体) };
  }

  // (3) 遥克《六壬大全·卷一·起例·四 遥克法》：「神遥克日曰蒿矢，日遥克神曰弹射。
  //     四课无克号为遥，日与神兮递互招。先取神遥克其日，如无方取日来遥。」
  //     —— 神克日 = 蒿矢，先取；日克神 = 弹射，后取。多课取与日干阴阳相比者（同比用法）。
  const 蒿 = []; const 弹 = [];
  for (let i = 0; i < 4; i += 1) {
    const sw = ZHI_WX[fourLessons[i].上 % 12];
    if (overcomes(sw, GAN_WX[dayGanIdx])) 蒿.push(i);   // 神遥克日 = 蒿矢，先取
    if (overcomes(GAN_WX[dayGanIdx], sw)) 弹.push(i);   // 日遥克神 = 弹射
  }
  if (蒿.length || 弹.length) {
    const kind = 蒿.length ? '蒿' : '弹';
    const p = pickByUse(蒿.length ? 蒿 : 弹, kind);
    const 初 = fourLessons[p.idx].上;
    // 遥克为十课之一（第四法「遥克法」），课体名即「遥克」；蒿矢/弹射是它的两支，
    //   记在发用里（多课再经比用择定记「比用·蒿矢」），故课体统一为「遥克」。
    return { 三传: 顺三传(初), 发用: p.课体, 课体: '遥克' };
  }

  // (7) 别责：fourLessonsIncomplete
  if (fourLessonsIncomplete()) return bieZe();

  // (8) 昴星：四课全备、无克无遥
  return maoXing();
}
