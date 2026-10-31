/**
 * src/core/purple-star/data/order.js —— 紫微斗数的「宫序」与「十四主星序」（单一真源）
 *
 * 大白话：十二宫名与十四主星名在三个文件里各写了一遍（chart.js、data/palace-readings.js、
 *   features/render/purple-star.js），改一处漏一处。这里只放两份字表，其余一律 import。
 */

/** 十二宫名（自命宫起逆布） */
export const PALACES_12 = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

/** 十四主星（紫微系 + 天府系） */
export const MAIN_STARS_14 = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
