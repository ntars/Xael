/**
 * src/core/almanac/daily.js —— 黄历每日全量（自研，零依赖）
 *
 * 大白话：把前面所有部件（干支/建除/黄黑道/二十八宿/方位/冲煞/吉凶神/节日）
 * 拼成一张完整黄历。宜忌采用库外《玉匣记》系通书逐日条目表（见 yiji.js）：
 *   以「六十甲子日 × 十二月」为索引查表得 宜/忌 与 吉神宜趋/凶煞宜忌，
 *   另以建除/黄黑道做参考注记（值星、天神字段单列）。
 * 数据为公版古籍条目；查表算法参考声明见 NOTICE 与 settings.js DEPS。
 */

import { pad2 } from '../calendar/julian.js';
import { solarToLunisolar } from '../calendar/lunisolar.js';
import { LUNAR_MONTH_NAMES, LUNAR_DAY_NAMES } from '../calendar/lunisolar.js';

/** 农历完整描述：如「甲辰年腊月廿一」 */
export function lunarTextFull(y, m, d) {
  const l = solarToLunisolar(y, m, d);
  if (!l) return '';
  // 注：solarToLunisolar().d 是 1 起日号，数组须取 d-1（直接取 d 会整体错一位）
  return `${l.y}年${l.isLeap ? '闰' : ''}${LUNAR_MONTH_NAMES[l.m - 1]}月${LUNAR_DAY_NAMES[l.d - 1]}`;
}
import { daySexagenary, yearSexagenary, monthSexagenary, hourSexagenary, monthBranchIndex } from '../calendar/sexagenary.js';
import { solarTermsTable } from '../calendar/solar-terms.js';
import { festivalsOf, holidayStatus, isWeekend } from '../calendar/festivals.js';
import { weekday } from '../calendar/julian.js';
import { criticalDaysOf } from './critical-days.js';

/** 星期几：0=日 … 6=六 → 「星期日」…「星期六」 */
function weekdayText(y, m, d) {
  return '星期' + '日一二三四五六'[weekday(y, m, d)];
}
import { jianchuOf, jianchuStackOf, JIANCHU_MEANING, JIANCHU_LUCK, JIANCHU_ALIAS, jianchuAliasOf, jianchuAliasesOf, JIANCHU_SOURCE_YIJI } from './twelve-officers.js';
import { tianshenOf, TIANSHEN_MEANING } from './day-officers.js';
import { xiu28Of } from './lunar-mansions.js';
import { positionOf } from './directions.js';
import { chongshaOf } from './clashes.js';
import { dayYiJi, dayJiXiongSha } from './activities.js';
import { godsByRule, RULE_GODS } from './auspicious-rules.js';
import { STEMS, BRANCHES } from '../common/constants.js';

