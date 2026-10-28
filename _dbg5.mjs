import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const OLD = require('/Volumes/Expand/Github/玄玖灵犀 Xael/NT-Xhex/modules/CoreModule/liuren.js');
const Z='子丑寅卯辰巳午未申酉戌亥';
const cases=[{y:2020,m:1,d:3,h:5},{y:2020,m:1,d:3,h:21},{y:2021,m:1,d:15,h:11}];
for(const c of cases){const r=OLD.chart(c);console.log(c, JSON.stringify({日:r.四柱.日,课:r.四课.map(x=>x.位+x.上).join(','),法:r.发用.方法,传:r.发用.三传.join('')}));}
