// script for building the translation mod

import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const BUILD_PATH = path.join(__dirname, '../build/CookieClickerCNMod');
const INFO_PATH = path.join(__dirname, '../build');
fs.mkdirSync(BUILD_PATH, { recursive: true });

const original = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/original.json'), { encoding: 'utf-8' })
);

const metadata = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/metadata.json'), { encoding: 'utf-8' })
);

const replaceAll = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/replaceAll.json'), { encoding: 'utf-8' })
);

const PATCHESPATH = path.resolve(__dirname, '../resources/patches');
const patches = fs.readdirSync(PATCHESPATH).map(file => {
  return {
    file,
    ...JSON.parse(fs.readFileSync(path.join(PATCHESPATH, file), { encoding: 'utf-8' })),
  };
});

// build info.txt
const time = new Date();
const year = time.getUTCFullYear();
const month = _.padStart((time.getUTCMonth() + 1).toString(), 2, '0');
const date = _.padStart(time.getUTCDate().toString(), 2, '0');

const translators = ['简体中文润色与补全，翻译贡献者：'];

for (const patch of patches) {
  if (patch?.author) {
    if (translators.length == 1) translators.push(`${patch.author}`);
    else translators.push(`、${patch.author}`);
  }
}
translators.push(`与匿名贡献的各位。`);

const info: any = {
  Name: '简体中文补全模组',
  ID: 'TWCNClickerCN',
  Author: 'TeeworldsCN',
  Description: translators.join(''),
  ModVersion: Math.floor(Date.now() / 1000),
  GameVersion: metadata.version,
  Date: `${date}/${month}/${year}`,
  Dependencies: [],
  LanguagePacks: ['lang.js'],
  AllowSteamAchievs: true, // just a language mod, we shouldn't break achievements
  Disabled: 1,
};
fs.writeFileSync(path.join(BUILD_PATH, 'info.txt'), JSON.stringify(info, null, 2));

// build lang.js
const lang: { [key: string]: string | string[] } & { 'REPLACE ALL'?: { [key: string]: string } } =
  {};

for (let key in replaceAll) {
  if (lang['REPLACE ALL'] == null) lang['REPLACE ALL'] = {};
  lang['REPLACE ALL'][key] = replaceAll[key].replacement;
}

for (const patch of patches) {
  if (patch['ignored']) continue;

  for (let key in patch) {
    if (!patch[key].chinese || patch[key].deprecated || patch[key].ignored) continue; // ignore metadatas and deprecated
    if (lang[key]) {
      console.error(`duplicate key: "${key}"`);
      process.exit(1);
    }
    lang[key] = patch[key].chinese;
  }
}

fs.writeFileSync(path.join(BUILD_PATH, 'lang.js'), `ModLanguage('ZH-CN',${JSON.stringify(lang)});`);

// combine patches with original to make a current representation
for (var entry in original) {
  const data = original[entry];
  for (var key in replaceAll) {
    if (Array.isArray(data.chinese)) {
      data.chinese = data.chinese.map((str: any) =>
        str.replace(new RegExp(key, 'ig'), replaceAll[key].replacement)
      );
    } else {
      if (!data.chinese) {
        console.log(data);
      }
      data.chinese = data.chinese.replace(new RegExp(key, 'ig'), replaceAll[key].replacement);
    }
  }
}

for (const patch of patches) {
  if (patch['ignored']) continue;

  for (let key in patch) {
    if (!patch[key].chinese || patch[key].deprecated || patch[key].ignored) continue; // ignore metadatas and deprecated
    if (!original[key]) {
      original[key] = {
        english: patch[key].english ?? '[EN:MISSING]',
        chinese: patch[key].chinese,
        patch: patch['file'],
      };
    } else {
      original[key].patch = patch['file'];
      original[key].chinese = patch[key].chinese;
    }
  }
}

fs.writeFileSync(path.join(INFO_PATH, 'current.json'), JSON.stringify(original, null, 2));
