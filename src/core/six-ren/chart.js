/**
 * src/core/six-ren/chart.js —— 大六壬·时家（月将加占时）主入口（自研，零依赖）
 *
 * 组装：tables（月将/寄宫）→ 天地盘/四课 → fayong（九宗门三传）→ tianjiang（天将）。
 * 口径：月将中气换；23 时夜子归当日（六壬恒自然日柱）；涉害深数不计藏干。
 * 文献依据：《六壬大全·卷一·起例》月将条、《六壬大全·卷一·入手法》寄宫口诀、《六壬大全·课目》九宗门、
 *   《六壬大全·卷一·十二将释》天将序；《六壬大全·课经集》（卷七至卷十，一至四）比用／涉害两派注明在 three-transmissions.js。
 */

import { daySexagenaryIndex, hourSexagenary, yearSexagenaryIndex, hourBranchIndex } from '../calendar/sexagenary.js';
import { STEMS, BRANCHES, SEXAGENARY } from '../common/constants.js';
import { monthGeneralOf, JIANG_NAME, STEM_LODGING, yimaOf, GAN_WX, ZHI_WX } from './tables.js';
import { threeTransmissions } from './three-transmissions.js';
import { guirenIdx, placeHeavenlyGenerals } from './heavenly-generals.js';
import {
  xunshouOf, xunKong, dunGanOf, isLianru, tianmaOf, guXuOf, yingqiOf, sexagenaryText, xingNian,
} from './detail.js';
import { monthBranchIndex } from '../calendar/sexagenary.js';
import { extraLessonsOf } from './extra-lessons.js';
import { generalLikesOf } from './general-likes.js';
import { generalStatesOf } from './general-states.js';
import { generalBranchImagesOf } from './general-branch-images.js';
import { nianMingVerdicts } from './nian-ming.js';

/**
 * 六壬排盘。
 * @param {Object} input {y,m,d,h, 本命?, 性别?, 虚岁?}
 *   可选「本命」= 出生年支（单字，如「寅」）；再给「性别」与「虚岁」时按《六壬大全·观月经》注推行年。
 */
