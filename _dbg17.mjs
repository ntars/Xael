import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const OLD = require('/Volumes/Expand/Github/玄玖灵犀 Xael/NT-Xhex/modules/CoreModule/liuren.js');
const NEW = await import('/Users/ntars/Documents/Github/Xael/src/core/liuren/liuren.js');
for (const c of [{y:2021,m:9,d:23,h:0},{y:2021,m:9,d:23,h:2}]) {
  const a=OLD.chart(c), b=NEW.liurenChart(c);
  console.log(c,'旧四柱',a['四柱'],'旧将',a['月将']&&a['月将']['名']);
  console.log('   新日',b['干支']['日'].join(''),'新时',b['干支']['时'],'新将',b['月将']['名']);
  console.log('   旧课',a['四课'].map(x=>x['位']+x['上']).join(','),'新课',b['四课'].map(x=>x['位']+x['上']).join(','));
}
