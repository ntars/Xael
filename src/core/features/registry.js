/**
 * src/core/features/registry.js —— 功能注册表（单一真源）
 * 本文件只做文本装配，不含算法规则表（规则的文献出处见对应内核模块文件头）。
 * 各功能的规则依据见 registry 内 note 字段与其内核模块文件头；本层不引入任何新口径。
 *
 * 大白话：全部 22 项功能的「名称 → 触发词 → 出料函数」清单都在这里。
 *   · 触发词：搜索框里出现哪个词就调哪项功能，最长词优先、多命中并列；
 *   · 需要生辰的功能（needsBirth）缺生辰时由 analyzer 拦下，不拿「此刻」顶替；
 *   · 出料函数统一从 features/render/ 取，内核只出结构化盘面。
 * 触发词表与功能介绍页逐字同源。
 */

import { TEXT_PACK } from './render/index.js';

/** 全套排盘的 7 类分组（结果页分组标题） */
export const GROUPS = ['万年历黄历', '八字命理', '紫微斗数', '六爻占卜', '奇门遁甲', '梅花易数', '风水堪舆'];

/** 板块名（介绍页「功能清单」） */
export const BANK_NAME = '功能清单';
export const BANK_DESC = '按搜索框触发词可直接调用的条目，逐项写明算法如何实现。';

/**
 * 22 项功能注册。
 * 字段：key 唯一键 / 名 全称 / 短名 结果页标签用 / 板块 / 触发词 / 说明（介绍页简介）/ needsBirth
 */
