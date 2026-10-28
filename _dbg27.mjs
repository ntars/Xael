import { prevJieqi } from './src/core/calendar/jieqi2.js';
const cur=prevJieqi(2021,9,23);
const J={
  雨水: 11, 春分: 10, 谷雨: 9, 小满: 8, 夏至: 7, 大暑: 6,
  处暑: 5, 秋分: 4, 霜降: 3, 小雪: 2, 冬至: 1, 大寒: 0,
};
console.log('cur', cur.名, 'in', cur.名 in J, J[cur.名]);
