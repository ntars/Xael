/**
 * src/core/features/registry.js —— 功能注册表（单一真源）
 *
 * 大白话：全部 22 项功能的「名称 → 触发词 → 出料函数」清单都在这里。
 *   · 触发词：搜索框里出现哪个词就调哪项功能，最长词优先、多命中并列；
 *   · 需要生辰的功能（needsBirth）缺生辰时由 analyzer 拦下，不拿「此刻」顶替；
 *   · 出料函数统一从 features/text/ 取，内核只出结构化盘面。
 * 触发词表与功能介绍页逐字同源。
 */

import { TEXT_PACK } from './text/index.js';

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
    key: 'bazi-chart', 名: '八字完整排盘', 短名: '排八字', 处理器: 'bazi', needsBirth: true,
    触发词: ['排八字', '生辰八字', '八字排盘', '八字', '四柱'],
    说明: '以立春交节时刻换年、节气换月、子初换日，排出年月日时四柱与藏干、十神、纳音、旬空、十二长生、五行分布与旺衰',
  },
  {
    key: 'ziwei', 名: '紫微斗数', 短名: '排紫微', 处理器: 'ziwei', needsBirth: true,
    触发词: ['排紫微斗数', '紫微斗数', '排紫微', '紫微命盘', '紫微'],
    说明: '农历五虎遁起宫干、纳音定五行局、紫微星按局数与日数定位，十四主星与辅星依口诀入宫，另出大限与生年四化',
  },
  {
    key: 'qimen', 名: '时家转盘拆补', 短名: '排奇门', 处理器: 'qimen', needsBirth: true,
    触发词: ['排奇门遁甲', '时家奇门', '排奇门', '奇门遁甲', '奇门'],
    说明: '按节气与符头定阴阳遁与局数，地盘布六仪三奇、值符随时干落宫、值使按时支转宫，九星八门八神三层并行',
  },
  {
    key: 'liuyao', 名: '六爻纳甲', 短名: '排六爻', 处理器: 'liuyao', needsBirth: true,
    触发词: ['排六爻卦', '六爻纳甲', '排六爻', '六爻'],
    说明: '京房纳甲取干支、八宫卦定世应、宫五行配六亲，日月建定旬空月破，动爻出变卦',
  },
  {
    key: 'meihua', 名: '梅花易数', 短名: '排梅花', 处理器: 'meihua', needsBirth: true,
    触发词: ['排梅花易数', '梅花易数', '排梅花', '梅花'],
    说明: '先天八卦数时间起卦、总数除六定动爻、二三四与三四五取互卦、体用生克判吉凶',
  },
  {
    key: 'feixing', 名: '九宫飞星', 短名: '排飞星', 处理器: 'feixing',
    触发词: ['排玄空飞星', '九宫飞星', '玄空飞星', '排飞星', '飞星'],
    说明: '三元九运定当运星，年紫白入中逆推、月紫白按节气月、日紫白以节气后甲子日起星、时紫白分三组顺逆飞',
  },
  {
    key: 'bazhai', 名: '八宅命卦', 短名: '查命卦', 处理器: 'bazhai',
    触发词: ['查八宅命卦', '八宅明镜', '查命卦', '八宅'],
    说明: '按出生年与性别推命卦，定东西四命，大游年自伏位排生气、天医、延年、伏位四吉与四凶方',
  },
  {
    key: 'dayun', 名: '八字运程', 短名: '排运程', 处理器: 'dayun', needsBirth: true,
    触发词: ['排八字运程', '排大运', '排运程', '大运', '运程'],
    说明: '起运以出生日到节气交节时刻折算，阳男阴女顺行、阴男阳女逆行，一位十年，另附流年干支',
  },
  {
    key: 'bazi-pattern', 名: '格局喜用', 短名: '解格局', 处理器: 'bazi-pattern', needsBirth: true,
    触发词: ['解八字格局', '格局喜用', '解格局', '看格局'],
    说明: '以月令本气与透干定格局，评分强弱，再按扶抑取用神与喜忌',
  },
  {
    key: 'bazi-shensha', 名: '神煞全表', 短名: '查神煞', 处理器: 'bazi-shensha', needsBirth: true,
    触发词: ['查八字神煞', '八字神煞', '查神煞', '神煞'],
    说明: '以年支、日干、月支三路取天乙贵人、驿马、华盖、桃花、羊刃等神煞的落柱与取法',
  },
  {
    key: 'ziwei-sihua', 名: '紫微四化流运', 短名: '解四化', 处理器: 'sihua', needsBirth: true,
    触发词: ['解紫微四化', '紫微四化', '解四化', '四化'],
    说明: '依生年天干起禄权科忌四化，标出四化所落宫位，附大限流转',
  },
  {
    key: 'qimen-ri', 名: '日家奇门', 短名: '排日家', 处理器: 'qimen-ri', needsBirth: true,
    触发词: ['排日家奇门', '日家奇门', '排日家', '日家'],
    说明: '以日为单元，二至前甲子日起算，一百八十日走完三元，阳遁 174、阴遁 936，值符随日干落宫',
  },
  {
    key: 'qimen-ke', 名: '刻家奇门', 短名: '排刻家', 处理器: 'qimen-ke', needsBirth: true,
    触发词: ['排刻家奇门', '刻家奇门', '排刻家', '刻家'],
    说明: '一日百刻、十二分钟一刻，起局仍落当日日家盘，另点刻柱以断此刻细节',
  },
  {
    key: 'qimen-bj', 名: '宝鉴日奇', 短名: '排宝鉴日奇', 处理器: 'qimen-baojian', needsBirth: true,
    触发词: ['排宝鉴日奇', '宝鉴日奇', '日奇门'],
    说明: '依《奇门宝鉴》日奇口诀，日支定起门、日干定起星，八宫顺布，与日家并列展示',
  },
  {
    key: 'qimen-nianyue', 名: '年家月家', 短名: '排年家月家', 处理器: 'qimen-nianyue', needsBirth: true,
    触发词: ['排年家月家', '年家月家', '年家奇门', '月家奇门'],
    说明: '年家以三元一百八十年、月家以正月八局逐月递减起局，阴阳遁随干支阴阳',
  },
  {
    key: 'qimen-fei', 名: '飞盘奇门', 短名: '排飞盘', 处理器: 'qimen-fei', needsBirth: true,
    触发词: ['排飞盘奇门', '飞盘奇门', '排飞盘', '飞盘'],
    说明: '九宫飞泊、中宫不寄宫、天禽单列，与转盘派并列对照',
  },
  {
    key: 'qimen-ge', 名: '奇门格局库', 短名: '解奇门格局', 处理器: 'qimen-ge', needsBirth: true,
    触发词: ['解奇门格局', '奇门格局', '十干克应'],
    说明: '以十干克应与经典口诀检出盘中实际出现的格局，逐项给宫位、门星与口诀释义',
  },
  {
    key: 'liuren', 名: '大六壬', 短名: '排六壬', 处理器: 'liuren', needsBirth: true,
    触发词: ['排大六壬', '大六壬', '排六壬', '六壬'],
    说明: '月将加占时布天地盘、日干寄宫起四课，按贼克、比用、涉害、遥克、昴星、别责、八专、伏吟、返吟九门发用',
  },
  {
    key: 'liuren-bifa', 名: '毕法赋', 短名: '解毕法', 处理器: 'liuren-bifa', needsBirth: true,
    触发词: ['解毕法赋', '毕法赋', '解毕法', '毕法'],
    说明: '按《毕法赋》可程序化条目对三传四课逐条判定，只出命中项，其余如实标注',
  },
  {
    key: 'liuyao-wangshuai', 名: '六爻旺衰进阶', 短名: '解六爻旺衰', 处理器: 'liuyao-wangshuai', needsBirth: true,
    触发词: ['解六爻旺衰', '六爻旺衰', '旺衰'],
    说明: '按月建日建生扶克泄叠加评分，分旺相休囚死空破七档，逐爻列出关系与标记',
  },
  {
    key: 'huangli', 名: '每日黄历', 短名: '查黄历', 处理器: 'huangli',
    触发词: ['查今日黄历', '今日宜忌', '今日黄历', '查黄历', '黄历'],
    说明: '建除十二值日、黄黑道十二天神、二十八宿、喜财福贵方位、彭祖百忌、胎神冲煞与宜忌推导',
  },
  {
    key: 'date-convert', 名: '万年历日期换算', 短名: '查农历', 处理器: 'lunar',
    触发词: ['查万年历', '查农历', '万年历', '农历'],
    说明: '公历农历互转、年月日时四柱、节气交节时刻与生肖，年界以立春交节为准',
  },
];

/** 常用性排序（介绍页与多命中并列时的先后） */
export const COMMON_ORDER = [
  'bazi-chart', 'ziwei', 'qimen', 'liuyao', 'meihua', 'feixing', 'bazhai', 'dayun',
  'bazi-pattern', 'bazi-shensha', 'ziwei-sihua', 'qimen-ri', 'qimen-ke', 'qimen-bj',
  'qimen-nianyue', 'qimen-fei', 'qimen-ge', 'liuren', 'liuren-bifa', 'liuyao-wangshuai',
  'huangli', 'date-convert',
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
    for (const t of f.触发词) {
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
  return TEXT_PACK[feature.处理器] || null;
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
    短名: f.短名,
    名: f.名,
    简介: briefOf(f.说明),
    资料: f.说明,
  }));
  return [{ 板块: BANK_NAME, 说明: BANK_DESC, 项数: items.length, items }];
}

/** 结果页/导出图使用的失败兜底文案 */
export const FAIL_NOTE = '这次没能算完，请刷新页面或重新打开应用后再试。';
