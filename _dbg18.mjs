import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const OLD = require('/Volumes/Expand/Github/玄玖灵犀 Xael/NT-Xhex/modules/CoreModule/liuren.js');
const a=OLD.chart({y:2021,m:9,d:23,h:0});
console.log(Object.keys(a));
console.log(JSON.stringify(a['月将']));