/** 黄历日主入口 */
export function almanacDaily(y, m, d, hour = null) {
  const lunar = solarToLunisolar(y, m, d);
  const gz = daySexagenary(y, m, d);
  const jc = jianchuOf(y, m, d);
  const ts = tianshenOf(y, m, d);
  const pos = positionOf(y, m, d);
  const cs = chongshaOf(y, m, d);
  const fest = festivalsOf(y, m, d);
  const holiday = holidayStatus(y, m, d);

  // 黄历的两套月柱口径（与参考实现逐字一致，别把两者合并）：
  //   ① 展示用的「月干支」走精确交节：按当日 0 时判定，交节时刻未到仍算旧月；
  //   ② 宜忌 / 吉凶神查表走「整日粒度」：交节当日整天已算新月。
  const monthGz = monthSexagenary(y, m, d, 0);
  const wholeMonthGz = monthSexagenary(y, m, d); // 不传时辰 = 当日内已过交节
  const yj = dayYiJi(wholeMonthGz, gz);
  // 吉凶神查表要「月支序号」（0=寅起算），不是月支字
  const jxs = dayJiXiongSha(monthBranchIndex(y, m, d), gz);
  // 历例复算（《协纪辨方书·义例》）：只覆盖有明确起例的神，用于并列校验通书表
  const byRule = godsByRule(BRANCHES[monthBranchIndex(y, m, d)].z, gz);
  const yi = yj.宜;
  const ji = yj.忌;

  return {
    solar: `${y}-${pad2(m)}-${pad2(d)}`,
    weekday: weekdayText(y, m, d),
    isWeekend: isWeekend(y, m, d),
    lunar: lunarTextFull(y, m, d),
    ganzhi: {
      年: yearSexagenary(y, m, d),
      月: monthGz,
      日: gz,
      时: hour != null ? hourSexagenary(gz[0], hour) : null,
    },
    值星: {
      name: jc,
      义理: JIANCHU_MEANING[jc],
      原文宜忌: JIANCHU_SOURCE_YIJI[jc] || null,
      吉凶: JIANCHU_LUCK[jc],
      // 同位异名（《协纪辨方书·卷七·义例四·建除十二神》）：黄历吉凶神里同名同实的那批神
      别名: jianchuAliasesOf(jc, monthBranchIndex(y, m, d), BRANCHES.findIndex((b) => b.z === gz[1])),
      ...(jianchuAliasOf(jc, monthBranchIndex(y, m, d)) ? { 当月别名: jianchuAliasOf(jc, monthBranchIndex(y, m, d)) } : {}),
      // 交节日「叠两值日」（《协纪辨方书·卷七·义例四》引历书）：旧月建与新月的值星当日同时当值
      ...(jianchuStackOf(y, m, d).length > 1 ? { 叠值: jianchuStackOf(y, m, d) } : {}),
    },
    天神: ts.天神, 天神类: ts.类, 天神吉凶: ts.吉凶, 天神断语: ts.断语 || TIANSHEN_MEANING[ts.天神] || '',
    ...(ts.别名 ? { 天神别名: ts.别名 } : {}),
    二十八宿: xiu28Of(y, m, d),
    方位: pos.方位,
    彭祖百忌: pos.彭祖百忌,
    胎神: pos.胎神,
    冲煞: cs,
    宜: [...new Set(yi)],
    忌: [...new Set(ji)],
    吉神宜趋: jxs.吉神宜趋,
    凶煞宜忌: jxs.凶煞宜忌,
    历例吉神: byRule.吉神,
    历例凶煞: byRule.凶煞,
    节日: fest,
    法定假期: holiday,
    特别忌: criticalDaysOf(y, m, d, gz[1], BRANCHES[monthBranchIndex(y, m, d)].z)
      // 月破日原书云「诸事不宜」，而库外通书表照旧列宜——两源不一致，把差异量化写进说明，
      //   免得读者以为表里的宜是原书的话
      .map((x) => (x.类 === '月破'
        ? { ...x, 说明: `${x.说明}（本日通书表仍列宜 ${yi.length} 项，与原书「诸事不宜」不一致，两源并见不合并）` }
        : x)),
    通例参考: '《钦定协纪辨方书》与《玉匣記》（通行本，2026-10-31 补入）两路并用——宜忌取《玉匣記》系通书逐日条目；天神黄黑道断语、建除义理、宿之五行与禽象引《协纪》原文；财神、福神方位依《玉匣記·財神方位歌》《玉匣記·福神方位歌》逐干对表；宿之吉凶与胎神表为通书通例，原书无载；彭祖百忌用通行本，底本异文另注',
  };
}

/** 月历视图：某月每日黄历摘要（宜/忌/冲） */
export function monthView(y, m) {
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out = [];
  for (let d = 1; d <= days; d++) {
    const r = almanacDaily(y, m, d);
    out.push({ solar: r.solar, lunar: r.lunar, 宜: r.宜.slice(0, 3), 忌: r.忌.slice(0, 3), 冲: r.冲煞.冲生肖, 值星: r.值星.name });
  }
  return out;
}

/** 节气相邻信息（上一/下一节气） */
export function jieqiAround(y, m, d) {
  const t = solarTermsTable(y);
  const target = `${y}-${pad2(m)}-${pad2(d)}`;
  let prev = null, next = null;
  for (const k in t) {
    const date = t[k].text; // solarTermsTable 值为 {y,m,d,hh,mm,text,time}
    if (date <= target) if (!prev || date > prev.date) prev = { name: k, date };
    if (date >= target) if (!next || date < next.date) next = { name: k, date };
  }
  return { prev, next };
}
