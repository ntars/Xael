// 旧仓遥克实现
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const OLD = require('/Volumes/Expand/Github/玄玖灵犀 Xael/NT-Xhex/modules/CoreModule/liuren.js');
const r = OLD.chart({y:2020,m:1,d:3,h:0});
console.log(JSON.stringify({四柱:r.四柱,月将:r.月将,四课:r.四课,发用:r.发用,贵人:r.贵人,昼夜:r.昼夜},null,1).slice(0,2200));