export const FEATURES = [
  {
    key: 'four-pillars', name: '八字完整排盘', shortName: '排八字', handler: 'four-pillars', needsBirth: true,
    triggers: ['排八字', '生辰八字', '八字排盘', '八字', '四柱'],
    note: '以立春交节时刻换年、节气换月、子初换日，排出年月日时四柱与藏干、十神、纳音、旬空、十二长生、五行分布与旺衰',
    source: '《渊海子平·论大运》《三命通会·论人元司事/论年月日时》《滴天髓·衰旺》',
  },
  {
    key: 'purple-star', name: '紫微斗数', shortName: '排紫微', handler: 'purple-star', needsBirth: true,
    triggers: ['排紫微斗数', '紫微斗数', '排紫微', '紫微命盘', '紫微'],
    note: '农历五虎遁起宫干、纳音定五行局、紫微星按局数与日数定位，十四主星与辅星依口诀入宫，另出大限与生年四化',
    source: '《紫微斗數全書》三卷本·诸星问答论（断语直录 168 格）；安星诀见同书卷二（原为口诀缺载，三卷本入库后补直证）',
  },
  {
    key: 'mystic-gates-hour', name: '时家转盘拆补', shortName: '排奇门', handler: 'mystic-gates-hour', needsBirth: true,
    triggers: ['排奇门遁甲', '时家奇门', '排奇门', '奇门遁甲', '奇门'],
    note: '按节气与符头定阴阳遁与局数，地盘布六仪三奇、值符随时干落宫、值使按时支转宫，九星八门八神三层并行',
    source: '《奇门遁甲统宗·定三元法》《奇门宝鉴·释符头/释直符直使》',
  },
  {
    key: 'six-lines', name: '六爻纳甲', shortName: '排六爻', handler: 'six-lines', needsBirth: true,
    triggers: ['排六爻卦', '六爻纳甲', '排六爻', '六爻'],
    note: '京房纳甲取干支、八宫卦定世应、宫五行配六亲，日月建定旬空月破，动爻出变卦；碎金赋制化、禄马贵人天喜星煞、定间爻、月破三态；分门断法按《黄金策》十门原文逐句落地',
    source: '《卜筮正宗·纳甲装卦歌/安世应诀（见六亲歌）/碎金赋/禄马羊刃歌/贵人歌诀/定间爻歌》《增删卜易·用神章第八/飞伏神章第二十八/月破章第二十七/两现章第三十二/星煞章第三十三》《黄金策·总断千金赋/求财/词讼/疾病/出行/求名/婚姻/家宅/失脱/行人/产育》',
  },
  {
    key: 'plum-blossom', name: '梅花易数', shortName: '排梅花', handler: 'plum-blossom', needsBirth: true,
    triggers: ['排梅花易数', '梅花易数', '排梅花', '梅花'],
    note: '先天八卦数时间起卦、总数除六定动爻、二三四与三四五取互卦、体用生克判吉凶；后天起卦并出《周易》卦辞、大象与动爻爻辞',
    source: '《梅花易数·年月日时起例/体用总诀》《梅花易数·占法》《周易》',
  },
  {
    key: 'flying-stars', name: '九宫飞星', shortName: '排飞星', handler: 'flying-stars',
    triggers: ['排玄空飞星', '九宫飞星', '玄空飞星', '排飞星', '飞星'],
    note: '三元九运定当运星，年紫白入中逆推、月紫白按节气月、日紫白以节气后甲子日起星、时紫白分三组顺逆飞',
    source: '《钦定协纪辨方书·卷十四·三元紫白》《御定星历考原·三元月九星》（年/月紫白有直证；日/时紫白为近世整理，已标）',
  },
  {
    key: 'eight-mansions', name: '八宅命卦', shortName: '查命卦', handler: 'eight-mansions',
    triggers: ['查八宅命卦', '八宅明镜', '查命卦', '八宅'],
    note: '按出生年与性别推命卦，定东西四命，大游年自伏位排生气、天医、延年、伏位四吉与四凶方',
    source: '《钦定协纪辨方书·卷二·大游年变卦》《钦定协纪辨方书·卷三十四·男女九宫》引库外《三元经》',
  },
  {
    key: 'luck-cycles', name: '八字运程', shortName: '排运程', handler: 'luck-cycles', needsBirth: true,
    triggers: ['排八字运程', '排大运', '排运程', '大运', '运程'],
    note: '起运以出生日到节气交节时刻折算，阳男阴女顺行、阴男阳女逆行，一位十年；另附小运（两法并列）与流年太岁（岁伤日干/日犯岁君、真太岁、征太岁、岁运并临）',
    source: '《渊海子平·论大运》《三命通会·论大运》《三命通会·论小运》《三命通会·论太岁》',
  },
  {
    key: 'chart-patterns', name: '格局喜用', shortName: '解格局', handler: 'chart-patterns', needsBirth: true,
    triggers: ['解八字格局', '格局喜用', '解格局', '看格局'],
    note: '以月令本气与透干定格局，按《滴天髓》三要素定身强弱，再依《子平真诠》取扶抑用神与喜忌',
    source: '《子平真诠·论用神》《滴天髓·形象（独象）/顺逆/衰旺》《穷通宝鉴》（调候）',
  },
  {
    key: 'symbolic-stars', name: '神煞全表', shortName: '查神煞', handler: 'symbolic-stars', needsBirth: true,
    triggers: ['查八字神煞', '八字神煞', '查神煞', '神煞'],
    note: '以年支、日干、月支三路取天乙贵人、驿马、华盖、桃花、羊刃等神煞的落柱与取法',
    source: '《三命通会·论天乙贵人/论阳刃/论太极贵》',
  },
  {
    key: 'transformations', name: '紫微四化流运', shortName: '解四化', handler: 'transformations', needsBirth: true,
    triggers: ['解紫微四化', '紫微四化', '解四化', '四化'],
    note: '依生年天干起禄权科忌四化，标出四化所落宫位，附大限流转',
    source: '《紫微斗數全書》三卷本（安星诸诀与安禄权科忌四星变化诀原书直证；壬科天府/左辅异说已标）',
  },
  {
    key: 'mystic-gates-day', name: '日家奇门', shortName: '排日家', handler: 'mystic-gates-day', needsBirth: true,
    triggers: ['排日家奇门', '日家奇门', '排日家', '日家'],
    note: '以日为单元，二至前最近的甲子日起算，六十日进一元、一百八十日走完三元，阳遁 1/7/4 局、阴遁 9/3/6 局，值符随日干落宫、值使按日干旬内位次数九宫',
    source: '《奇门遁甲统宗·定三元法》《奇门宝鉴·释直符直使》',
  },
  {
    key: 'mystic-gates-quarter', name: '刻家奇门', shortName: '排刻家', handler: 'mystic-gates-quarter', needsBirth: true,
    triggers: ['排刻家奇门', '刻家奇门', '排刻家', '刻家'],
    note: '一时辰十刻、每刻十二分钟；刻局由时家局逐刻递推（阳顺阴逆），刻柱由时干起五子遁，旬首仪在地盘之宫定刻家值符值使',
    source: '《奇门宝鉴·释直符直使》（刻家原书无专篇，取近世整理，已标待考）',
  },
  {
    key: 'mystic-gates-mirror', name: '宝鉴日奇', shortName: '排宝鉴日奇', handler: 'mystic-gates-mirror', needsBirth: true,
    triggers: ['排宝鉴日奇', '宝鉴日奇', '日奇门'],
    note: '依《奇门遁甲统宗·附日奇门起例》：日支定局数，九星自甲子日天蓬起艮八每日顺移一宫，八门自甲子日休门在坎一每三日顺转一宫；原文未给八神/天盘/值符值使，故不输出',
    source: '《奇门遁甲统宗·附日奇门起例》',
  },
  {
    key: 'mystic-gates-year-month', name: '年家月家', shortName: '排年家月家', handler: 'mystic-gates-year-month', needsBirth: true,
    triggers: ['排年家月家', '年家月家', '年家奇门', '月家奇门', '排年家', '排月家'],
    note: '年家三元一百八十年一周（上元甲子 1864、中元 1924、下元 1984），月家按月柱六十甲子序分三元；两家的三元局数一律取 1/4/7 且一律阴遁，值符随干、值使随支、八神逆排',
    source: '《奇门遁甲统宗·附年奇门起例/附月奇门起例》',
  },
  {
    key: 'mystic-gates-flying', name: '飞盘奇门', shortName: '排飞盘', handler: 'mystic-gates-flying', needsBirth: true,
    triggers: ['排飞盘奇门', '飞盘奇门', '排飞盘', '飞盘'],
    note: '九宫飞泊、中宫不寄宫、天禽单列，与转盘派并列对照',
    source: '《奇门宝鉴》（飞盘原书无专篇，取近世整理；四柱定局部分依《统宗·定三元法》）',
  },
  {
    key: 'mystic-gates-patterns', name: '奇门格局库', shortName: '解奇门格局', handler: 'mystic-gates-patterns', needsBirth: true,
    triggers: ['解奇门格局', '奇门格局', '十干克应'],
    note: '以十干克应与经典口诀检出盘中实际出现的格局，逐项给宫位、门星与口诀释义',
    source: '《奇门宝鉴·释奇墓奇制与日时干墓同凶/释迫/释三奇得使/释三奇游六仪/释天辅时与五合时同吉异理/释玉女守门》《遁甲演义·三诈五假》（三诈五假原文直证）',
  },
  {
    key: 'six-ren', name: '大六壬', shortName: '排六壬', handler: 'six-ren', needsBirth: true,
    triggers: ['排大六壬', '大六壬', '排六壬', '六壬'],
    note: '月将加占时布天地盘、日干寄宫起四课，按贼克、比用、涉害、遥克、昴星、别责、八专、伏吟、返吟九门发用；另按课经判三光、轩盖、铸印、斩关、闭口等 18 杂课，并按十二将释列天将喜畏',
    source: '《六壬大全·卷一起例/观月经》《六壬大全·课经集》（卷七至卷十，一至四）',
  },
  {
    key: 'six-ren-bifa', name: '毕法赋', shortName: '解毕法', handler: 'six-ren-bifa', needsBirth: true,
    triggers: ['解毕法赋', '毕法赋', '解毕法', '毕法'],
    note: '按《毕法赋》可程序化条目对三传四课逐条判定，只出命中项，其余如实标注',
    source: '《六壬大全·卷十一（毕法赋上）/卷十二（毕法赋下）》《六壬大全·卷一·十二将释》',
  },
  {
    key: 'six-lines-strength', name: '六爻旺衰进阶', shortName: '解六爻旺衰', handler: 'six-lines-strength', needsBirth: true,
    triggers: ['解六爻旺衰', '六爻旺衰', '旺衰'],
    note: '按月建日建的生扶克泄定性分层，逐爻列出月/日关系、空破与变爻吉凶',
    source: '《增删卜易·生旺墓绝章/动散章/暗动章/独发章》《黄金策·总断》',
  },
  {
    key: 'almanac', name: '每日黄历', shortName: '查黄历', handler: 'almanac',
    // 触发词覆盖口语问法：「今天/明天宜忌」「黄道吉日」「建除值日」都要能进黄历，
    // 否则用户按日常说法问一句就只得到「请输入生辰」，体验很差。最长词优先匹配。
    triggers: [
      '查今日黄历', '今日宜忌', '今日黄历', '今天宜忌', '今天黄历', '明天宜忌',
      '明日宜忌', '明天黄历', '黄道吉日', '建除值日', '查黄历', '宜忌', '黄历',
    ],
    note: '建除十二值日、黄黑道十二天神、二十八宿、喜财福贵方位、彭祖百忌、胎神冲煞；宜忌与吉凶神煞取库外《玉匣记》系通书逐日条目，另按《协纪辨方书》历例复算 43 神并列校验',
    source: '《钦定协纪辨方书·卷四至卷六·义例/卷七·义例五·黄道黑道》引库外《神枢经》/卷二十九·用事（宜忌按神推，表例附 79 组直证）',
  },
  {
    key: 'lunisolar-convert', name: '万年历日期换算', shortName: '查农历', handler: 'lunisolar-convert',
    triggers: ['查万年历', '查农历', '万年历', '农历'],
    note: '公历农历互转、年月日时四柱、节气交节时刻与生肖，年界以立春交节为准',
    source: '库外《时宪历》定朔定气之法；节气用 VSOP87（Meeus 库外《Astronomical Algorithms》）',
  },
];

