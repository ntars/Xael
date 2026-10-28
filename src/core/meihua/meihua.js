/**
 * src/core/meihua/meihua.js —— 梅花易数·时间起卦（自研，零依赖）
 *
 * 大白话：梅花用「数」起卦——把年支数、月数、日数加起来除八取余得上卦，
 *   再加时辰数除八取余得下卦，总和除六取余定动爻；然后拆本卦/互卦/变卦，
 *   按体用五行生克断吉凶，最后接断语库出可读文字。
 *
 * 口径（与旧版逐字一致，均属通行断法）：
 *   · 年支数取「子1 丑2 … 亥12」；
 *   · 时辰数 nH = floor((h+1)/2) + 1（子时=1 … 亥时=12，23 时算子时）；
 *   · 上卦 = (年+月+日) mod 8，余 0 作 8；下卦 = (年+月+日+时) mod 8，余 0 作 8；
 *   · 动爻 = (年+月+日+时) mod 6，余 0 作 6（自初爻数起）；
 *   · 六爻自下而上 = 下卦三爻 + 上卦三爻；
 *   · 互卦：二三四爻为下卦、三四五爻为上卦；
 *   · 变卦：动爻阴阳反转；
 *   · 体用：动爻所在之卦为「用」，另一卦为「体」。
 */

import { BAGUA, guaName } from '../common/iching.js';
import { tiYongOf, guaOf, xiangOf, zhanDuanOf } from './duanyu.js';

/** 先天数 → 卦名 */
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
export function meihuaChart(input) {
  const o = input || {};
  let nY; let nM; let nD; let nH; let mode;
  if (o.num1 != null && o.num2 != null) {
    mode = '数字';
    nY = o.num1; nM = o.num2; nD = 0;
    nH = o.hourZhi != null ? o.hourZhi : 1;
  } else {
    mode = '时间';
    const y = o.y; const m = o.m || 1; const d = o.d || 1;
    const h = o.h != null ? o.h : 14;
    // 年支序：子1…亥12
    const zhiIdx = (((y - 4) % 12) + 12) % 12;
    nY = zhiIdx + 1;
    nM = m; nD = d;
    nH = Math.floor(((((h % 24) + 24) % 24) + 1) / 2) + 1;
  }

  const s = nY + nM + nD;
  const sh = mod8(s);       // 上卦数
  const x = mod8(s + nH);   // 下卦数
  const dy = mod6(s + nH);  // 动爻位（1–6）

  const upper = NUM2GUA[sh];
  const lower = NUM2GUA[x];
  const bits = [...BAGUA[lower].爻, ...BAGUA[upper].爻];

  // 互卦：二三四爻为下、三四五爻为上
  const huBits = [bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]];
  const huLower = triName(huBits.slice(0, 3));
  const huUpper = triName(huBits.slice(3));

  // 变卦：动爻反转
  const bianBits = bits.slice();
  bianBits[dy - 1] = 1 - bianBits[dy - 1];
  const bianLower = triName(bianBits.slice(0, 3));
  const bianUpper = triName(bianBits.slice(3));

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
  const jiXiong = (rel === '用生体' || rel === '比和') ? '吉' : (rel === '体克用' ? '小吉（泄体）' : '凶');

  const benName = guaName(upper, lower);
  const huName = guaName(huUpper, huLower);
  const bianName = guaName(bianUpper, bianLower);

  return {
    input: o,
    起卦: mode,
    上卦: upper,
    下卦: lower,
    本卦: {
      名: benName, 象名: XIANG_OF[upper] + XIANG_OF[lower], 上卦: upper, 下卦: lower, 爻: bits,
    },
    互卦: {
      名: huName, 象名: XIANG_OF[huUpper] + XIANG_OF[huLower], 上卦: huUpper, 下卦: huLower, 爻: huBits,
    },
    变卦: {
      名: bianName, 象名: XIANG_OF[bianUpper] + XIANG_OF[bianLower], 上卦: bianUpper, 下卦: bianLower, 爻: bianBits,
    },
    动爻: dy,
    体用: {
      体: `${ti}(${tw})`, 用: `${yong}(${yw})`, 体卦: ti, 用卦: yong, 体五行: tw, 用五行: yw, 关系: rel, 吉凶: jiXiong,
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
 * @param {object} r meihuaChart 的返回值
 * @param {string} men 人事/家宅/婚姻/求财/疾病/失物/出行/官讼
 */
export function meihuaMen(r, men) {
  const tpl = zhanDuanOf(men);
  const out = [];
  if (tpl) out.push(tpl);
  if (r && r.体用) out.push(`本卦体用：${r.体用.关系} → ${r.体用.吉凶}`);
  return out;
}
