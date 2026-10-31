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

/** 四废日（协纪版）：春庚申辛酉、夏壬子癸亥、秋甲寅乙卯、冬丙午丁巳。
 *  依据《钦定协纪辨方书·四废》歷例：「四废者四时衰谢之辰也，其日忌出军征伐、造舍、迎亲、
 *  封建拜官、纳财、开市」；曹震圭「四废者干支俱絶也」。
 *  ★ 与八字神煞（《三命通会》「冬丙午丁未」）一字之差（丁巳/丁未），两书各自成文，
 *  本仓不代为统一：黄历用协纪版，八字用三命通会版，两处各自注明。 */
const SI_FEI = {
  0: ['庚申', '辛酉'], 1: ['壬子', '癸亥'], 2: ['甲寅', '乙卯'], 3: ['丙午', '丁巳'],
};

/** 杨公忌日（农历月、日）：正月十三…十二月十九，共十三日。
 *  依据《玉匣記·楊公忌日》原文歌诀：「神仙留下十三日，舉動須防多損失……」
 *  ★ 底本「六月初二」，通行本多作「六月初三」（递减数列应为三），照录底本并注明异文。 */
const YANG_GONG_JI = [[1,13],[2,11],[3,9],[4,7],[5,5],[6,2],[7,1],[7,29],[8,27],[9,25],[10,23],[11,21],[12,19]];

/** 探病忌日：六干支日。依据《玉匣記·探病忌日》「壬寅壬午連庚午，甲寅乙卯己卯妨，
 *  神仙留下此六日，探人疾病替人亡」。 */
const TAN_BING = ['壬寅', '壬午', '庚午', '甲寅', '乙卯', '己卯'];

/** 大明吉日：二十一日。依据《玉匣記·大明吉日》「此二十一日，乃天地開通、太陽所照之辰，
 *  百事用之大吉」。与「诸事不宜」类日子同日出现时两说并列（如四离日恰逢大明吉日）。 */
const DA_MING = ['辛未','壬申','癸酉','丁丑','乙卯','壬午','甲申','丁亥','壬辰','乙未','壬寅','甲辰','乙巳','丙午','己酉','庚戌','辛亥','丙辰','己未','庚申','辛酉'];

const gzStr = (gz) => (Array.isArray(gz) ? gz.join('') : String(gz));

/** 四废判定：按季节（春=寅卯辰月支序 0,1,2 …）取日干支 */
export function siFeiOf(dayGz, monthZhiIdx) {
  const season = monthZhiIdx == null ? null : Math.floor(((monthZhiIdx - 2 + 12) % 12) / 3); // 寅月起 0春1夏2秋3冬
  if (season == null || !SI_FEI[season]) return null;
  if (!SI_FEI[season].includes(gzStr(dayGz))) return null;
  const names = ['春', '夏', '秋', '冬'];
  return {
    类: '四废',
    说明: `${names[season]}季四废日（${SI_FEI[season].join('、')}）。原书「四废者四时衰谢之辰也」，其日忌出军征伐、造舍、迎亲、封建拜官、纳财、开市；曹震圭「干支俱絶也」。与八字神煞版（《三命通会》冬作丙午丁未）一字之差，两书并列。`,
    依据: '《钦定协纪辨方书·四废》',
  };
}

/** 杨公忌日判定（按农历月、日） */
export function yangGongJiOf(lunar) {
  if (!lunar || !lunar.y || !lunar.m || !lunar.d) return null;
  const hit = YANG_GONG_JI.some(([mm, dd]) => mm === lunar.m && dd === lunar.d && !lunar.isLeap);
  if (!hit) return null;
  return {
    类: '杨公忌日',
    说明: `农历${lunar.isLeap ? '闰' : ''}${lunar.m}月${lunar.d}日为杨公忌（十三日之一），原文「神仙留下十三日，舉動須防多損失」，百事忌。底本六月初二、通行本作初三，照录底本并注异文。`,
    依据: '《玉匣記·楊公忌日》',
  };
}

/** 探病忌日判定 */
export function tanBingJiOf(dayGz) {
  if (!TAN_BING.includes(gzStr(dayGz))) return null;
  return {
    类: '探病忌日',
    说明: '壬寅、壬午、庚午、甲寅、乙卯、己卯六日探病忌，原文「神仙留下此六日，探人疾病替人亡」',
    依据: '《玉匣記·探病忌日》',
  };
}

/** 大明吉日判定 */
export function daMingJiOf(dayGz) {
  if (!DA_MING.includes(gzStr(dayGz))) return null;
  return {
    类: '大明吉日',
    说明: '二十一日之一，原文「乃天地開通、太陽所照之辰，百事用之大吉」。与「诸事不宜」类日子同日出现时两说并列，不合并',
    依据: '《玉匣記·大明吉日》',
  };
}

/** 四种合并：返回命中的条目数组（可能为空） */
export function criticalDaysOf(y, m, d, dayZhi, monthZhi, lunar = null, dayGzFull = null) {
  const out = [];
  const a = siLiSiJueOf(y, m, d);
  if (a) out.push(a);
  const b = yueJiOf(d);
  if (b) out.push(b);
  const c = monthBreakOf(dayZhi, monthZhi);
  if (c) out.push(c);
  const f = dayGzFull ? siFeiOf(dayGzFull, monthZhi) : null;
  if (f) out.push(f);
  const g = yangGongJiOf(lunar);
  if (g) out.push(g);
  const h = dayGzFull ? tanBingJiOf(dayGzFull) : null;
  if (h) out.push(h);
  const k = dayGzFull ? daMingJiOf(dayGzFull) : null;
  if (k) out.push(k);
  return out;
}
