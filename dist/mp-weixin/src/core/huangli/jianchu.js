// 由 tools/build-mp.js 自 src/core/huangli/jianchu.js 生成，请勿手改
/**
 * src/core/huangli/jianchu.js —— 建除十二神（值星）（自研，零依赖）
 *
 * 大白话：建除十二神是「建、除、满、平、定、执、破、危、成、收、开、闭」十二个字，
 * 轮流值日，用来概括当天宜做/不宜做的事的大类。
 * 规则：月建（月支）当日为「建」，往后逐日顺排十二字循环。
 * 口径：以节气换月（与月柱同界）；按公历日序取模即可，无需额外表。
 */

const { dayNo } = require('../calendar/solar.js');
const { monthZhiIndex } = require('../calendar/ganzhi.js');
const { ZHI } = require('../common/constants.js');

const JIANCHU_NAMES = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];

/**
 * 某日的建除十二神。
 * 规则：月支「建」位起建。如寅月（正月）：寅日=建、卯日=除……
 * 通用：值星序 = (日支序 − 月支序 + 12) % 12。
 */
function jianchuOf(y, m, d) {
  const zhiIdx = dayNo(y, m, d) % 12; // 不对——建除按日支与月支相对关系，见下
  // 正确规则：月支所对应的地支日为「建」。如寅月：寅日建、卯日除、辰日满…
  // 即 值星序 = (日支序 − 月支序 + 12) % 12
  const dn = dayNo(y, m, d);
  const dayZhi = ((dn + 5) % 12 + 12) % 12; // 1970-01-01=辛巳日（支序5）
  const monthZhi = monthZhiIndex(y, m, d);
  return JIANCHU_NAMES[((dayZhi - monthZhi) % 12 + 12) % 12];
}

/** 建除十二神逐条义理（通例参考：《协纪辨方书》《玉匣记》口径，自撰文案） */
const JIANCHU_MEANING = {
  建: '万物生成之始。宜出行、上任、会友；忌动土、开仓。',
  除: '除旧布新之象。宜沐浴、扫舍、治病、祭祀；忌结婚、赴任。',
  满: '丰盈圆满之象。宜祭祀、祈福、结亲、开市；忌服药、上任。',
  平: '平和安顺之象。宜修路、平整、修饰垣墙；忌词讼、开渠。',
  定: '安定守成之象。宜订婚、纳采、立券、安床；忌诉讼、出行。',
  执: '执持操守之象。宜捕捉、结网、造畜稠；忌搬迁、开市。',
  破: '刚阳破耗之象。宜破屋、坏垣、拆卸；忌嫁娶、开市、出行。',
  危: '危而思变之象。宜安床、祭祀；忌登高、行船、冒险。',
  成: '成就收成之象。宜结婚、开市、入学、安机械；忌词讼。',
  收: '收纳成果之象。宜纳财、买田、收账；忌安葬、开市。',
  开: '开通行事之象。宜开业、开工、出行、搬家；忌安葬。',
  闭: '闭藏守静之象。宜安葬、筑堤、补垣；忌开市、出行、搬迁。',
};

/** 建除吉凶大类（通例） */
const JIANCHU_LUCK = {
  建: '吉', 除: '吉', 满: '吉', 平: '平', 定: '吉', 执: '平',
  破: '凶', 危: '凶', 成: '吉', 收: '平', 开: '吉', 闭: '凶',
};


module.exports.jianchuOf = jianchuOf;
module.exports.JIANCHU_NAMES = JIANCHU_NAMES;
module.exports.JIANCHU_MEANING = JIANCHU_MEANING;
module.exports.JIANCHU_LUCK = JIANCHU_LUCK;
