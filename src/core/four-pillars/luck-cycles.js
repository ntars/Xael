/**
 * src/core/four-pillars/luck-cycles.js —— 大运与流年（自研，零依赖）
 *
 * 大白话：大运是「十年一步」的运势周期，从月柱起推；阳男阴女顺排、阴男阳女逆排。
 * 本模块只输出周期与干支，不作吉凶断语。
 *
 * 口径来源：《渊海子平·论大运》（阳男阴女顺排、阴男阳女逆排，起运按节折算三年一运）
 *   与《三命通会·论大运》（只数十二节、三日折一年）；逐条见 docs/CALIBER-NOTES.md「八字」节：

 *   · 顺逆：年干阴阳 + 性别（阳男、阴女顺排；阴男、阳女逆排）；
 *   · 起运：只数**十二节**（立春、惊蛰…小寒），不数中气（夏至、冬至…）；
 *     顺排数到「下一个节」，逆排数到「上一个节」；
 *   · 折算：时辰差先换月，天数差 ×4 + 月差 得「总月数」，再 ÷12 得年、余数为月；
 *     余下时辰数 ×10 得「日」（古法「三日折一年、一日折四月、一时辰折十日」）；
 *   · 交节当日按时刻判定：出生时刻晚于交节时刻，这一节才算「已经过去」；
 *   · 大运干支：自**月柱**起，按顺/逆在六十甲子上前后移动（第 1 步 = 月柱 ±1）；
 *   · 起始年 = 出生年 + 起运年数；起始年龄 = 起始年 − 出生年 + 1（虚岁计）。
 */

import { SEXAGENARY, STEMS } from '../common/constants.js';
import { JIE_ONLY, prevSolarTermAt, nextSolarTermAt } from '../calendar/solar-terms.js';
import { dayNo, fromDayNo, daysInMonth } from '../calendar/julian.js';

/** 某年某月的天数（小工具，避免每处重复传参） */
function daysInMonthOf(y, m) {
  return daysInMonth(y, m);
}
import { fourPillarsChart } from './chart.js';
import { minorCyclesOf } from './minor-cycles.js';

/** 单柱在六十甲子中的序号（SEXAGENARY 每项是 [干,支] 数组，故按文本比对） */
function jiaziIndex(gz) {
  const text = Array.isArray(gz) ? gz.join('') : String(gz);
  return SEXAGENARY.findIndex((it) => it.join('') === text);
}

/** 六十甲子序号 → 干支文本 */
function sexagenaryText(idx) {
  return SEXAGENARY[((idx % 60) + 60) % 60].join('');
}


/**
 * 月份推进（日号超当月天数时截断到月末），返回 {y, m}。
 * 大白话：给「某年某月」加 N 个月，闰年 2 月 29 日这类越界日一律落到当月最后一天。
 */
function addMonthsClamped(y, m, addMonths) {
  const total = y * 12 + (m - 1) + addMonths;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
}

/** 两位补零 */
function pad2(n) { return n < 10 ? '0' + n : '' + n; }

/** 一天内的秒数（用于把两个时刻折算成同一时辰的判定基准） */
function secOfDay(h, minute, sec) {
  return h * 3600 + (minute || 0) * 60 + (sec || 0);
}

/**
 * 时辰支序（古法「子时起于夜半前一时辰」口径）：23 时特判为 11（亥位），
 * 其余为 floor((h+1)/2)：0–1 子 0、2–3 丑 1 … 22 亥 11。
 * 注意与四柱的 hourBranchIndex（23 时算子时 0）不同——起运折算用的是这一套。
 */
function hourZhiIdx(h) {
  return h === 23 ? 11 : Math.floor((h + 1) / 2);
}

/**
 * 起运信息：返回 {年, 月, 日, 岁, 顺逆, 前后节, 说明}
 * @param {object} c 八字 fourPillarsChart 结果
 * @param {boolean} forward 是否顺排
 */
