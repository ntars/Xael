/**
 * src/core/features/text/liuyao.js —— 六爻纳甲与梅花易数的文本出料
 *
 * 覆盖 3 项：六爻纳甲（排六爻）· 六爻旺衰进阶（解六爻旺衰）· 梅花易数（排梅花）。
 */

import { liuyaoChart } from '../../liuyao/liuyao.js';
import { wangshuaiOf } from '../../liuyao/wangshuai.js';
import { meihuaChart } from '../../meihua/meihua.js';
import { tidy } from '../text.js';

/** 爻符：阳 —，阴 -- */
const yaoMark = (y) => (y === '阳' ? '—' : '--');

/** 一爻一行的写法（自下而上） */
function yaoLine(x) {
  const flags = [x.世应, x.旬空 ? '空' : '', x.月破 ? '破' : '', x.日冲 ? '冲' : '', x.动爻 ? '动' : ''].filter(Boolean);
  return '  ' + x.位 + '爻 ' + yaoMark(x.阴阳) + ' ' + (x.纳甲 || '') + ' ' + (x.六亲 || '') + ' ' + (x.六神 || '')
    + (flags.length ? '【' + flags.join('/') + '】' : '');
}

/** 生辰实体 → 六爻入参（缺时辰按 14 时补，缺日按今天不行） */
function lqInput(ent) {
  const dep = ent && ent.date;
  if (!dep || !dep.year || !dep.month || !dep.day) return null;
  return { y: dep.year, m: dep.month, d: dep.day, h: ent.time && ent.time.hour != null ? ent.time.hour : 14 };
}

/* ------------------------------------------------------------------ *
 * 一、六爻纳甲（排六爻）
 * ------------------------------------------------------------------ */

export function liuyaoText(ent) {
  const inp = lqInput(ent);
  if (!inp) return { prompt: '六爻需要起卦时间（年月日时），例如「2026年10月27日14时 排六爻」。' };
  const c = liuyaoChart(inp);
  const B = c.本卦;

  const L = [];
  const bian = c.变卦;
  L.push('【六爻纳甲】' + inp.y + '年' + inp.m + '月' + inp.d + '日' + inp.h + '时起卦，'
    + c.干支.月 + '月 ' + c.干支.日.join('') + '日。');
  L.push('本卦「' + B.卦名 + '」' + (bian ? '→ 变卦「' + bian.卦名 + '」' : '（六爻安静，无变卦）')
    + '（' + B.宫 + '宫，' + B.五行 + '）。');
  L.push('动爻：' + (c.动爻 && c.动爻.length ? c.动爻.map((i) => '第' + i + '爻').join('，') : '无（静卦，以世爻为用）') + '。');
  L.push('六爻（自下而上）：');
  B.爻.forEach((x) => L.push(yaoLine(x)));
  if (bian) {
    L.push('变卦六爻（自下而上）：');
    bian.爻.forEach((x) => L.push(yaoLine(x)));
  }
  L.push('旬空：' + c.旬空 + '，月破：' + c.月破 + '。');
  L.push('纳甲口径：' + tidy(c.口径) + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、六爻旺衰进阶（解六爻旺衰）
 * ------------------------------------------------------------------ */

export function liuyaoWangshuaiText(ent) {
  const inp = lqInput(ent);
  if (!inp) return { prompt: '看旺衰需要起卦时间（年月日时），例如「2026年10月27日14时 解六爻旺衰」。' };
  const r = wangshuaiOf(inp);

  const L = [];
  L.push('【六爻旺衰】' + inp.y + '年' + inp.m + '月' + inp.d + '日' + inp.h + '时，' + (r.卦名 || '') + '。');
  L.push('月建 ' + r.月建 + '，日建 ' + r.日建 + '，' + r.六亲 + '。');
  (r.爻 || []).forEach((x) => {
    const bits = [x.月建关系, x.日建关系].filter((v, i, a) => v && a.indexOf(v) === i);
    L.push('第' + x.位 + '爻 ' + x.六亲 + x.纳甲 + '（' + x.五行 + '，' + x.世应 + '）：' + x.评级
      + '（得分 ' + x.得分 + '），' + bits.join('、') + (x.标记 && x.标记 !== '—' ? '，' + x.标记 : '') + '。');
  });
  L.push('刻度：得分按「月建日建生扶克泄」叠加，评级分旺、相、休、囚、死、空、破七档。');
  L.push('断法：' + tidy(r.说明));
  L.push('标注：六爻细则各家不一，本节只按「月建日辰定旺衰」的通行口径给提示，不作吉凶定论。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 三、梅花易数（排梅花）
 * ------------------------------------------------------------------ */

export function meihuaText(ent) {
  const inp = lqInput(ent);
  if (!inp) return { prompt: '梅花易数需起卦时间，例如「2026年10月27日14时 排梅花」（缺时辰按 14 时补）。' };
  const c = meihuaChart(inp);

  const L = [];
  L.push('【梅花易数】' + inp.y + '年' + inp.m + '月' + inp.d + '日' + inp.h + '时起卦（' + c.起卦 + '起卦）。');
  L.push('本卦「' + c.本卦.名 + '」（' + c.本卦.象名 + '，上' + c.本卦.上卦 + '下' + c.本卦.下卦 + '），动第 ' + c.动爻 + ' 爻。');
  L.push('互卦「' + c.互卦.名 + '」（' + c.互卦.象名 + '）。');
  L.push('变卦「' + c.变卦.名 + '」（' + c.变卦.象名 + '）。');
  L.push('体用：体' + c.体用.体 + '、用' + c.体用.用 + '，' + c.体用.生克 + '——' + c.体用.断 + '。');
  L.push('取象：上卦' + c.本卦.上卦 + '为外为事，下卦' + c.本卦.下卦 + '为内为己，动在' + c.动爻 + '爻，' + c.体用.断 + '。');
  L.push('口径：' + tidy(c.口径) + '。');
  return { text: L.join('\n') };
}
