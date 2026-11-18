/**
 * src/core/four-pillars/minor-cycles.js —— 小运（行年，自研，零依赖）
 *
 * 大白话：大运管十年一步的大周期，小运管一年一位的小周期，古人叫「行年」，
 * 用来补大运十年太长、一年之内吉凶看不出来的缺口。本模块只排干支，不作吉凶断语。
 *
 * 口径来源：《三命通会·论小运》（明·万民英，refs-texts 第 362–363 行）。原书给了两法：
 *   ① 起年运法（古法）——「此小运所以男起丙寅顺行、女起壬申逆行，一定而不可易也」；
 *      男命一岁起丙寅、逐年顺行；女命一岁起壬申、逐年逆行。
 *   ② 醉醒子法（时上起法）——「醉醒子以为男女小运皆由时生而行之，逆顺亦以年定。
 *      如阳命阳年甲子时生，堕地即行乙丑，二岁丙寅，一位一年，周而复始；阴命阳年逆行亦然。
 *      尝试用之屡验。」
 *      即：以**时柱**为起点，出生即行时柱的下一位，一岁再进一位；
 *      顺逆与**大运同法**——阳年男、阴年女顺行，阴年男、阳年女逆行。
 *   两法原书并存（「今之谈命者只以大运为用，殊不知小运亦有口关……尝试用之屡验」），
 *   故本模块并列输出两法，不擅自取舍；差异如实标在「异同」字段里。
 *
 * 起算年龄：一律按**虚岁**（原书「堕地即行乙丑」= 出生那一年即为第一位），
 *   故第 1 位对应虚岁 1 岁，第 n 位对应虚岁 n 岁。
 */

import { SEXAGENARY, STEMS } from '../common/constants.js';

/** 六十甲子序号 → 干支文本 */
function text(idx) {
  return SEXAGENARY[((idx % 60) + 60) % 60].join('');
}

/** 干支文本 → 六十甲子序号（找不到返回 -1） */
function indexOfGz(gz) {
  const t = Array.isArray(gz) ? gz.join('') : String(gz);
  return SEXAGENARY.findIndex((it) => it.join('') === t);
}

const BING_YIN = indexOfGz('丙寅'); // 男命起位
const REN_SHEN = indexOfGz('壬申'); // 女命起位

/**
 * 小运推排。
 * @param {object} input {y,m,d,h,minute,gender} 与四柱同参
 * @param {number} count 排多少位（默认 12，够看一个流年组合）
 * @returns {object} { 性别, 顺逆, 起年运法:{依据,起位,方向,诸位[]}, 时上起法:{依据,起位,方向,诸位[]}, 异同, 口径 }
 */
export function minorCyclesOf(input, count = 12) {
  const gender = input.gender || '男';
  const male = gender === '男';
  const yearGan = (input.pillars && input.pillars.年 && input.pillars.年.干) || null;

  // 起年运法的顺逆只看性别（原书「男起丙寅顺行、女起壬申逆行，一定而不可易」）。
  const guFaStart = male ? BING_YIN : REN_SHEN;
  const guFaForward = male;

  // 时上起法需要时柱与大运同法的顺逆（阳年男、阴年女顺行），
  //   故这里必须拿到年干阴阳；调用方可直接传 pillars，也可传 yearGz。
  const gz = yearGan || (input.yearGz ? String(input.yearGz).charAt(0) : null);
  const yearYang = gz ? STEMS.find((g) => g.z === gz).yy === 0 : true;
  const forward = (yearYang && male) || (!yearYang && !male);

  const hourGz = input.pillars && input.pillars.时 ? input.pillars.时.干支 : null;

  const guFa = [];
  for (let i = 0; i < count; i++) {
    const idx = guFaStart + (guFaForward ? i : -i);
    guFa.push({ 虚岁: i + 1, 干支: text(idx) });
  }

  const shiFa = [];
  if (hourGz) {
    const hi = indexOfGz(hourGz);
    // 「堕地即行乙丑」= 出生那一年就已进一位，故第 1 位 = 时柱 ±1。
    for (let i = 0; i < count; i++) {
      const idx = hi + (forward ? i + 1 : -(i + 1));
      shiFa.push({ 虚岁: i + 1, 干支: text(idx) });
    }
  }

  const 异同 = (() => {
    if (!shiFa.length) return '时柱缺失，时上起法不排（起年运法不受影响）。';
    const same = guFa.every((it, i) => shiFa[i] && it.干支 === shiFa[i].干支);
    if (same) return '两法本年所排完全相同。';
    const diff = guFa.findIndex((it, i) => !shiFa[i] || it.干支 !== shiFa[i].干支) + 1;
    return `两法自虚岁 ${diff} 岁起不同：起年运法作 ${guFa[diff - 1].干支}，时上起法作 ${shiFa[diff - 1].干支}。原书并存两法，看盘时须先声明所用何法。`;
  })();

  return {
    性别: gender,
    起年运法: {
      依据: '《三命通会·论小运》「男起丙寅顺行、女起壬申逆行，一定而不可易也」',
      起位: male ? '丙寅' : '壬申',
      方向: guFaForward ? '顺行' : '逆行',
      诸位: guFa,
    },
    时上起法: {
      依据: '《三命通会·论小运》引醉醒子「男女小运皆由时生而行之，逆顺亦以年定」',
      起位: hourGz ? `${hourGz}${forward ? '之次位' : '之前一位'}` : '—',
      方向: forward ? '顺行' : '逆行',
      诸位: shiFa,
    },
    异同,
    口径: '小运又名行年，一岁一位，补大运十年之不足；原书两法并存，本模块并列不取舍。虚岁计，第 1 位即出生之年。',
  };
}
