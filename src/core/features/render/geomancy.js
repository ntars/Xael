/**
 * src/core/features/render/geomancy.js —— 风水与历法查询的文本出料
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 *
 * 覆盖 5 项：九宫飞星（排飞星）· 八宅命卦（查命卦）· 每日黄历（查黄历）·
 *            万年历日期换算（查农历）。
 */

import { flyingStarsChart } from '../../geomancy/flying-stars.js';
import { eightMansionsChart } from '../../geomancy/eight-mansions.js';
import { almanacDaily } from '../../almanac/daily.js';
import { JIANCHU_USE_VERSE } from '../../almanac/twelve-officers.js';
import { solarToLunisolar } from '../../calendar/lunisolar.js';
import {
  daySexagenary, yearSexagenary, monthSexagenary, hourSexagenary, zodiacSign,
} from '../../calendar/sexagenary.js';
import { solarTermsTable } from '../../calendar/solar-terms.js';
import { tidy, dot } from './shared.js';

/** 洛书九宫铺法：巽四 离九 坤二 / 震三 中五 兑七 / 艮八 坎一 乾六 */
const LUOSHU = [4, 9, 2, 3, 5, 7, 8, 1, 6];

/* ------------------------------------------------------------------ *
 * 一、九宫飞星（排飞星）
 * ------------------------------------------------------------------ */