export function sixRenChart(input) {
  const { y, m, d, h = 12 } = input;
  const gzIdx = daySexagenaryIndex(y, m, d); // 23 时归当日（六壬口径）
  const dayGz = SEXAGENARY[gzIdx];
  const dayGan = dayGz[0], dayZhi = dayGz[1];
  const hourGz = hourSexagenary(dayGz[0], h);
  const hourZhi = hourGz[1];
  const T = BRANCHES.findIndex((z) => z.z === hourZhi);
  // 月将按「中气 + 交节小时」换将（六壬铁律），故把占时小时一并传入
  const M = monthGeneralOf(y, m, d, h);

  // 天盘：月将加占时（天盘[占时支位]=月将）
  const tian = [];
  // 天盘位 = (地盘位 + 月将 − 占时) mod 12，必须做 12 的负模归一（否则 M<T 时出负数下标）
  for (let x = 0; x < 12; x++) tian[x] = ((x + M - T) % 12 + 12) % 12;

  // 四课：①干阳（日干寄宫起）②干阴（干上神再上一层）③支阳（日支起）④支阴（支上神再上一层）。
  // 判克时第一课的「位」按日干五行算，不看寄宫支——故这里把 isGan 标记带上，交给 fayong 用。
  const dayGanIdx = STEMS.findIndex((g) => g.z === dayGan);
  const jigong = STEM_LODGING[dayGanIdx];
  const dayZhiIdx = BRANCHES.findIndex((z) => z.z === dayZhi);
  // 日干支的六十甲子序（判旬空用；60 序里「旬」按 10 进，第 0-9 为甲子旬）
  const dayGzIdx = (() => {
    const target = dayGan + dayZhi;
    for (let i = 0; i < 60; i += 1) if (SEXAGENARY[i][0] + SEXAGENARY[i][1] === target) return i;
    return 0;
  })();
  // ★ 注意：tian[] 的下标 = 地盘支序号，值是**天盘支序号**（不是字符串）。
  //   所以「上神之上神」必须写 tian[tian[位]]，早前误把支序号当地支下标查表，一过卯就错。
  const fourLessons = [
    { 位: jigong, 上: tian[jigong], isGan: true },
    { 位: tian[jigong], 上: tian[tian[jigong]] },
    { 位: dayZhiIdx, 上: tian[dayZhiIdx] },
    { 位: tian[dayZhiIdx], 上: tian[tian[dayZhiIdx]] },
  ];

  // 九宗门发三传
  const { 三传, 发用, 课体 } = threeTransmissions({ tian, fourLessons, dayGan, dayGanIdx, dayZhiIdx, M, T });

  // 三传细分：旬空 / 驿马 / 遁干 / 连茹 / 天马 / 孤虚 / 应期
  const dayGzText = sexagenaryText(dayGz);
  const 旬首 = xunshouOf(dayGzText);
  const 空亡 = xunKong(dayGzText);
  const 遁干 = dunGanOf(三传, dayGzText);

  // 天将
  // 昼夜界：昼自卯至申、夜自酉至寅（卯为日出、酉为日入）。
  // 依据《六壬大全·卷三·歌赋》「日出卯，月生酉」「卯是日出月入之门，酉是日入月出之门」，
  // 卯酉为日月出入之界，故卯~申属昼、酉~寅属夜；贵人昼用昼贵、夜用夜贵。
  const isNight = [9, 10, 11, 0, 1, 2].includes(T);
  const gui = guirenIdx(dayGan, isNight);
  const jiangOnTian = placeHeavenlyGenerals(gui);

  // 命上神 / 年上神（本命与行年在地盘之位，取天盘所加之神）
  const posOf = (z) => BRANCHES.findIndex((b) => b.z === z);
  const 本命 = input.本命 && posOf(input.本命) >= 0 ? input.本命 : null;
  const 行年 = (本命 && input.性别 && input.虚岁) ? xingNian(input.虚岁, input.性别) : null;
  const 命上 = 本命 ? BRANCHES[tian[posOf(本命)]].z : null;
  const 年上 = 行年 ? BRANCHES[tian[posOf(行年.支)]].z : null;

  const chart = {
    input: { y, m, d, h },
    干支: { 日: dayGz, 时: hourGz },
    月将: { 序: M, name: JIANG_NAME[M] },
    天地盘: tian.map((x, i) => ({ 地盘: BRANCHES[i].z, 天盘: BRANCHES[x].z })),
    四课: fourLessons.map((c, i) => ({
      课: i + 1,
      位: BRANCHES[c.位] ? BRANCHES[c.位].z : '',
      上: BRANCHES[c.上].z,
      课位五行: (c.isGan || i === 0) ? ['木', '火', '土', '金', '水'][GAN_WX[dayGanIdx]] : ['木', '火', '土', '金', '水'][ZHI_WX[c.位 % 12]],
    })),
    三传: 三传.map((z, i) => ({ 传: ['初', '中', '末'][i], 支: BRANCHES[z] ? BRANCHES[z].z : '', 天将: jiangOnTian[z] || '', 遁干: '' })),
    发用,
    课体: 课体 || '',
    昼夜: isNight ? '夜' : '昼',
    贵人: BRANCHES[gui].z,
    // 十二天将：结构 {贵人, 昼夜, 顺逆, 将: {支: 将名}}
    十二天将: {
      贵人: BRANCHES[gui].z,
      昼夜: isNight ? '夜' : '昼',
      顺逆: [11, 0, 1, 2, 3, 4].includes(gui) ? '顺' : '逆',
      // 按布将方向列：贵人临亥子丑寅卯辰则顺布（自贵人起顺行十二支），
      // 临巳午未申酉戌则逆布——《六壬大全·卷一·十二将释》「天乙居中，后六前五」的顺逆分界
      将: Array.from({ length: 12 }, (_, i) => {
        const shun = [11, 0, 1, 2, 3, 4].includes(gui);
        const pos = shun ? (gui + i) % 12 : ((gui - i) % 12 + 12) % 12;
        return BRANCHES[pos].z;
      }).reduce((acc, z) => { acc[z] = jiangOnTian[BRANCHES.findIndex((x) => x.z === z)]; return acc; }, {}),
    },
    旬首,
    旬空: 空亡.map((z) => BRANCHES[z].z),
    驿马: BRANCHES[yimaOf(dayZhiIdx)].z,
    // 《六壬大全·卷一·起例》逐月神煞表以「月建」起驿马、天马（三合局之冲）：
    //   正月（寅）驿马在申、天马在午；三月（辰）驿马在寅。日支取马是通行另一支（日马），两者并列不合并。
    月驿马: BRANCHES[yimaOf(monthBranchIndex(y, m, d, h, input.minute))].z,
    天马: tianmaOf(monthBranchIndex(y, m, d, h, input.minute), 三传),
    三传遁干: 遁干,
    连茹: isLianru(三传),
    日干支序: dayGzIdx,
    孤虚: guXuOf(dayZhiIdx, monthBranchIndex(y, m, d, h, input.minute), dayGzIdx),
    // 本命 / 行年 / 命上神 / 年上神（未给本命时为 undefined，不影响原有输出）
    本命: 本命 || undefined,
    行年: 行年 || undefined,
    命上: 命上 || undefined,
    年上: 年上 || undefined,
    应期: yingqiOf(三传.map((z) => (BRANCHES[z] ? BRANCHES[z].z : '')), {
      年支: BRANCHES[yearSexagenaryIndex(y, m, d, h) % 12].z,
      月支: BRANCHES[monthBranchIndex(y, m, d, h, input.minute)].z,
      日支: BRANCHES[dayZhiIdx].z,
      时支: BRANCHES[hourBranchIndex(h)].z,
    }),
    口径: '时家六壬；月将中气换；涉害深数不计藏干；23时夜子归当日',
  };
  // 杂课（课经）：不改三传，只按三传/四课/天将/旬首旬尾的组合给格局名
  chart.杂课 = extraLessonsOf(chart, input);
  // 天将的所喜所畏（《六壬大全·十二将释》各将论末句），只列实际同现者，不折吉凶
  chart.将性 = generalLikesOf(chart);
  // 天将的旺相死囚休所主（按月建四时定其五行之气）
  chart.将态 = generalStatesOf(chart, monthBranchIndex(y, m, d, h, input.minute));
  // 天将临支取象（十二将 × 十二支 144 格，照录各将赋文）
  chart.将象 = generalBranchImagesOf(chart);
  // 年命判（须先有 chart：要用天地盘取日上神、用三传取事神）
  chart['年命判'] = nianMingVerdicts(chart);

  return chart;
}
