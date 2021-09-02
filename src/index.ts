// script for building the translation mod

import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const BUILD_PATH = path.join(__dirname, '../build/CookieClickerCNMod');
fs.mkdirSync(BUILD_PATH, { recursive: true });

const metadata = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/metadata.json'), { encoding: 'utf-8' })
);

const patch = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/patch.json'), { encoding: 'utf-8' })
);

// build info.txt
const time = new Date();
const year = time.getUTCFullYear();
const month = _.padStart((time.getUTCMonth() + 1).toString(), 2, '0');
const date = _.padStart(time.getUTCDate().toString(), 2, '0');

const translators = ['简体中文润色与补全，翻译贡献者：'];

for (let i = 0; i < patch.translators.length - 1; i++) {
  if (i === 0) translators.push(`${patch.translators[i]}`);
  else translators.push(`、${patch.translators[i]}`);
}
translators.push(`与匿名贡献的各位。`);

const info: any = {
  Name: '简体中文补全模组',
  ID: 'twcn-cccn',
  Author: 'TeeworldsCN',
  Description: translators.join(''),
  ModVersion: Math.floor(Date.now() / 1000),
  GameVersion: metadata.version,
  Date: `${date}/${month}/${year}`,
  Dependencies: [],
  LanguagePacks: ['lang.js'],
  Disabled: 1,
};
fs.writeFileSync(path.join(BUILD_PATH, 'info.txt'), JSON.stringify(info, null, 2));

const lang: { [key: string]: string | string[] } = {};
// build lang.js
for (let key in patch) {
  if (!patch[key].chinese) continue; // ignore metadatas and extra stuff
  lang[key] = patch[key].chinese;
}

fs.writeFileSync(path.join(BUILD_PATH, 'lang.js'), `ModLanguage('ZH-CN',${JSON.stringify(lang)});`);
