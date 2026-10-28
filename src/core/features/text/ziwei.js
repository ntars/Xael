/**
 * src/core/features/text/ziwei.js —— 紫微斗数的文本出料
 *
 * 覆盖 2 项：紫微斗数（排紫微）· 紫微四化流运（解四化）。
 */

import { ziweiChart } from '../../ziwei/ziwei.js';
import { sihuaOf } from '../../ziwei/sihua.js';
import { tidy } from '../text.js';

/** 主星串的显示写法（空宫不套双括号） */
function starPhrase(list) {
  const v = Array.isArray(list) ? list.join('、') : String(list == null ? '' : list);
  return !v || v === '（空宫）' ? '（空宫）' : '「' + v + '」';
}

/** 十二宫按「命宫起逆时针」的固定书写序 */
const PALACE_ORDER = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

/* ------------------------------------------------------------------ *
 * 一、紫微斗数（排紫微）
 * ------------------------------------------------------------------ */

export function ziweiText(ent) {
  if (!ent || !ent.date || !ent.date.year || !ent.date.month || !ent.date.day) {
    return { prompt: '排紫微需要完整的出生年月日，请补充，例如「白玖玖，女，2005年6月9日子时」。' };
  }
  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const g = ent.gender === 'female' ? '女' : ent.gender === 'male' ? '男' : null;
  if (!g) return { prompt: '紫微斗数需出生性别（定阴阳顺逆/大限），请补「男」或「女」。' };

  const c = ziweiChart({ y, m, d, h, gender: g });
  const P = {};
  c.cells.forEach((cell) => { P[cell.宫] = cell; });
  const ming = c.命宫;

  const L = [];
  L.push('【紫微斗数】' + y + '年' + m + '月' + d + '日' + h + '时（' + g + '，' + c.lunar + '）：命宫在' + c.命宫.支
    + '宫（' + c.命宫.干支 + '），' + c.五行局 + '，' + c.阴阳 + '。');
  L.push('命宫主星' + starPhrase(ming.主星) + (P.命宫.辅星.length ? '，辅星 ' + P.命宫.辅星.join('、') : '')
    + (P.命宫.辅星.length ? '' : '，无辅星') + '。');
  L.push('身宫在' + c.身宫.宫 + '（' + c.身宫.位 + '宫）。');
  L.push('十二宫：' + PALACE_ORDER.map((p) => {
    const cell = P[p];
    return p + (cell && cell.主星.length ? '「' + cell.主星.join('/') + '」' : '（空）');
  }).join(' '));
  L.push('大限：' + c.大限.map((x) => x.宫 + x.大限 + '岁').join('、') + '。');
  L.push('生年四化：' + ['禄', '权', '科', '忌'].map((k) => c.四化[k] + '化' + k).join('、')
    + '（' + c.四化.依据 + '）。');
  L.push('安星口径：' + c.口径 + '。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、紫微四化流运（解四化）
 * ------------------------------------------------------------------ */

export function sihuaText(ent) {
  if (!ent || !ent.date || !ent.date.year || !ent.date.month || !ent.date.day) {
    return { prompt: '解四化需要完整的出生年月日，请补充，例如「白玖玖，女，2005年6月9日子时」。' };
  }
  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const r = sihuaOf({ y, m, d, h, gender: ent.gender === 'female' ? '女' : '男' });

  const L = [];
  const ming = r.命宫 || {};
  L.push('【紫微四化】' + y + '年' + m + '月' + d + '日' + h + '时（' + (ent.gender === 'female' ? '女' : '男') + '），命宫' + (ming.干支 || '') + '主星「' + (ming.主星 || []).join('、') + '」，' + r.五行局 + '，命主' + (r.命主星 || '') + '、身主' + (r.身主星 || '') + '。');
  L.push('生年四化：' + ['禄', '权', '科', '忌'].map((k) => r.落宫[k].文本).join('，') + '。');
  L.push('四化表：' + ['禄', '权', '科', '忌'].map((k) => r.全表[k] + '化' + k).join('、') + '（年干' + r.年干 + '）。');
  L.push('口径：' + tidy(r.口径) + '。');
  return { text: L.join('\n') };
}
