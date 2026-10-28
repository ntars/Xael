/**
 * src/core/huangli/daily.js —— 黄历每日全量（自研，零依赖）
 *
 * 大白话：把前面所有部件（干支/建除/黄黑道/二十八宿/方位/冲煞/吉凶神/节日）
 * 拼成一张完整黄历。宜忌采用《玉匣记》系通书逐日条目表（见 yiji.js）：
 *   以「六十甲子日 × 十二月」为索引查表得 宜/忌 与 吉神宜趋/凶煞宜忌，
 *   另以建除/黄黑道做参考注记（值星、天神字段单列）。
 * 数据为公版古籍条目；查表算法参考声明见 NOTICE 与 settings.js DEPS。
 */

import { pad2 } from '../calendar/solar.js';
import { solarToLunar } from '../calendar/lunar2.js';
import { LUNAR_MONTH_NAMES, LUNAR_DAY_NAMES } from '../calendar/lunar2.js';

/** 农历完整描述：如「甲辰年腊月廿一」 */
export function lunarTextFull(y, m, d) {
  const l = solarToLunar(y, m, d);
  if (!l) return '';
  // 注：solarToLunar().d 是 1 起日号，数组须取 d-1（旧实现此处差一位，已修）
  return `${l.y}年${l.isLeap ? '闰' : ''}${LUNAR_MONTH_NAMES[l.m - 1]}月${LUNAR_DAY_NAMES[l.d - 1]}`;
}
import { dayGanZhi, yearGanZhiByLichun, monthGanZhi, hourGanZhi, monthZhiIndex } from '../calendar/ganzhi.js';
import { jieqiTable } from '../calendar/jieqi2.js';
import { festivalsOf, holidayStatus, isWeekend } from '../calendar/festival.js';
import { weekday } from '../calendar/solar.js';

/** 星期几：0=日 … 6=六 → 「星期日」…「星期六」 */
function weekdayText(y, m, d) {
  return '星期' + '日一二三四五六'[weekday(y, m, d)];
}
import { jianchuOf, JIANCHU_MEANING, JIANCHU_LUCK } from './jianchu.js';
import { tianshenOf, TIANSHEN_MEANING } from './tianshen.js';
import { xiu28Of } from './xiu28.js';
import { positionOf } from './position.js';
import { chongshaOf } from './chongsha.js';
import { jishenOf } from './jishen.js';
import { dayYiJi, dayJiXiongSha } from './yiji.js';
import { GAN, ZHI } from '../common/constants.js';

/** 建除 → 宜忌大类映射（通例） */
const JC_YI = {
  建: ['出行', '上任', '会友'], 除: ['沐浴', '扫舍', '求医', '祭祀'],
  满: ['祭祀', '祈福', '开市'], 平: ['修造', '修饰垣墙'], 定: ['订婚', '纳采', '安床'],
  执: ['捕捉', '结网'], 破: ['破屋', '坏垣', '拆卸'], 危: ['安床', '祭祀'],
  成: ['结婚', '开市', '入学', '安葬'], 收: ['纳财', '收账'], 开: ['开业', '出行', '搬家'], 闭: ['安葬', '补垣'],
};
const JC_JI = {
  建: ['动土', '开仓'], 除: ['结婚', '赴任'], 满: ['服药', '上任'], 平: ['词讼'],
  定: ['词讼', '出行'], 执: ['搬迁', '开市'], 破: ['嫁娶', '开市', '出行'], 危: ['登高', '行船'],
  成: ['词讼'], 收: ['安葬', '开市'], 开: ['安葬'], 闭: ['开市', '出行', '搬迁'],
};

/** 凶煞禁项 */
const XIONG_BAN = {
  月破: ['诸事不宜（日破大凶）'], 受死: ['嫁娶', '安葬'],
};

/** 黄历日主入口 */
export function daily(y, m, d, hour = null) {
  const lunar = solarToLunar(y, m, d);
  const gz = dayGanZhi(y, m, d);
  const jc = jianchuOf(y, m, d);
  const ts = tianshenOf(y, m, d);
  const pos = positionOf(y, m, d);
  const cs = chongshaOf(y, m, d);
  const js = jishenOf(y, m, d);
  const fest = festivalsOf(y, m, d);
  const holiday = holidayStatus(y, m, d);

  // 黄历的两套月柱口径（与参考实现逐字一致，别把两者合并）：
  //   ① 展示用的「月干支」走精确交节：按当日 0 时判定，交节时刻未到仍算旧月；
  //   ② 宜忌 / 吉凶神查表走「整日粒度」：交节当日整天已算新月。
  const monthGz = monthGanZhi(y, m, d, 0);
  const wholeMonthGz = monthGanZhi(y, m, d); // 不传时辰 = 当日内已过交节
  const yj = dayYiJi(wholeMonthGz, gz);
  // 吉凶神查表要「月支序号」（0=寅起算），不是月支字
  const jxs = dayJiXiongSha(monthZhiIndex(y, m, d), gz);
  const yi = yj.宜;
  const ji = yj.忌;

  return {
    solar: `${y}-${pad2(m)}-${pad2(d)}`,
    weekday: weekdayText(y, m, d),
    isWeekend: isWeekend(y, m, d),
    lunar: lunarTextFull(y, m, d),
    ganzhi: {
      年: yearGanZhiByLichun(y, m, d),
      月: monthGz,
      日: gz,
      时: hour != null ? hourGanZhi(gz[0], hour) : null,
    },
    值星: { 名: jc, 义理: JIANCHU_MEANING[jc], 吉凶: JIANCHU_LUCK[jc] },
    天神: ts.天神, 天神类: ts.类, 天神吉凶: ts.吉凶, 天神断语: ts.断语 || TIANSHEN_MEANING[ts.天神] || '',
    二十八宿: xiu28Of(y, m, d),
    方位: pos.方位,
    彭祖百忌: pos.彭祖百忌,
    胎神: pos.胎神,
    冲煞: cs,
    宜: [...new Set(yi)],
    忌: [...new Set(ji)],
    吉神宜趋: jxs.吉神宜趋,
    凶煞宜忌: jxs.凶煞宜忌,
    节日: fest,
    法定假期: holiday,
    通例参考: '《协纪辨方书》《玉匣记》通例，断语为自研文案；宜忌为规则推导，与商业逐日宜忌库覆盖或有出入',
  };
}

/** 月历视图：某月每日黄历摘要（宜/忌/冲） */
export function monthView(y, m) {
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out = [];
  for (let d = 1; d <= days; d++) {
    const r = daily(y, m, d);
    out.push({ solar: r.solar, lunar: r.lunar, 宜: r.宜.slice(0, 3), 忌: r.忌.slice(0, 3), 冲: r.冲煞.冲生肖, 值星: r.值星.名 });
  }
  return out;
}

/** 节气相邻信息（上一/下一节气） */
export function jieqiAround(y, m, d) {
  const t = jieqiTable(y);
  const target = `${y}-${pad2(m)}-${pad2(d)}`;
  let prev = null, next = null;
  for (const k in t) {
    const date = t[k].text; // jieqiTable 值为 {y,m,d,hh,mm,text,time}
    if (date <= target) if (!prev || date > prev.date) prev = { name: k, date };
    if (date >= target) if (!next || date < next.date) next = { name: k, date };
  }
  return { prev, next };
}
