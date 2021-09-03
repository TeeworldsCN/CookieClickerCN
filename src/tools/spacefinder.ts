// script to find phrases with unwanted space

import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const original = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../resources/original.json'), { encoding: 'utf-8' })
);

const argLines = _.pickBy(original, (e: any) => {
  if (!e?.english) return false;
  if (typeof e.english == 'string') {
    if (e.english.match(/%[0-9]/)) return true;
  } else {
    for (const i of e.english) {
      if (i.match(/%[0-9]/)) return true;
    }
  }
});

fs.writeFileSync('result.json', JSON.stringify(argLines, null, 2));
