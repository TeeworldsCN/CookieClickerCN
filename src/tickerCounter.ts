import fs from 'fs';
import path from 'path';

const INFO_PATH = path.join(__dirname, '../build');

const current = JSON.parse(
  fs.readFileSync(path.join(INFO_PATH, 'current.json'), { encoding: 'utf-8' })
);

const original = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/original.json'), { encoding: 'utf-8' })
);

let currentTotal = 0;
let originalTotal = 0;
let foolsTotal = 0;
let funcTotal = 0;

for (let key in current) {
  if (key.match(/Ticker \(/i)) {
    // console.log('counting: ', key);
    if (typeof current[key].chinese == 'string') {
      currentTotal += 1;
    } else {
      currentTotal += current[key].chinese.length;
      for (const item of current[key].chinese) {
        if (item.func) {
          funcTotal += 1;
        }
      }
    }
  }

  if (key.match(/Ticker \(fools/i)) {
    // console.log('counting: ', key);
    if (typeof current[key].chinese == 'string') {
      foolsTotal += 1;
    } else {
      foolsTotal += current[key].chinese.length;
    }
  }
}

for (let key in original) {
  if (key.match(/Ticker \(/i)) {
    // console.log('counting: ', key);
    if (typeof original[key].chinese == 'string') {
      originalTotal += 1;
    } else {
      originalTotal += original[key].chinese.length;
    }
  }
}

console.log('新闻总数:', currentTotal);
console.log('生意节特供:', foolsTotal);
console.log('正常游戏新闻总数:', currentTotal - foolsTotal);
console.log('动态新闻数量:', funcTotal);
console.log('官中新闻总数:', originalTotal);
