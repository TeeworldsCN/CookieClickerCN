import fs from 'fs';
import path from 'path';

const INFO_PATH = path.join(__dirname, '../build');

const current = JSON.parse(
  fs.readFileSync(path.join(INFO_PATH, 'current.json'), { encoding: 'utf-8' })
);

const original = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/original.json'), { encoding: 'utf-8' })
);

let charCount = 0;
let totalCount = 0;

for (let key in current) {
  const patched = typeof current[key].patch == 'string';
  let delta = 0;
  if (current[key].chinese == '[CN:MISSING]') continue;

  switch (typeof current[key].chinese) {
    case 'string':
      delta += current[key].chinese.length;
      break;
    case 'object':
      if (Array.isArray(current[key].chinese))
        for (const item of current[key].chinese) {
          if (typeof item == 'string') {
            delta += item.length;
          } else if (item.func) {
            delta += item.func.length;
          }
        }
      else if (current[key].chinese.func) {
        delta += current[key].chinese.func.length;
      }
      break;
  }
  if (patched) {
    charCount += delta;
  }
  totalCount += delta;
}

let originalCount = 0;
for (let key in original) {
  if (original[key].chinese == '[CN:MISSING]') continue;

  switch (typeof original[key].chinese) {
    case 'string':
      originalCount += original[key].chinese.length;
      break;
    case 'object':
      if (Array.isArray(original[key].chinese))
        for (const item of original[key].chinese) {
          if (typeof item == 'string') {
            originalCount += item.length;
          }
        }
      break;
  }
}

console.log('MOD修改字数:', charCount);
console.log('MOD所有字数:', totalCount);
console.log('原版所有字数:', originalCount);
