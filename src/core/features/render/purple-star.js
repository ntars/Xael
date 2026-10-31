/**
 * src/core/features/render/purple-star.js —— 紫微斗数的文本出料
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 *
 * 覆盖 2 项：紫微斗数（排紫微）· 紫微四化流运（解四化）。
 */

import { purpleStarChart } from '../../purple-star/chart.js';
import { transformationsOf } from '../../purple-star/transformations.js';
import { purpleStarReadingsOf } from '../../purple-star/readings.js';
import { tidy, dot } from './shared.js';

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

export function purpleStarText(ent) {
  if (!ent || !ent.date || !ent.date.year || !ent.date.month || !ent.date.day) {
    return { prompt: '排紫微需要完整的出生年月日，请补充，例如「白玖玖，女，2005年6月9日子时」。' };
  }
  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const g = ent.gender === 'female' ? '女' : ent.gender === 'male' ? '男' : null;
  if (!g) return { prompt: '紫微斗数需出生性别（定阴阳顺逆/大限），请补「男」或「女」。' };

  const c = purpleStarChart({ y, m, d, h, gender: g });
  const P = {};
  c.cells.forEach((cell) => { P[cell.宫] = cell; });
  const ming = c.命宫;

  const L = [];
  L.push('【紫微斗数】' + y + '年' + m + '月' + d + '日' + h + '时（' + g + '，' + c.lunar + '）：命宫在' + c.命宫.位
    + '宫（' + c.命宫.干支 + '），' + c.五行局 + '，' + c.阴阳 + '。');
  L.push('命宫主星' + starPhrase(ming.主星) + (P.命宫.辅星.length ? '，辅星 ' + P.命宫.辅星.join('、') : '')
    + (P.命宫.辅星.length ? '' : '，无辅星') + '。');
  // 亮度（庙旺得地失陷）：《紫微斗數全書》三卷本卷二「一 命宫」篇逐星逐宫原文标注，
  // 与通行庙旺表差异大（例：底本天梁卯宫入庙，通行作卯酉旺）；底本未标级的宫如实写「未标」。
  const mingBr = (P.命宫.亮度 || []).find((b) => ming.主星.includes(b.星));
  if (mingBr) L.push('命宫亮度：' + mingBr.星 + (mingBr.级 ? '（' + mingBr.级 + '）' : '（底本未标级）')
    + '——《紫微斗數全書》三卷本卷二·一 命宫篇' + (mingBr.原文 ? '「' + mingBr.原文 + '」' : '') + '。');
  L.push('身宫在' + c.身宫.宫 + '（' + c.身宫.位 + '宫）。');
  // 会照（三合两宫 + 对宫）：《紫微斗数全书》断语以「三合」「会照」「加会」论吉凶，
  //   如紫微居命宫条「若与府、左右、日月、昌曲三合极吉」「无左右为孤君」，故列出命宫会照星以便对照。
  if (P.命宫 && P.命宫.会照 && P.命宫.会照.length) {
    L.push('命宫会照（三合两宫＋对宫）：' + P.命宫.会照.join('、') + '。');
  }
  (c.命宫判 || []).forEach((x) => L.push('命宫判读：' + dot(x)));
  L.push('十二宫：' + PALACE_ORDER.map((p) => {
    const cell = P[p];
    return p + (cell && cell.主星.length ? '「' + cell.主星.join('/') + '」' : '（空）');
  }).join(' '));
  L.push('大限：' + c.大限.map((x) => x.宫 + x.大限 + '岁').join('、') + '。');
  L.push('大限口径：五行局起限（水二局二岁起、木三局三岁、金四局四岁、土五局五岁、火六局六岁），此后沿行宫方向每宫十年，阳男阴女顺行；库内《紫微斗数全书》底本无「起大限」章节，此为通行口诀，非原书直证。');
  // 大限四化断（卷一问答论原文）：只列本限宫内有生年四化者，恶曜同照只并列名单不折算。
  (c.大限 || []).forEach((lk) => {
    (lk.四化断 || []).forEach((h) => {
      L.push('大限' + lk.大限 + '（' + lk.宫 + '）：' + h.星 + '化' + h.化 + '入限——' + h.断 + '。——' + h.依据 + '。');
    });
  });
  L.push('生年四化：' + ['禄', '权', '科', '忌'].map((k) => c.四化[k] + '化' + k).join('、')
    + '（' + c.四化.依据 + '）。');
  L.push('安星口径：' + dot(tidy(c.口径)) );

  // 星曜居宫断语（《紫微斗数全书》原书直录 168 格，十四主星 × 十二宫）
  const rd = purpleStarReadingsOf(c);
  // 书写序：命宫 → 身宫（若与命宫同宫则只写一次）→ 其余十一宫按固定序。同一宫只出一次。
  const order = [];
  if (rd.命宫) order.push(rd.命宫);
  if (rd.身宫 && rd.身宫.宫 !== (rd.命宫 && rd.命宫.宫)) order.push(rd.身宫);
  PALACE_ORDER.forEach((p) => {
    const cell = rd.cells.find((x) => x.宫 === p);
    if (cell && !order.some((o) => o.宫 === cell.宫)) order.push(cell);
  });
  const lines = [];
  order.forEach((cell) => {
    if (!cell.断语.length) return;
    const isMing = rd.命宫 && cell.宫 === rd.命宫.宫;
    const isShen = rd.身宫 && cell.宫 === rd.身宫.宫;
    const head = isMing ? (isShen ? '命宫（亦身宫）' : '命宫')
      : (isShen ? '身宫（' + cell.宫 + '）' : cell.宫);
    cell.断语.forEach((it) => {
      lines.push(head + '·' + it.星 + '：' + it.文);
    });
  });
  if (lines.length) {
    L.push('星曜居宫断语（《紫微斗数全书》原书直录，共 168 格）：');
    lines.forEach((x) => L.push('  ' + x));
  }
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、紫微四化流运（解四化）
 * ------------------------------------------------------------------ */

export function transformationsText(ent) {
  if (!ent || !ent.date || !ent.date.year || !ent.date.month || !ent.date.day) {
    return { prompt: '解四化需要完整的出生年月日，请补充，例如「白玖玖，女，2005年6月9日子时」。' };
  }
  const y = ent.date.year;
  const m = ent.date.month;
  const d = ent.date.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 14;
  const r = transformationsOf({ y, m, d, h, gender: ent.gender === 'female' ? '女' : '男' });

  const L = [];
  const ming = r.命宫 || {};
  L.push('【紫微四化】' + y + '年' + m + '月' + d + '日' + h + '时（' + (ent.gender === 'female' ? '女' : '男') + '），命宫' + (ming.干支 || '') + '主星「' + (ming.主星 || []).join('、') + '」，' + r.五行局 + '，命主' + (r.命主星 || '') + '、身主' + (r.身主星 || '') + '。');
  L.push('生年四化：' + ['禄', '权', '科', '忌'].map((k) => r.落宫[k].文本).join('，') + '。');
  L.push('四化表：' + ['禄', '权', '科', '忌'].map((k) => r.全表[k] + '化' + k).join('、') + '（年干' + r.年干 + '）。');
  L.push('口径：' + dot(tidy(r.口径)) );
  return { text: L.join('\n') };
}
