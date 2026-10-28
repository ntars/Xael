import { liurenChart } from './src/core/liuren/liuren.js';
for (const c of [{y:2020,m:7,d:3,h:17},{y:2020,m:9,d:13,h:5}]) {
  const r=liurenChart(c);
  console.log(c, '日',r.干支.日.join(''), '将',r.月将.名, '课',r.四课.map(x=>x.位+x.上).join(','), '发用',r.发用,'传',r.三传.map(x=>x.支).join(''));
}