function startYun(c, forward) {
  const { y, m, d, h = 0, minute = 0 } = c.input;
  // 只取十二节：顺排找下一个节（严格在出生时刻之后），逆排找上一个节（含出生时刻之前）
  const target = forward
    ? nextSolarTermAt(y, m, d, h, minute, JIE_ONLY)
    : prevSolarTermAt(y, m, d, h, minute, JIE_ONLY);

  // 时刻按「时辰」计：23 时归亥（23:00 属亥时末），其余 floor((h+1)/2)。
  // 时辰差与日差是两路独立取整再借位，不能合并成分钟差
  //（合并会得到不同的年/月/日，已实测验证）。
  // 顺排：起点=出生、终点=交节；逆排：起点=交节、终点=出生（end 恒为较晚那端）。
  const startDayNo = forward ? dayNo(y, m, d) : dayNo(target.y, target.m, target.d);
  const endDayNo = forward ? dayNo(target.y, target.m, target.d) : dayNo(y, m, d);
  const startZhi = forward ? hourZhiIdx(h) : hourZhiIdx(target.hh);
  const endZhi = forward ? hourZhiIdx(target.hh) : hourZhiIdx(h);

  // 日差按「日历日相减」（即日序差），保持 start→end 的方向，
  //   所以逆排是「出生日 − 交节日」，与时辰差同号同向——这一点此前写反过，
  //   导致逆排在时辰差借位时把日差多减一天（实测 1988-1-9 等 5 例差异全由此而来）。
  let dDiff = endDayNo - startDayNo;
  let hourDiff = endZhi - startZhi;

  // 原始支序差（未借位）：容错判断要用它与真实块差对齐；借位在容错之后再做。
  const rawHourDiff = hourDiff;

  // 跨时辰分界容错：级数残差（≤60 秒）会让交节时刻落进相邻时辰，使「时辰差」整体错一档。
  //   做法：用两个真实时刻的分钟数算「时辰块序号差」，若与支序差只差一档且交节贴着时辰
  //   边界，就以真实时刻为准。
  //   ★ 这里必须同时给出**未借位**的时辰差与**借位后**的日差一起改：
  //     若只写 hourDiff = trueBlock（正值），下面「hourDiff<0 借一天」不再执行，
  //     日差就少减一天，折算出的月数会多出 4 个月（实测 1904 等 55 例全部由此而来）。
  {
    // 交节那端分钟要带秒（临界往往只差几十秒）
    const tgtMin = target.hh * 60 + target.mm + (target.sec || 0) / 60;
    const sMin = forward ? h * 60 + minute : tgtMin;
    const eMin = forward ? tgtMin : h * 60 + minute;
    // 块序号必须与 hourZhiIdx 同一套（01:00–02:59 丑 1、…、23 特判 11），
    //   不能直接 floor(min/120)——那是从 0:00 起跳的「整两小时块」，
    //   与时辰错半小时（15:00 会被算成 7，实际是 8，实测 1904 例全由此而来）。
    const blockOf = (min) => {
      const hh = Math.floor(min / 60);
      return hh === 23 ? 11 : Math.floor((hh + 1) / 2);
    };
    const trueBlock = blockOf(eMin) - blockOf(sMin);
    // 交节时刻贴着时辰边界（距边界 ≤ 6 分钟）时，我们算的分钟可能把
    //   「跨/不跨时辰」判反；只有这种情况才允许改档，出生时刻侧不动。
    const tgtEdge = (() => { const r = tgtMin % 120; return r <= 6 || r >= 114; })();
    if (tgtEdge && rawHourDiff !== trueBlock && Math.abs(rawHourDiff - trueBlock) === 1) {
      // 改档后重新对齐「未借位 / 借一天」两件事：以 trueBlock 为未借位基准，
      //   若它为负，则同步借一天。
      hourDiff = trueBlock;
      if (hourDiff < 0) {
        hourDiff += 12;
        dDiff -= 1;
      }
      dDiff = Math.max(dDiff, 0);
    }
  }

  // 借位规则：时辰差为负 → 借一天（+12 时辰、日差 −1）
  if (hourDiff < 0) {
    hourDiff += 12;
    dDiff -= 1;
  }
  if (dDiff < 0) dDiff = 0;

  // 总月数 = 天数差 ×4 + 时辰差折算月（整 30 时辰折 1 月），再 ÷12 得年；
  // 余下时辰数 ×10 得「日」（三日折一年 / 一日折四月 / 一时辰折十日）。
  // 校验例：2024-02-10 12 时女 逆排 → 1 年 11 月 10 天。
  const hour2month = hourDiff * 10;
  const monthDiff = Math.floor(hour2month / 30);
  const totalMonth = dDiff * 4 + monthDiff;
  const year = Math.floor(totalMonth / 12);
  const month = totalMonth - year * 12;
  const day = hour2month - monthDiff * 30;

  return {
    年: year,
    月: month,
    日: day,
    岁: year + 1, // 粗算虚岁（精确值以落地年为准，见 luckCyclesOf 里的 startYear − birthYear + 1）
    前后节: target.name,
    天数: dDiff, 时辰数: hourDiff,
    交节: `${target.text} ${target.time}`,
    note: `自出生至${forward ? '下一个节' : '上一个节'}「${target.name}」（${target.text} ${target.time}），`
      + `${dDiff} 天 ${hourDiff} 时辰，三日折一年 → ${year} 年 ${month} 月 ${day} 天`,
  };
}

