import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const OLD = require('/Volumes/Expand/Github/玄玖灵犀 Xael/NT-Xhex/modules/CoreModule/liuren.js');
const a=OLD.chart({y:2021,m:9,d:23,h:0});
console.log('旧', a['月将'], a['中气'], '四课', a['四课'].map(x=>x['位']+x['上']).join(','));
// 新
const NEW = await import('/Users/ntars/Documents/Github/Xael/src/core/liuren/tables.js');
console.log('新 yueJiangOf(2021,9,23)=', NEW.yueJiangOf(2021,9,23), NEW.JIANG_NAME[NEW.yueJiangOf(2021,9,23)]);
// 秋分 2021 日期
const { jieqiTable } = await import('/Users/ntars/Documents/Github/Xael/src/core/calendar/jieqi2.js');
const t = jieqiTable(2021);
console.log('白露', t['白露'] && t['白露'].text, '秋分', t['秋分'] && t['秋分'].text);
