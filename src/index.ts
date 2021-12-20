// script for building the translation mod

import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import opencc from 'node-opencc';

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

const T = opencc.simplifiedToTraditional;

const translators = ['中文润色与补全，翻译贡献者：'];

for (const patch of patches) {
  if (patch?.author) {
    if (translators.length == 1) translators.push(`${patch.author}`);
    else translators.push(`、${patch.author}`);
  }
}
translators.push(`与匿名贡献的各位。`);

const info: any = {
  Name: '中文补全模组',
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
const langS: { [key: string]: string | string[] } & { 'REPLACE ALL'?: { [key: string]: string } } =
  {};

for (let key in replaceAll) {
  if (langS['REPLACE ALL'] == null) langS['REPLACE ALL'] = {};
  langS['REPLACE ALL'][key] = replaceAll[key].replacement;
}

const CHNTPATCHESPATH = path.resolve(__dirname, '../resources/cht_patches');
const chtPatches = fs.readdirSync(CHNTPATCHESPATH).map(file => {
  return {
    file,
    ...JSON.parse(fs.readFileSync(path.join(CHNTPATCHESPATH, file), { encoding: 'utf-8' })),
  };
});

for (const patch of patches) {
  if (patch['ignored']) continue;

  for (let key in patch) {
    if (!patch[key].chinese || patch[key].deprecated || patch[key].ignored) continue; // ignore metadatas and deprecated
    if (langS[key]) {
      console.error(`duplicate key: "${key}"`);
      process.exit(1);
    }
    langS[key] = patch[key].chinese;
  }
}

for (const patch of chtPatches) {
  if (patch['ignored']) continue;

  for (let key in patch) {
    if (!patch[key].tradchn || patch[key].deprecated || patch[key].ignored) continue; // ignore metadatas and deprecated
    if (original[key] && original[key].tradchn) {
      console.error(`duplicate key: "${key}"`);
      process.exit(1);
    }
    original[key].tradchn = patch[key].tradchn;
    original[key].chtpatch = patch['file'];
  }
}

fs.writeFileSync(
  path.join(BUILD_PATH, 'lang.js'),
  `ModLanguage('ZH-CN',${JSON.stringify(langS)});`
);

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

// Mark patch file
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

// make traditional chinese
let lastVersion: any = {};
try {
  lastVersion = JSON.parse(
    fs.readFileSync(path.join(INFO_PATH, 'current.json'), { encoding: 'utf-8' })
  );
} catch {
  console.log('No current.json found, rebuilding');
}

for (var key in original) {
  if (original[key].tradchn) continue; // skip specifically patched entries
  if (original[key].chinese == '[CN:MISSING]') {
    original[key].tradchn = '[CN:MISSING]';
  } else {
    if (Array.isArray(original[key].chinese)) {
      original[key].tradchn = (original[key].chinese as any[]).map((s, i) => {
        if (lastVersion[key] && lastVersion[key].chinese[i] && lastVersion[key].chinese[i] == s) {
          return lastVersion[key].tradchn[i];
        }
        return T(s);
      });
    } else {
      if (lastVersion[key] && lastVersion[key].chinese == original[key].chinese) {
        original[key].tradchn = lastVersion[key].tradchn;
      } else {
        original[key].tradchn = T(original[key].chinese);
      }
    }
  }
}

// build langT.js
const langT: { [key: string]: string | string[] } = {};
for (let key in original) {
  if (langT[key]) {
    console.error(`duplicate key: "${key}"`);
    process.exit(1);
  }
  if (original[key].tradchn != '[CN:MISSING]') langT[key] = original[key].tradchn;
}

fs.writeFileSync(
  path.join(BUILD_PATH, 'langT.js'),
  `__TWCNG.LoadTradCHNFile(${JSON.stringify(langT)});`
);

fs.writeFileSync(path.join(INFO_PATH, 'current.json'), JSON.stringify(original, null, 2));