/** 常用性排序（介绍页与多命中并列时的先后） */
export const COMMON_ORDER = [
  'four-pillars', 'purple-star', 'mystic-gates-hour', 'six-lines', 'plum-blossom', 'flying-stars', 'eight-mansions', 'luck-cycles',
  'chart-patterns', 'symbolic-stars', 'transformations', 'mystic-gates-day', 'mystic-gates-quarter', 'mystic-gates-mirror',
  'mystic-gates-year-month', 'mystic-gates-flying', 'mystic-gates-patterns', 'six-ren', 'six-ren-bifa', 'six-lines-strength',
  'almanac', 'lunisolar-convert',
];

/** 通用动词：只靠这些词命中时不算实质命中 */
export const GENERIC_TRIGGERS = ['排盘', '排', '查', '看', '解'];

/**
 * 多命中匹配（最长词优先 → 去从属 → 去纯通用词 → 按常用序排）。
 * @param {string} text 用户问句
 * @returns {Array<{feature, hit}>}
 */
export function matchAll(text) {
  const q = String(text || '');
  const found = [];
  for (const f of FEATURES) {
    let best = '';
    for (const t of f.triggers) {
      if (q.includes(t) && t.length > best.length) best = t;
    }
    if (best) found.push({ feature: f, hit: best });
  }
  if (!found.length) return [];

  // 去从属：某功能的命中词是另一功能命中词的真子串 → 剔除
  const pruned = found.filter((a) => !found.some((b) => b !== a && b.hit.length > a.hit.length && b.hit.includes(a.hit)));
  // 有实质命中时滤掉只靠通用词命中的
  const solid = pruned.filter((a) => !GENERIC_TRIGGERS.includes(a.hit));
  const list = solid.length ? solid : pruned;
  // 常用序
  const rank = (k) => {
    const i = COMMON_ORDER.indexOf(k);
    return i < 0 ? 99 : i;
  };
  return list.sort((a, b) => rank(a.feature.key) - rank(b.feature.key));
}

