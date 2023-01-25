import fs from 'fs';
import path from 'path';

const INFO_PATH = path.join(__dirname, '../build');

const current = JSON.parse(
  fs.readFileSync(path.join(INFO_PATH, 'current.json'), { encoding: 'utf-8' })
);

const granny: any = {};

for (let key in current) {
  if (!current[key].chinese) continue;

  // 无视patch过的文本
  if (current[key].patch) continue;

  if (typeof current[key].chinese === 'string') {
    if (current[key].chinese.match('老太婆')) {
      granny[key] = {
        english: current[key].english,
        chinese: current[key].chinese,
      };
    }
  } else {
    for (const item of current[key].chinese) {
      if (item.match('老太婆')) {
        granny[key] = {
          english: current[key].english,
          chinese: current[key].chinese,
        };
        break;
      }
    }
  }
}

fs.writeFileSync(path.join(INFO_PATH, 'granny.json'), JSON.stringify(granny, null, 2), {
  encoding: 'utf-8',
});
