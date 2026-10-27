/**
 * src/core/bazi/dayun.js —— 大运与流年（自研，零依赖）
 *
 * 大白话：大运是「十年一步」的运势周期，从月柱起推；阳男阴女顺排、阴男阳女逆排。
 * 起运岁数按「出生到下一个（或上一个）节气」的天数折算：三天折一年。
 * 本模块只输出周期与干支，不作吉凶断语。
 *
 * 口径（docs/CALIBER-NOTES.md「八字」节）：
 *   · 顺排/逆排：以年干阴阳 + 性别判定（阳男、阴女顺排；阴男、阳女逆排）；
 *   · 起运：顺排数到「下一个」节气，逆排数到「上一个」节气，天数 ÷ 3 = 岁，
 *     余数 1 天折 4 个月、1 时辰折 10 天（传统折算法）；
 *   · 大运干支：自月柱起，按顺/逆在六十甲子序列上前后移动；
 *   · 流年：自起运年起，逐年干支，默认列 10 年。
 */

import { JIAZI, GAN } from '../common/constants.js';
import { jieqiAround } from '../huangli/daily.js';
import { chart } from './bazi.js';
import { dayNo } from '../calendar/solar.js';

/** 单柱在六十甲子中的序号 */
function jiaziIndex(gz) {
  return JIAZI.indexOf(gz);
}

/**
 * 起运岁数：返回 {岁, 月, 天, 说明}。
 * @param {object} c 八字 chart 结果
 * @param {boolean} forward 是否顺排
 */
function startAge(c, forward) {
  const { y, m, d, h } = c.input;
  const around = jieqiAround(y, m, d);
  // 目标节气：顺排取下一个、逆排取上一个；日期差按儒略日
  const target = forward ? around.next : around.prev;
  const [ty, tm, td] = target.date.split('-').map(Number);
  const targetDay = dayNo(ty, tm, td);
  const birthDay = dayNo(y, m, d);
  // 顺排数到下一节气、逆排数到上一节气：天数为正，方向已由取哪个节气决定
  const days = Math.abs(targetDay - birthDay) + Math.abs(((target.hh ?? 0) - h) / 24);

  const 岁 = Math.floor(days / 3);
  const 余天 = days - 岁 * 3;
  const 月 = Math.floor((余天 * 4) ); // 1 天折 4 个月
  const 天 = Math.round((余天 * 4 - 月) * 30);

  return {
    岁,
    月,
    天,
    说明: `自出生至${forward ? '下一' : '上一'}节气 ${target.name} 共 ${days.toFixed(2)} 天，三日折算一年`,
  };
}

/**
 * 大运与流年。
 * @param {object} input {y,m,d,h,gender}
 * @param {number} count 列多少步大运（默认 8 步）
 * @returns {object}
 */
export function dayunOf(input, count = 8) {
  const c = chart(input);
  const gender = input.gender || '男';
  const yearGan = c.pillars.年.干;
  const yearYang = GAN.find((g) => g.z === yearGan).yy === 0;
  const male = gender === '男';
  const forward = (yearYang && male) || (!yearYang && !male);

  const start = startAge(c, forward);
  const monthIdx = jiaziIndex(c.pillars.月.干支);

  const 大运 = [];
  for (let i = 1; i <= count; i++) {
    const idx = ((monthIdx + (forward ? i : -i)) % 60 + 60) % 60;
    const startYear = c.input.y + start.岁 + (i - 1) * 10;
    const endYear = startYear + 9;
    const ageStart = start.岁 + (i - 1) * 10;
    大运.push({
      序: i,
      干支: JIAZI[idx],
      起始年龄: ageStart,
      起始年份: startYear,
      结束年份: endYear,
      岁数区间: `${ageStart}–${ageStart + 9} 岁`,
      年份区间: `${startYear}–${endYear}`,
    });
  }

  // 流年：自出生年起列 10 年
  const 流年 = [];
  for (let i = 0; i < 10; i++) {
    const yy = c.input.y + i;
    const idx = ((yy - 4) % 60 + 60) % 60; // 公元 4 年为甲子
    流年.push({ 年份: yy, 干支: JIAZI[idx] });
  }

  return {
    性别: gender,
    排法: forward ? '顺排' : '逆排',
    排法依据: `年干${yearGan}（${yearYang ? '阳' : '阴'}年）· ${gender}命 → ${forward ? '顺排' : '逆排'}`,
    起运: start,
    大运,
    流年,
    说明: '大运以月柱为起点，十年一易；起运岁数按「三日折一年」的传统折算。',
  };
}