/**
 * 大运与流年。
 * @param {object} input {y,m,d,h,minute,gender}
 * @param {number} count 列多少步大运（默认 9 步）
 * @returns {object}
 */
export function luckCyclesOf(input, count = 9) {
  const c = fourPillarsChart(input);
  const gender = input.gender || '男';
  const yearGan = c.pillars.年.干;
  const yearYang = STEMS.find((g) => g.z === yearGan).yy === 0;
  const male = gender === '男';
  const forward = (yearYang && male) || (!yearYang && !male);

  const yun = startYun(c, forward);
  const monthIdx = jiaziIndex(c.pillars.月.干支);
  const birthYear = c.input.y;

  // 大运「起始年」= 出生年 + 起运年数（即 birthYear + startYear 的取法，
  //   只吃「年」这一级，月/日推进不改变起始年；落地时刻另算，仅用于展示）。
  const yBase = birthYear + yun.年;
  const mBase = addMonthsClamped(yBase, c.input.m, yun.月);
  // 落地日：从「月推进后的日号」起加天数，日号越界时逐月借位；
  // 这里先按当月天数截断日号再在日序上加，效果等价。
  const baseDay = Math.min(c.input.d, daysInMonthOf(mBase.y, mBase.m));
  const land = fromDayNo(dayNo(mBase.y, mBase.m, baseDay) + yun.日);
  // 起始年取落地后的公历年（年 → 月 → 日 三级推进的最终年份；
  //   1907-01-06 这类「月+日跨年」样本必须算进次年，故不能只看年推进那一级）。
  const startYear = land.y;

  // 大运干支自「月柱」起，第 1 步 = 月柱顺／逆移一位。
  const 大运 = [];
  for (let i = 1; i <= count; i++) {
    const idx = ((monthIdx + (forward ? i : -i)) % 60 + 60) % 60;
    const sy = startYear + (i - 1) * 10;
    const sa = sy - birthYear + 1;
    大运.push({
      序: i,
      干支: sexagenaryText(idx),
      起始年龄: sa,
      起始年份: sy,
      结束年份: sy + 9,
      岁数区间: `${sa}–${sa + 9} 岁`,
      年份区间: `${sy}–${sy + 9}`,
    });
  }

  // 流年：自出生年起列 10 年（干支按立春换年口径，此处只列公历年对应的年柱）
  const 流年 = [];
  for (let i = 0; i < 10; i++) {
    const yy = birthYear + i;
    const idx = ((yy - 4) % 60 + 60) % 60; // 公元 4 年为甲子
    流年.push({ 年份: yy, 干支: sexagenaryText(idx) });
  }

  // 小运（行年）：一岁一位，补大运十年之不足。
  //   《三命通会·论小运》并存两法（起年运法「男起丙寅顺行、女起壬申逆行」；
  //   醉醒子时上起法「男女小运皆由时生而行之，逆顺亦以年定」），故整组并列输出，
  //   推算细节见 src/core/four-pillars/minor-cycles.js。
  const 小运 = minorCyclesOf({ ...input, pillars: c.pillars }, 12);

  return {
    性别: gender,
    顺逆: forward ? '顺排' : '逆排',
    排法依据: `年干${yearGan}（${yearYang ? '阳' : '阴'}年）· ${gender}命 → ${forward ? '顺排' : '逆排'}`,
    起运: {
      年: yun.年, 月: yun.月, 日: yun.日, 岁: yun.岁,
      前后节: yun.前后节, 交节: yun.交节,
      // 「X 年后」= 起运年数；「约 N 岁」= 起始年 − 出生年 + 1（虚岁计）
      文本: `${yun.年} 年后起运（约 ${startYear - birthYear + 1} 岁）`,
      落地: `${land.y}-${pad2(land.m)}-${pad2(land.d)}`,
      note: yun.note,
    },
    大运,
    小运,
    流年,
    note: '大运以月柱为起点，十年一易；起运按十二节折算（三日一年、一日四月、一时辰十日）。',
  };
}
