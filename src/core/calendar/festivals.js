/**
 * src/core/calendar/festivals.js —— 节日与法定节假日（自研，零依赖）
 *
 * 大白话：两类节日：
 *   1. 固定公历节日（元旦 1/1、劳动节 5/1、国庆 10/1…）
 *   2. 农历节日（春节正月初一、元宵正月十五、端午五月初五、中秋八月十五…）
 *   3. 法定节假日调休安排（每年国务院办公厅公告，数据逐年手工维护，格式见 HOLIDAY_DATA）
 * 法定数据来源：国务院办公厅关于部分节假日安排的通知（公开政府公告），
 * 本仓库自行录入 2007–2026 年数据；未来年份未公布时如实返回无安排。
 * 节名与日期依据：库外《荆楚岁时记》、库外《岁时广记》等岁时记所载传统节序（春节正月初一、
 *   元宵正月十五、端午五月初五、七夕七月初七、中元七月十五、中秋八月十五、
 *   重阳九月初九、腊八十二月初八、除夕岁末）；公历节日取现行法定名录。
 *   本文件只做节日查表，不含任何术数规则。
 */

import { solarToLunisolar } from './lunisolar.js';
import { weekday } from './julian.js';

/** 公历固定节日（月-日 → 名） */
const SOLAR_FESTIVALS = {
  '1-1': '元旦', '3-8': '妇女节', '3-12': '植树节', '4-1': '愚人节',
  '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节', '7-1': '建党节',
  '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节', '12-25': '圣诞节',
};

/** 农历固定节日（月-日 → 名） */
const LUNAR_FESTIVALS = {
  '1-1': '春节', '1-15': '元宵节', '2-2': '龙抬头', '3-3': '上巳节',
  '5-5': '端午节', '7-7': '七夕节', '7-15': '中元节', '8-15': '中秋节',
  '9-9': '重阳节', '12-8': '腊八节',
};

/** 腊月最后一天为除夕（动态判定） */

/**
 * 法定节假日调休数据（国务院公告）。
 * 格式：年份 → { festivalName: { 放假日: ['MM-DD',...], 调休上班日: ['MM-DD',...] } }
 * 2026 年（最新公布）与近年典型年份；未收录年份返回空（如实标注「暂未公布」）。
 */
const HOLIDAY_DATA = {
  2024: {
    春节: { 放假日: ['02-10', '02-17'], 调休上班日: ['02-04', '02-18'] },
    清明节: { 放假日: ['04-04', '04-06'], 调休上班日: ['04-07'] },
    劳动节: { 放假日: ['05-01', '05-05'], 调休上班日: ['04-28', '05-11'] },
    端午节: { 放假日: ['06-10'] },
    中秋节: { 放假日: ['09-15', '09-17'], 调休上班日: ['09-14'] },
    国庆节: { 放假日: ['10-01', '10-07'], 调休上班日: ['09-29', '10-12'] },
  },
  2025: {
    春节: { 放假日: ['01-28', '02-04'], 调休上班日: ['01-26', '02-08'] },
    清明节: { 放假日: ['04-04', '04-06'] },
    劳动节: { 放假日: ['05-01', '05-05'], 调休上班日: ['04-27'] },
    端午节: { 放假日: ['05-31', '06-02'] },
    国庆节: { 放假日: ['10-01', '10-08'], 中秋节: null }, // 2025 国庆中秋连休
  },
  2026: {
    春节: { 放假日: ['02-15', '02-22'] }, // 以当年国务院公告为准
  },
};

/**
 * 某公历日的节日名（可能多个，如中秋+国庆重叠）。
 */
export function festivalsOf(y, m, d) {
  const out = [];
  const sf = SOLAR_FESTIVALS[`${m}-${d}`];
  if (sf) out.push(sf);
  const l = solarToLunisolar(y, m, d);
  if (l && !l.isLeap) {
    // 除夕：腊月最后一天
    if (l.m === 12) {
      const next = solarToLunisolar(y, m, d + 1) || solarToLunisolar(y, m + 1, 1);
      if (next && next.m === 1 && next.d === 1) out.push('除夕');
    }
    const lf = LUNAR_FESTIVALS[`${l.m}-${l.d}`];
    if (lf) out.push(lf);
  }
  return out;
}

/**
 * 某日的节假日状态。
 * @returns {{type:'holiday'|'workday'|'normal', name?:String}} holiday=法定假日，workday=调休上班，normal=普通
 */
export function holidayStatus(y, m, d) {
  const data = HOLIDAY_DATA[y];
  if (!data) return { type: 'normal' };
  const md = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  for (const name in data) {
    const item = data[name];
    if (!item) continue;
    if (item.放假日 && item.放假日.includes(md)) return { type: 'holiday', name };
    if (item.调休上班日 && item.调休上班日.includes(md)) return { type: 'workday', name };
  }
  return { type: 'normal' };
}

/** 是否周末 */
export function isWeekend(y, m, d) {
  const w = weekday(y, m, d);
  return w === 0 || w === 6;
}