/** 取某项功能的出料函数 */
export function rendererOf(feature) {
  return TEXT_PACK[feature.handler] || null;
}

/** 介绍页用的条目简介（去括号、去编号、取首个短句，超 28 字截断） */
export function briefOf(s) {
  let v = String(s || '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/C\d+/g, '')
    .replace(/§[\d.]+/g, '')
    .trim();
  v = v.split(/[，。；：]/)[0];
  if (v.length > 28) {
    const cut = Math.max(v.lastIndexOf('·'), v.lastIndexOf('/'));
    v = (cut > 8 ? v.slice(0, cut) : v.slice(0, 28)) + '…';
  }
  return v;
}

/** 功能介绍页的分组数据（settings.introPage 的输入） */
export function catalog() {
  const items = FEATURES.slice().sort((a, b) => {
    const r = (k) => {
      const i = COMMON_ORDER.indexOf(k);
      return i < 0 ? 99 : i;
    };
    return r(a.key) - r(b.key);
  }).map((f) => ({
    key: f.key,
    shortName: f.shortName,
    name: f.name,
    简介: briefOf(f.note),
    资料: f.note,
    依据: f.source || '',
  }));
  return [{ section: BANK_NAME, note: BANK_DESC, count: items.length, items }];
}

/** 结果页/导出图使用的失败兜底文案 */
export const FAIL_NOTE = '这次没能算完，请刷新页面或重新打开应用后再试。';
