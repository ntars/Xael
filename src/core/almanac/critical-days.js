/**
 * src/core/almanac/critical-days.js —— 黄历「诸事不宜」类的日子（自研，零依赖）
 *
 * 大白话：通书里有几种日子，不管吉神凶煞怎么排，本身就不宜办事。
 *   这里只收原书写明条件、可精确算出的四种：四离、四绝、月忌日、月破。
 *
 * 依据（库内原文，refs-texts/《钦定协纪辨方书》-清·允禄等奉敕撰.md）：
 *   · 四离（第 1133 行）——库外《玉门经》「离者，阴阳分至前一辰也」；曹震圭「四离者，
 *     冬至前一日水离、夏至前一日火离、春分前一日阳体分而木亦离、秋分前一日阴体分而金亦离」。
 *     李鼎祚「此日忌出行、征伐」。
 *   · 四绝（第 1134 行）——库外《玉门经》「四绝者，四立前一辰也」；曹震圭「立春木旺水绝、
 *     立夏火旺木绝、立秋金旺土绝、立冬水旺金绝，故先一日为绝也」。李鼎祚「此日忌出军、远行」。
 *   · 四离四絶的总断（第 1979 行按语）——「四离四绝为二气五行分判之日，故诸事不宜，
 *     惟祭祀、解除等事或以事神而不敢禁，或以除旧而不为嫌，故遇有所宜之神则不忌」。
 *   · 月忌日（第 1136 行）——历例「月忌日止注祭祀、宴饮、沐浴、整容、剃头、整手足甲、
 *     求医疗病、补垣、扫舍宇、修饰垣墙、平治道涂、破屋坏垣，余事不注」；同段又引俗说
 *     「每月初五、十四、二十三日为月忌」，并录「前辈云此俗忌之日有吉星可用」。
 *   · 月破（第 736 行）——库外《考原》「月破者，月建所冲之日也，与岁破义同」；
 *     第 737 行库外《枢要历》「大耗者，月中虚耗之神也，其日忌营库藏、出财物、远经求取债负」。
 *
 * 不做的事（不臆造）：
 *   · 不给这些日子加权分、不折算「凶几分」；
 *   · 「遇有所宜之神则不忌」是原书的活口，故**不据四离四绝去删改通书表的宜忌**，
 *     只在旁边标注，把判断留给读者；
 *   · 月忌日的俗忌与历例两说并列，不挑一条当定论。
 */

import { solarTermsTable } from '../calendar/solar-terms.js';

/** 四离：二分二至前一日；四绝：四立前一日 */
const LI_TERMS = { 冬至: '水离', 夏至: '火离', 春分: '阳体分而木亦离', 秋分: '阴体分而金亦离' };
const JUE_TERMS = { 立春: '木旺水绝', 立夏: '火旺木绝', 立秋: '金旺土绝', 立冬: '水旺金绝' };

/** 次日：四离四绝都是「节气前一日」，故要往后看一天 */
const nextDay = (y, m, d) => {
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};

/**
 * 四离 / 四绝判定。
 * @returns {{类:string, 节气:string, 理:string, 说明:string, 依据:string}|null}
 */
export function siLiSiJueOf(y, m, d) {
  const p = nextDay(y, m, d);
  const table = solarTermsTable(p.y);
  for (const name of Object.keys(LI_TERMS)) {
    const t = table[name];
    if (t && t.m === p.m && t.d === p.d) {
      return {
        类: '四离', 节气: name, 理: LI_TERMS[name],
        说明: `${name}前一日（${LI_TERMS[name]}），原文「离者，阴阳分至前一辰也」，此日忌出行、征伐；按语又云「四离四绝为二气五行分判之日，故诸事不宜，惟祭祀、解除等事……遇有所宜之神则不忌」`,
        依据: '《钦定协纪辨方书·四离》',
      };
    }
  }
  for (const name of Object.keys(JUE_TERMS)) {
    const t = table[name];
    if (t && t.m === p.m && t.d === p.d) {
      return {
        类: '四绝', 节气: name, 理: JUE_TERMS[name],
        说明: `${name}前一日（${JUE_TERMS[name]}），原文「四绝者，四立前一辰也」，此日忌出军、远行；按语「诸事不宜，惟祭祀、解除等事……遇有所宜之神则不忌」`,
        依据: '《钦定协纪辨方书·四絶》',
      };
    }
  }
  return null;
}

/**
 * 月忌日：每月初五、十四、二十三。
 * 历例给「只注祭祀宴饮…」一系事；俗说主张凡事避之，而同段又引「有吉星可用」。
 */
export function yueJiOf(d) {
  if (![5, 14, 23].includes(+d)) return null;
  return {
    类: '月忌日', 日: +d,
    说明: `每月初五、十四、二十三为月忌日。历例只注祭祀、宴饮、沐浴、整容、剃头、整手足甲、求医疗病、补垣、扫舍宇、修饰垣墙、平治道涂、破屋坏垣，余事不注；俗说明「凡事必避之」，而同段又引「前辈云此俗忌之日有吉星可用」`,
    依据: '《钦定协纪辨方书·月忌日》',
  };
}

/**
 * 月破：日支冲月建。
 * @param {string} dayZhi 日支
 * @param {string} monthZhi 月支
 */
export function monthBreakOf(dayZhi, monthZhi) {
  const Z = '子丑寅卯辰巳午未申酉戌亥';
  const i = Z.indexOf(dayZhi);
  const j = Z.indexOf(monthZhi);
  if (i < 0 || j < 0 || (i + 6) % 12 !== j) return null;
  return {
    类: '月破', 说明: `日支${dayZhi}冲月建${monthZhi}，原作「月破者，月建所冲之日也，与岁破义同」，一名大耗，其日忌营库藏、出财物、远经求取债负`,
    依据: '《钦定协纪辨方书·月破》',
  };
}

/** 四种合并：返回命中的条目数组（可能为空） */
export function criticalDaysOf(y, m, d, dayZhi, monthZhi) {
  const out = [];
  const a = siLiSiJueOf(y, m, d);
  if (a) out.push(a);
  const b = yueJiOf(d);
  if (b) out.push(b);
  const c = monthBreakOf(dayZhi, monthZhi);
  if (c) out.push(c);
  return out;
}