export function flyingStarsText(ent) {
  const d = ent && ent.date;
  const y = d && d.year ? d.year : new Date().getFullYear();
  const m = d && d.month ? d.month : new Date().getMonth() + 1;
  const dd = d && d.day ? d.day : new Date().getDate();
  const h = ent && ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const c = flyingStarsChart({ y, m, d: dd, h });

  const L = [];
  const yearOnly = !!(ent && ent.yearOnly);
  L.push('【九宫飞星】' + (yearOnly ? y + '年' : (y + '年' + m + '月' + dd + '日' + h + '时'))
    + '，' + c.三元九运.星 + '运（' + c.三元九运.年份 + '）。');
  L.push('年紫白：' + c.年紫白.入中 + '入中；' + (yearOnly ? '' : ('月紫白：' + c.月紫白.入中 + '入中；日紫白：'
    + c.日紫白.入中 + '入中；时紫白：' + c.时紫白.入中 + '入中。')));
  L.push('年盘：' + c.年紫白.盘 + '（巽四/离九/坤二 · 震三/中五/兑七 · 艮八/坎一/乾六）。');
  if (!yearOnly) {
    L.push('月盘：' + c.月紫白.盘 + '。');
    L.push('日盘：' + c.日紫白.盘 + '。');
    L.push('时盘：' + c.时紫白.盘 + '。');
  } else {
    L.push('月/日/时紫白须给具体月日时辰（如「排飞星 2024年6月15日14时」）；'
      + '只给年份时仅出年紫白与三元九运，不代拟日期。');
  }
  L.push('口径：' + dot(tidy(c.口径)) );
  // 文献依据：年、月紫白均有原书直证；日、时紫白原书无起例，如实标注
  L.push('依据：年紫白《钦定协纪辨方书·卷十四·三元紫白》（逐太岁条下，与本书逐星对拍 177 星位 0 差）；'
    + '月紫白《御定星历考原·三元月九星》（子午卯酉年正月八白起、辰戌丑未年五黄起、寅申巳亥年二黑起，'
    + '逐月逆推入中，与本书起星规则逐条相符）；三元九运为九星运的通行分运（上元甲子 1864 起）；'
    + '日/时紫白原书无起例，属近世整理，非古籍直证。');
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 二、八宅命卦（查命卦）
 * ------------------------------------------------------------------ */

export function eightMansionsText(ent) {
  const d = ent && ent.date;
  if (!d || !d.year) return { prompt: '查命卦需要出生年份与性别，例如「1990年 男 查命卦」。' };
  const g = ent.gender === 'female' ? 'female' : ent.gender === 'male' ? 'male' : null;
  if (!g) return { prompt: '八宅命卦分男女两路推算，请补「男」或「女」，例如「1990年 男 查命卦」。' };
  const c = eightMansionsChart({ y: d.year, m: d.month || 6, d: d.day || 15, gender: g });
  const zh = g === 'female' ? '女' : '男';

  const L = [];
  L.push('【八宅命卦】' + c.出生年 + '年生' + zh + '命，命卦「' + c.命卦 + '」，' + c.东西四命 + '。');
  const ji = c.八方.filter((x) => x.吉凶.indexOf('吉') >= 0);
  const xiong = c.八方.filter((x) => x.吉凶.indexOf('凶') >= 0);
  L.push('四吉方：' + ji.map((x) => x.星 + x.方位 + '（' + x.五行 + '·' + x.吉凶 + '）').join('、') + '。');
  L.push('四凶方：' + xiong.map((x) => x.星 + x.方位 + '（' + x.五行 + '·' + x.吉凶 + '）').join('、') + '。');
  L.push('八方全表：' + c.八方.map((x) => x.方位 + x.星 + '/' + x.卦).join('，') + '。');
  // 大游年九星的「大吉/中吉/小凶/大凶」等第是通行八宅说：库内《协纪》只给翻卦法（哪一卦变出哪一星），
  // 未列等第（「绝命」二字在底本 0 命中）。不标出处就会让人以为等第出自原书。
  L.push('等第依据：翻卦次序《钦定协纪辨方书·卷二·大游年变卦》原文；八句顺布次序《玉匣記·大遊年歌》原文（两法逐门对拍 56 格全符）；九星阴阳与等第依《玉匣記·九星所屬陰陽凶吉》——生气上吉、天医次吉、延年次吉、绝命大凶、五鬼大凶、六煞次凶、祸害次凶；伏位（辅弼）原文作「左輔次凶、右所屬無定，吉凶亦無定」，通行八宅作小吉，两说并存不强行统一。');
  if (c.三元命卦) {
    const s3 = c.三元命卦;
    L.push('三元九宫法对照（《协纪辨方书·卷三十四》引库外《三元经》）：' + s3.元 + '命卦「' + s3.卦 + '」（洛书 ' + s3.命卦数 + ' 数'
      + (s3.东西命 ? '·' + s3.东西命 + '四命' : '') + '）' + (s3.说明 ? '。' + s3.说明 : '。'));
  }
  L.push('口径：' + dot(tidy(c.口径)) );
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 三、每日黄历（查黄历）
 * ------------------------------------------------------------------ */

export function almanacText(ent) {
  const d = ent && ent.date;
  // 只给年份（yearOnly）时月日是我们补的占位值，不能拿来当日子算——问清楚再算
  if (ent && ent.yearOnly) {
    return { prompt: '查黄历须给到日，例如「查黄历 2024年2月10日」；只给年份定不出日柱与宜忌。' };
  }
  const now = new Date();
  const y = d && d.year ? d.year : now.getFullYear();
  const m = d && d.month ? d.month : now.getMonth() + 1;
  const dd = d && d.day ? d.day : now.getDate();
  const h = ent && ent.time && ent.time.hour != null ? ent.time.hour : null;
  const r = almanacDaily(y, m, dd, h);
  const lu = solarToLunisolar(y, m, dd) || {};
  const lunarName = lu.monthName && lu.dayName ? lu.monthName + lu.dayName : r.lunar;

  const L = [];
  L.push('【黄历宜忌】' + y + '年' + m + '月' + dd + '日（' + r.weekday + '），农历' + lunarName + '。');
  L.push('干支：' + r.ganzhi.年 + '年 ' + r.ganzhi.月 + '月 ' + r.ganzhi.日 + '日' + (r.ganzhi.时 ? ' ' + r.ganzhi.时 + '时' : '') + '。');
  L.push((r.值星.叠值 && r.值星.叠值.length > 1)
    ? '值日：' + r.值星.叠值.map((x) => x + '日').join('、') + '两值并列（交节日旧月与新月的值星同日当值，今日以'
      + r.值星.name + '日论·' + r.值星.吉凶 + '）——' + tidy(r.值星.义理)
    : '值日：' + r.值星.name + '日（' + r.值星.吉凶 + '）——' + tidy(r.值星.义理)
    + ((r.值星.别名 && r.值星.别名.length)
      ? '同位异名：' + r.值星.别名.join('、') + (r.值星.当月别名 ? '（当月作' + r.值星.当月别名 + '）' : '')
        + '——《钦定协纪辨方书·卷七·义例四·建除十二神》所载建除与丛辰本为一事；通书另有增衍，故同名者多即此神、非谓见名必合。'
      : ''));
  // 建除原文宜忌：原书十二位里只建、满给过宜忌条目，其余只有库外《选择宗镜》一句评语。
  //   独立成行是为了不与下面「宜／忌」栏的通书逐日条目混为一谈（两者不同源，曾互相打脸）。
  if (r.值星.原文宜忌) {
    const yj = r.值星.原文宜忌;
    const 句 = yj.宜 ? '宜' + yj.宜 : (yj.忌 ? '忌' + yj.忌 : yj.评);
    L.push('建除原文宜忌：' + 句 + '（' + yj.依据 + '）——此条出自原书义例，与下方通书逐日宜忌不同源，两者并见不合并。');
  }
  L.push('天神：' + r.天神 + (r.天神别名 ? '（立成表作' + r.天神别名 + '）' : '') + '（' + r.天神类 + '·' + r.天神吉凶 + '）——' + tidy(r.天神断语));
  L.push('二十八宿：' + r.二十八宿.宿 + '宿（' + r.二十八宿.五行 + '·' + r.二十八宿.吉凶 + '·' + r.二十八宿.动物 + '）。'
    + '宿之五行、禽象可溯《钦定协纪辨方书·卷一·二十八宿配日》引宿曜经与库外《考原》；'
    + '吉凶二字依《玉匣記·二十八宿值日吉凶歌》逐宿对表（角亢房尾箕斗室壁娄胃毕参井张轸为吉，余十二宿为凶），两书并见；'
    + '《协纪》按语另言「宜忌无取义、应一并删去」，两说并存，此处只作对照。');
  L.push('建除用事（原文）：' + JIANCHU_USE_VERSE + '——《玉匣記·黃黑道用事吉日》。该歌字数不齐、「除」位未出（底本如此），故只照录不强解。');
  L.push('宜：' + (r.宜.length ? r.宜.join('、') : '无') + '。');
  L.push('忌：' + (r.忌.length ? r.忌.join('、') : '无') + '。');
  if ((r.特别忌 || []).length) {
    L.push('特别忌（原书明定，与上列通书宜忌不同源）：' + r.特别忌.map((x) => x.类).join('、') + '。');
    for (const x of r.特别忌) L.push('· ' + x.类 + '——' + x.说明 + '（' + x.依据 + '）');
  }
  if (r.吉神宜趋.length) L.push('吉神宜趋：' + r.吉神宜趋.join('、') + '。');
  if (r.凶煞宜忌.length) L.push('凶煞宜忌：' + r.凶煞宜忌.join('、') + '。');
  L.push('彭祖百忌：' + r.彭祖百忌.干 + '，' + r.彭祖百忌.支 + '。');
  // 底本（《钦定协纪辨方书·百忌日》，卷三十五附录）与通行本有异字时并注，不做取舍
  if ((r.彭祖百忌.异文 || []).length) {
    L.push('彭祖异文：' + r.彭祖百忌.异文.join('；') + '（《钦定协纪辨方书·百忌日》，卷三十五附录原文只有四字短式，通行本另加后果句并改此三字）。');
  }
  L.push('胎神：' + r.胎神 + '；冲' + r.冲煞.冲 + '（属' + r.冲煞.冲生肖 + '）煞' + r.冲煞.煞方 + '。');
  L.push('方位：喜神' + r.方位.喜神 + (r.方位.喜神情态 ? '（情态' + r.方位.喜神情态 + '）' : '') + '，财神' + r.方位.财神 + '，福神' + r.方位.福神 + '，阳贵' + r.方位.阳贵 + '，阴贵' + r.方位.阴贵 + '。'
    + '喜神、财神、福神方位依《玉匣記·喜神方位歌》《玉匣記·財神方位歌》《玉匣記·福神方位歌》逐干对表；'
    + '喜神情态依《玉匣記·喜神喜怒歌》（情态为「怒色皱眉」者，原书自注「如嫁娶，喜神生怒，另擇福納亦可」）。');
  if (r.节日.length) L.push('节日：' + r.节日.join('、') + '。');
  if (r.法定假期 && r.法定假期.name) L.push('假期：' + r.法定假期.name + (r.法定假期.type === 'holiday' ? '（休）' : r.法定假期.type === 'work' ? '（班）' : '') + '。');
  L.push('口径：' + dot(tidy(r.通例参考)) );
  return { text: L.join('\n') };
}

/* ------------------------------------------------------------------ *
 * 四、万年历日期换算（查农历）
 * ------------------------------------------------------------------ */

export function lunisolarConvertText(ent) {
  const d = ent && ent.date;
  if (!d || !d.year || !d.month || !d.day || (ent && ent.yearOnly)) {
    return { prompt: '查农历需要年月日，例如「2026年10月27日 查农历」。' };
  }
  const y = d.year;
  const m = d.month;
  const dd = d.day;
  const h = ent.time && ent.time.hour != null ? ent.time.hour : 12;
  const lu = solarToLunisolar(y, m, dd);
  const gz = daySexagenary(y, m, dd);
  const jq = solarTermsTable(y);
  const names = Object.keys(jq).filter((k) => jq[k].m === m).sort((a, b) => jq[a].d - jq[b].d);
  const zi = zodiacSign(y, m, dd);

  const L = [];
  L.push('【万年历】' + y + '年' + m + '月' + dd + '日，农历' + lu.y + '年' + lu.text + (lu.isLeap ? '（闰月生）' : '') + '。');
  L.push('干支：' + yearSexagenary(y, m, dd) + '年 ' + monthSexagenary(y, m, dd) + '月 ' + gz + '日 '
    + hourSexagenary(gz[0], h) + '时（' + h + ' 时），生肖属' + zi + '。');
  if (names.length) {
    L.push('本月节气：' + names.map((k) => k + ' ' + jq[k].m + '月' + jq[k].d + '日' + jq[k].time).join('，') + '（东八区）。');
  }
  L.push('黄帝纪元参考：' + (y + 2697) + ' 年（通行纪年法，非官方纪年）。');
  L.push('年界：以立春交节时刻换年，月界以节气换月，日以子初（23 时）换日。');
  return { text: L.join('\n') };
}
