/**
 * src/core/features/text/fengshui.js —— 风水与历法查询的文本出料
 *
 * 覆盖 5 项：九宫飞星（排飞星）· 八宅命卦（查命卦）· 每日黄历（查黄历）·
 *            万年历日期换算（查农历）。
 */

import { feixingChart } from '../../fengshui/feixing.js';
import { bazhaiChart } from '../../fengshui/bazhai.js';
import { daily } from '../../huangli/daily.js';
import { solarToLunar } from '../../calendar/lunar2.js';
import {
  dayGanZhi, yearGanZhiByLichun, monthGanZhi, hourGanZhi, zodiacByLichun,
} from '../../calendar/ganzhi.js';
import { jieqiTable } from '../../calendar/jieqi2.js';
import { tidy } from '../text.js';

/** 洛书九宫铺法：巽四 离九 坤二 / 震三 中五 兑七 / 艮八 坎一 乾六 */
const LUOSHU = [4, 9, 2, 3, 5, 7, 8, 1, 6];

/* ------------------------------------------------------------------ *
 * 一、九宫飞星（排飞星）
 * ------------------------------------------------------------------ */

export function feixingText(ent) {
  const d = ent && ent.date;
  const y = d && d.year ? d.year : new Date().getFullYear();
  const m = d && d.month ? d.month : new Date().getMonth() + 1;
  const dd = d && d.day ? d.day : new Date().getDate();
  const h = ent && ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const c = feixingChart({ y, m, d: dd, h });

  const L = [];
  L.push('【九宫飞星】' + y + '年' + m + '月' + dd + '日' + h + '时，' + c.三元九运.星 + '运（' + c.三元九运.年份 + '）。');
  L.push('年紫白：' + c.年紫白.入中 + '入中；月紫白：' + c.月紫白.入中 + '入中；日紫白：' + c.日紫白.入中
    + '入中；时紫白：' + c.时紫白.入中 + '入中。');
  L.push('年盘：' + c.年紫白.盘 + '（巽四/离九/坤二 · 震三/中五/兑七 · 艮八/坎一/乾六）。');
  L.push('月盘：' + c.月紫白.盘 + '。');
  L.push('日盘：' + c.日紫白.盘 + '。');
  L.push('时盘：' + c.时紫白.盘 + '。');
  L.push('口径：' + tidy(c.口径) + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、八宅命卦（查命卦）
 * ------------------------------------------------------------------ */

export function bazhaiText(ent) {
  const d = ent && ent.date;
  if (!d || !d.year) return { prompt: '查命卦需要出生年份与性别，例如「1990年 男 查命卦」。' };
  const g = ent.gender === 'female' ? 'female' : ent.gender === 'male' ? 'male' : null;
  if (!g) return { prompt: '八宅命卦分男女两路推算，请补「男」或「女」，例如「1990年 男 查命卦」。' };
  const c = bazhaiChart({ y: d.year, m: d.month || 6, d: d.day || 15, gender: g });
  const zh = g === 'female' ? '女' : '男';

  const L = [];
  L.push('【八宅命卦】' + c.出生年 + '年生' + zh + '命，命卦「' + c.命卦 + '」，' + c.东西四命 + '。');
  const ji = c.八方.filter((x) => x.吉凶.indexOf('吉') >= 0);
  const xiong = c.八方.filter((x) => x.吉凶.indexOf('凶') >= 0);
  L.push('四吉方：' + ji.map((x) => x.星 + x.方位 + '（' + x.五行 + '·' + x.吉凶 + '）').join('、') + '。');
  L.push('四凶方：' + xiong.map((x) => x.星 + x.方位 + '（' + x.五行 + '·' + x.吉凶 + '）').join('、') + '。');
  L.push('八方全表：' + c.八方.map((x) => x.方位 + x.星 + '/' + x.卦).join('，') + '。');
  L.push('口径：' + tidy(c.口径) + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 三、每日黄历（查黄历）
 * ------------------------------------------------------------------ */

export function huangliText(ent) {
  const d = ent && ent.date;
  const now = new Date();
  const y = d && d.year ? d.year : now.getFullYear();
  const m = d && d.month ? d.month : now.getMonth() + 1;
  const dd = d && d.day ? d.day : now.getDate();
  const h = ent && ent.time && ent.time.hour != null ? ent.time.hour : null;
  const r = daily(y, m, dd, h);
  const lu = solarToLunar(y, m, dd) || {};
  const lunarName = lu.monthName && lu.dayName ? lu.monthName + lu.dayName : r.lunar;

  const L = [];
  L.push('【黄历宜忌】' + y + '年' + m + '月' + dd + '日（' + r.weekday + '），农历' + lunarName + '。');
  L.push('干支：' + r.ganzhi.年 + '年 ' + r.ganzhi.月 + '月 ' + r.ganzhi.日 + '日' + (r.ganzhi.时 ? ' ' + r.ganzhi.时 + '时' : '') + '。');
  L.push('值日：' + r.值星.名 + '日（' + r.值星.吉凶 + '）——' + tidy(r.值星.义理));
  L.push('天神：' + r.天神 + '（' + r.天神类 + '·' + r.天神吉凶 + '）——' + tidy(r.天神断语));
  L.push('二十八宿：' + r.二十八宿.宿 + '宿（' + r.二十八宿.五行 + '·' + r.二十八宿.吉凶 + '·' + r.二十八宿.动物 + '）。');
  L.push('宜：' + (r.宜.length ? r.宜.join('、') : '无') + '。');
  L.push('忌：' + (r.忌.length ? r.忌.join('、') : '无') + '。');
  if (r.吉神宜趋.length) L.push('吉神宜趋：' + r.吉神宜趋.join('、') + '。');
  if (r.凶煞宜忌.length) L.push('凶煞宜忌：' + r.凶煞宜忌.join('、') + '。');
  L.push('彭祖百忌：' + r.彭祖百忌.干 + '，' + r.彭祖百忌.支 + '。');
  L.push('胎神：' + r.胎神 + '；冲' + r.冲煞.冲 + '（属' + r.冲煞.冲生肖 + '）煞' + r.冲煞.煞方 + '。');
  L.push('方位：喜神' + r.方位.喜神 + '，财神' + r.方位.财神 + '，福神' + r.方位.福神 + '，阳贵' + r.方位.阳贵 + '，阴贵' + r.方位.阴贵 + '。');
  if (r.节日.length) L.push('节日：' + r.节日.join('、') + '。');
  if (r.法定假期 && r.法定假期.name) L.push('假期：' + r.法定假期.name + (r.法定假期.type === 'holiday' ? '（休）' : r.法定假期.type === 'work' ? '（班）' : '') + '。');
  L.push('口径：' + tidy(r.通例参考) + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 四、万年历日期换算（查农历）
 * ------------------------------------------------------------------ */

export function dateConvertText(ent) {
  const d = ent && ent.date;
  if (!d || !d.year || !d.month || !d.day) return { prompt: '查农历需要年月日，例如「2026年10月27日 查农历」。' };
  const y = d.year;
  const m = d.month;
  const dd = d.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const lu = solarToLunar(y, m, dd);
  const gz = dayGanZhi(y, m, dd);
  const jq = jieqiTable(y);
  const names = Object.keys(jq).filter((k) => jq[k].m === m).sort((a, b) => jq[a].d - jq[b].d);
  const zi = zodiacByLichun(y, m, dd);

  const L = [];
  L.push('【万年历】' + y + '年' + m + '月' + dd + '日，农历' + lu.y + '年' + lu.text + (lu.isLeap ? '（闰月生）' : '') + '。');
  L.push('干支：' + yearGanZhiByLichun(y, m, dd) + '年 ' + monthGanZhi(y, m, dd) + '月 ' + gz + '日 '
    + hourGanZhi(gz[0], h) + '时（' + h + ' 时），生肖属' + zi + '。');
  if (names.length) {
    L.push('本月节气：' + names.map((k) => k + ' ' + jq[k].m + '月' + jq[k].d + '日' + jq[k].time).join('，') + '（东八区）。');
  }
  L.push('黄帝纪元参考：' + (y + 2697) + ' 年（通行纪年法，非官方纪年）。');
  L.push('年界：以立春交节时刻换年，月界以节气换月，日以子初（23 时）换日。');
  return { text: L.join('\n') };
}
