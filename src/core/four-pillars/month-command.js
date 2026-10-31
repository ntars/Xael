/**
 * 月令司令（人元司事当值）
 *
 * 依据：《三命通会·论人元司事》逐月日数表——
 *   「正月寅【立春雨水】已土七日、丙火五日、甲木十八日；二月卯【惊蛰春分】乙十八日、甲九日、癸三日；
 *     三月辰【清明谷雨】戊十八日、乙九日、癸三日；四月巳【立夏小满】丙十八日、戊七日、庚五日；
 *     五月午【芒种夏至】丁十八日、丙九日、乙三日；六月未【小暑大暑】己十八日、乙五日、丁七日；
 *     七月申【立秋处暑】庚十七日、己七日、戊三日、壬三日；八月酉【白露秋分】辛二十日、庚七日、丁五日；
 *     九月戌【寒露霜降】戊十八日、辛七日、丁五日；十月亥【立冬小雪】壬十八日、甲五日、戊七日；
 *     十一月子【大雪冬至】癸十八日、壬五日、辛三日；十二月丑【小寒大寒】己十八日、癸七日、辛五日。」
 *
 * 大白话：一个月里不是所有藏干同时当家，而是按日子分段轮值——这段日子谁「用事」，
 * 谁就是当月的司令之神。子平取格先看司令之神透不透干，比只看「本气」细一档。
 *
 * 底本三处日数不自洽，已照录不改、并在结果里标出：
 *   · 四月巳 18+7+5＝30 ✓；七月申 17+7+3+3＝30 ✓；九月戌 30 ✓；十二月丑 30 ✓；
 *   · 八月酉 20+7+5＝32（多 2 日）、十一月子 18+5+3＝26（少 4 日）——底本传抄之差。
 *   故本模块以「累计日数」为准：越过累计上限即归末位司令，不按比例摊平（不造数据）。
 *
 * 另：正月寅底本作「已土」，同篇开篇又作「寅中有艮土用事」——艮土即戊土。
 * 本模块照录底本表字（己），并在输出的「底本字」里注明这一处异文。
 *
 * 相关模块：four-pillars/chart.js（提供四柱与换日口径）、calendar/solar-terms.js（定节气时刻）。
 */
import { monthBranchIndex } from '../calendar/sexagenary.js';
import { prevSolarTermAt, JIE_ONLY } from '../calendar/solar-terms.js';
import { BRANCHES } from '../common/constants.js';

/** 逐月司令日数表：支 → [[干, 日数], …]（顺序即当月轮值先后，照录底本） */
export const COMMAND_TABLE = {
  寅: [['己', 7], ['丙', 5], ['甲', 18]],
  卯: [['乙', 18], ['甲', 9], ['癸', 3]],
  辰: [['戊', 18], ['乙', 9], ['癸', 3]],
  巳: [['丙', 18], ['戊', 7], ['庚', 5]],
  午: [['丁', 18], ['丙', 9], ['乙', 3]],
  未: [['己', 18], ['乙', 5], ['丁', 7]],
  申: [['庚', 17], ['己', 7], ['戊', 3], ['壬', 3]],
  酉: [['辛', 20], ['庚', 7], ['丁', 5]],
  戌: [['戊', 18], ['辛', 7], ['丁', 5]],
  亥: [['壬', 18], ['甲', 5], ['戊', 7]],
  子: [['癸', 18], ['壬', 5], ['辛', 3]],
  丑: [['己', 18], ['癸', 7], ['辛', 5]],
};

/** 底本日数不自洽之处（供输出声明，不参与计算） */
export const COMMAND_NOTES = {
  寅: '底本作「已土七日」，同篇开篇又作「寅中有艮土用事」，艮土即戊土——底本异文照录。',
  酉: '底本三数合 32 日（多 2 日），传抄之差，照录不改。',
  子: '底本三数合 26 日（少 4 日），传抄之差，照录不改。',
};

/** 该月司令总日数（用于判越界） */
export function commandDaysOf(monthBranch) {
  return (COMMAND_TABLE[monthBranch] || []).reduce((a, [, n]) => a + n, 0);
}

/**
 * 求某日的月令司令之神。
 * @param {number} y 年 @param {number} m 月 @param {number} d 日
 * @param {number} [h] 时（缺省按当日 12 时） @param {number} [mi] 分
 * @returns {{月支:string, 司令:string, 节:string, 节后天数:number, 段:number, 段内日:number, 段日数:number, 口径:string}}
 */
export function monthCommandOf(y, m, d, h = 12, mi = 0) {
  const zhi = BRANCHES[monthBranchIndex(y, m, d, h, mi)].z;
  const rows = COMMAND_TABLE[zhi] || [];
  if (!rows.length) return null;
  // 只认十二「节」：月建以节为界，人元司事的日数从节起算（中气不换月）
  const jie = prevSolarTermAt(y, m, d, h, mi, JIE_ONLY);
  // 节后天数：按「节当日为第 1 日」计（底本「七日」「十八日」是含节当日的日数）
  const daysFromJie = jie ? dayGap(jie, y, m, d) + 1 : 1;
  let left = Math.max(1, daysFromJie);
  let 段 = 0;
  let 段内日 = left;
  for (let i = 0; i < rows.length; i += 1) {
    if (left <= rows[i][1]) { 段 = i; 段内日 = left; break; }
    left -= rows[i][1];
    段 = i;
    段内日 = rows[i][1];
  }
  const total = commandDaysOf(zhi);
  return {
    月支: zhi,
    司令: rows[段][0],
    节: jie ? jie.name : '',
    节后天数: daysFromJie,
    段: 段 + 1,
    段内日: 段内日,
    段日数: rows[段][1],
    口径: `月令${zhi}，${jie ? jie.name + '后第' + daysFromJie + '日，' : ''}第${段 + 1}段「${rows[段][0]}」用事（${rows[段][1]}日段内第${段内日}日）——《三命通会·论人元司事》`
      + (total !== 30 ? `；底本此月合 ${total} 日，传抄之差照录` : ''),
  };
}

/** 两个日期相差的天数（b 减 a，按北京日历日） */
function dayGap(a, y, m, d) {
  const ja = Date.UTC(a.y, a.m - 1, a.d);
  const jb = Date.UTC(y, m - 1, d);
  return Math.round((jb - ja) / 86400000);
}
