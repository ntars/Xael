/**
 * src/core/features/text/bazi.js —— 八字相关功能的文本出料
 *
 * 覆盖 4 项：八字完整排盘（排八字）· 八字运程（排运程）· 格局喜用（解格局）· 神煞全表（查神煞）。
 * 各函数返回旧版同款多行文本，首行【标题】，行内不出现中文分号。
 */

import { chart as baziChart } from '../../bazi/bazi.js';
import { dayunOf } from '../../bazi/dayun.js';
import { patternOf } from '../../bazi/pattern.js';
import { shenshaOf } from '../../bazi/shensha.js';
import { GANZHI60, tidy } from '../text.js';

/* ------------------------------------------------------------------ *
 * 一、八字完整排盘（排八字）
 * ------------------------------------------------------------------ */

/**
 * @param {Object} ent 生辰实体 {date:{year,month,day}, time:{hour,minute}, gender:'male'|'female', name}
 * @returns {{text?:string, prompt?:string}}
 */
export function baziText(ent) {
  if (!ent || !ent.date || !ent.date.year) {
    return { prompt: '八字排盘需要出生年月日，例如「白玖玖，女，2005年6月9日」（可含时辰）。' };
  }
  if (!ent.date.month || !ent.date.day) {
    return { prompt: '排盘需要完整的出生年月日，请补充，例如「白玖玖，女，2005年6月9日子时」。' };
  }
  const g = zhGender(ent);
  if (!g) return { prompt: '排盘需出生性别（男/女），请补充，例如「白玖玖，女，2005年6月9日子时」。' };

  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const i = (ent.time && ent.time.minute) || 0;
  const name = ent.name || '命主';
  const c = baziChart({ y, m, d, h, i, gender: g, name });
  const P = c.pillars;

  const L = [];
  L.push('【八字排盘】' + name + '（' + g + '）' + y + '年' + m + '月' + d + '日' + h + '时，' + c.lunar + '。');
  L.push('年柱：' + P.年.干支 + '（' + P.年.干 + '）');
  L.push('月柱：' + P.月.干支 + '（' + P.月.干 + '）');
  L.push('日柱：' + P.日.干支 + '（' + P.日.干 + '·日主）');
  L.push('时柱：' + P.时.干支 + '（' + P.时.干 + '）');
  L.push('藏干：年' + P.年.藏干.join('') + ' 月' + P.月.藏干.join('') + ' 日' + P.日.藏干.join('') + ' 时' + P.时.藏干.join('') + '。');
  L.push('十神：年' + P.年.十神 + ' 月' + P.月.十神 + ' 时' + P.时.十神 + '（日主' + c.日主.干 + '·' + c.日主.五行 + '）。');
  // 十二长生：星运=日主对各柱地支，自坐=各柱天干坐本地支
  L.push('十二长生：星运 ' + [P.年.星运, P.月.星运, P.日.星运, P.时.星运].join(' ')
    + '；自坐 ' + [P.年.自坐, P.月.自坐, P.日.自坐, P.时.自坐].join(' ') + '（年/月/日/时）。');
  L.push('纳音：' + P.年.纳音 + ' ' + P.月.纳音 + ' ' + P.日.纳音 + ' ' + P.时.纳音
    + '；胎元' + c.胎元 + ' 旬空' + [P.年.旬空.join(''), P.月.旬空.join(''), P.日.旬空.join(''), P.时.旬空.join('')].join('/') + '。');
  L.push('五行：' + ['木', '火', '土', '金', '水']
    .map((wx) => wx + c.五行.统计[wx] + '个（' + c.五行.百分比[wx] + '%）').join('，')
    + '，' + (c.五行.缺.length ? c.五行.缺文本 : '五行不缺') + '。');
  L.push('换日口径：' + c.换日口径 + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、八字运程（排运程）
 * ------------------------------------------------------------------ */

export function dayunText(ent, text) {
  if (!ent || !ent.date || !ent.date.year) return { prompt: '推运程需要出生年月日，例如「1990年8月1日」。' };
  if (!ent.date.month || !ent.date.day) return { prompt: '推运程需要完整的出生年月日，请补充，例如「1990年8月1日」。' };
  const g = zhGender(ent);
  if (!g) return { prompt: '推运程需出生性别（男/女，定顺逆），请补充。' };

  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const c = baziChart({ y, m, d, h, i: (ent.time && ent.time.minute) || 0, gender: g, name: ent.name || '命主' });
  const P = c.pillars;
  const dm = c.日主.干;
  const dy = dayunOf({ y, m, d, h, gender: g }, 8);

  const L = [];
  L.push('【八字运程】' + P.年.干支 + '年 ' + P.月.干支 + '月 ' + P.日.干支 + '日 ' + P.时.干支 + '时，日主' + dm
    + '（' + c.日主.五行 + '），' + g + '命，' + dy.排法 + '，' + dy.起运.说明 + '，' + dy.起运.岁 + '岁' + dy.起运.月 + '个月起运。');
  L.push('大运：' + dy.大运.map((x) => x.干支.join('') + '（' + x.起始年龄 + '岁起·' + x.起始年份 + '–' + x.结束年份 + '）').join('、') + '。');

  // 流年：默认从今年起十年，附对日主的十神
  const t = String(text || '');
  const py = pullYear(t);
  const y0 = (py && (py !== y || /流年|流月|流日/.test(t))) ? py : new Date().getFullYear();
  const ln = [];
  for (let k = 0; k < 10; k++) {
    const yy = y0 + k;
    const gz = GANZHI60[((yy - 4) % 60 + 60) % 60];
    ln.push(yy + '『' + gz + '』');
  }
  L.push('流年（' + y0 + ' 起十年）：' + ln.join('、') + '。');
  L.push('口径：大运起于月柱，阳男阴女顺排、阴男阳女逆排，一位十年，以立春换柱。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 三、格局喜用（解格局）
 * ------------------------------------------------------------------ */

export function patternText(ent) {
  if (!ent || !ent.date || !ent.date.year) return { prompt: '看格局需要出生年月日，例如「1990年8月15日14时 看格局」（时辰缺失按 14 时补）。' };
  if (!ent.date.month || !ent.date.day) return { prompt: '看格局需要完整的出生年月日，请补充，例如「1990年8月15日14时 看格局」。' };

  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const g = zhGender(ent) || '男';
  const r = patternOf({ y, m, d, h, i: (ent.time && ent.time.minute) || 0, gender: g });

  const L = [];
  L.push('【八字格局·用神】' + (ent.name || '命主') + '（' + g + '）' + y + '年' + m + '月' + d + '日' + h + '时。');
  L.push('日主：' + r.日主 + '，月令：' + r.月令 + '（藏干' + String(r.月令藏干) + '，本气十神' + r.月令十神 + '）。');
  L.push('格局：' + r.格局 + '。');
  L.push('依据：' + tidy(r.依据) + '。');
  L.push('强弱：' + tidy(r.强弱) + '（评分 ' + r.评分 + '）。');
  L.push('用神参考：' + String(r.说明 || '').replace(/。+$/, '') + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 四、神煞全表（查神煞）
 * ------------------------------------------------------------------ */

export function shenshaText(ent) {
  if (!ent || !ent.date || !ent.date.year || !ent.date.month || !ent.date.day) {
    return { prompt: '神煞需出生年月日时，例如「1990年8月15日14时 八字神煞」。' };
  }
  const h = ent.time && ent.time.hour != null ? ent.time.hour : null;
  if (h == null) return { prompt: '神煞须给时辰（时柱决定半数神煞落位），例如「1990年8月15日14时 八字神煞」。' };

  const r = shenshaOf({
    y: ent.date.year, m: ent.date.month, d: ent.date.day, h,
    i: (ent.time && ent.time.minute) || 0, gender: ent.gender,
  });

  const L = [];
  L.push('【八字·神煞】' + r.四柱 + '。');
  if (r.神煞.length) {
    r.神煞.forEach((x) => {
      L.push(x.名 + '：在' + x.位 + '——' + x.取法 + '。');
    });
  } else {
    L.push('本盘常用神煞皆未落柱。');
  }
  L.push('标注：' + tidy(r.说明) + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 公共小件
 * ------------------------------------------------------------------ */

/** 实体性别 → 中文（无则 null） */
export function zhGender(ent) {
  const g = ent && ent.gender;
  return g === 'female' ? '女' : g === 'male' ? '男' : null;
}

/** 从文本里抓四位年份（流年起点的显式声明用） */
export function pullYear(text) {
  const m = String(text || '').match(/(19|20)\d{2}/);
  return m ? +m[0] : 0;
}
