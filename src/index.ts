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

const transformFunc = (str: string) => str.replace(/{"func":"([^"]*)"}/g, `()=>$1`);
// build info.txt
const time = new Date();
const year = time.getUTCFullYear();
const month = _.padStart((time.getUTCMonth() + 1).toString(), 2, '0');
const date = _.padStart(time.getUTCDate().toString(), 2, '0');

const T = opencc.simplifiedToTraditional;

const translators = ['中文润色与补全，翻译贡献者：'];

for (const patch of patches) {
  if (patch?.author) {
    if (translators.indexOf(patch.author) > -1) continue;
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

// build main.js
const main = fs.readFileSync(path.resolve(__dirname, '../resources/script/main.js'), {
  encoding: 'utf-8',
});

const chs = fs.readFileSync(path.resolve(__dirname, '../resources/script/chs.js'), {
  encoding: 'utf-8',
});

fs.writeFileSync(path.join(BUILD_PATH, 'main.js'), main.replace('const __TWCNL = {};', chs));

// build lang.js
const langS: { [key: string]: string | string[] } & { 'REPLACE ALL'?: { [key: string]: string } } =
  {};

for (let key in replaceAll) {
  if (langS['REPLACE ALL'] == null) langS['REPLACE ALL'] = {};
  langS['REPLACE ALL'][key] = replaceAll[key].replacement;
}

const CHNTPATCHESPATH = path.resolve(__dirname, '../resources/patches_cht');
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
    if (key == 'REPLACE ALL') continue;
    if (!patch[key].chinese || patch[key].deprecated || patch[key].ignored) continue; // ignore metadatas and deprecated
    if (original[key] && original[key].tradchn) {
      console.error(`duplicate key: "${key}"`);
      process.exit(1);
    }
    original[key].tradchn = patch[key].chinese;
    original[key].chtpatch = patch['file'];
  }
}

fs.writeFileSync(
  path.join(BUILD_PATH, 'lang.js'),
  `ModLanguage('ZH-CN',${transformFunc(JSON.stringify(langS))});`
);

// combine patches with original to make a current representation
for (var entry in original) {
  const data = original[entry];
  for (var key in replaceAll) {
    if (typeof data.chinese === 'object' && typeof data.chinese.func === 'string') {
      data.chinese.func = data.chinese.func.replace(key, replaceAll[key].replacement);
    } else if (Array.isArray(data.chinese)) {
      data.chinese = data.chinese.map((str: any) => {
        if (typeof str === 'object' && typeof str.func === 'string') {
          return { func: str.func.replace(key, replaceAll[key].replacement) };
        }
        return str.replace(new RegExp(key, 'ig'), replaceAll[key].replacement);
      });
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

const replaceAllCHT = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../resources/replaceAllCHT.json'), { encoding: 'utf-8' })
);

const replaceAllForCHT = (str: string | (string | { func: string })[] | { func: string }) => {
  const doReplace = (key: string, replacement: string) => {
    const r = new RegExp(key, 'ig');
    if (typeof str === 'object' && !Array.isArray(str) && typeof str.func === 'string') {
      return { func: str.func.replace(r, replacement) };
    } else if (Array.isArray(str)) {
      return str.map(s => {
        if (typeof s === 'object' && typeof s.func === 'string') {
          return { func: s.func.replace(r, replacement) };
        } else if (typeof s === 'string') {
          return s.replace(r, replacement);
        }
        return s;
      });
    } else if (typeof str === 'string') {
      return str.replace(r, replacement);
    }
    return str;
  };

  for (let key in replaceAllCHT) {
    if (replaceAllCHT[key] && replaceAllCHT[key].replacement) {
      str = doReplace(key, replaceAllCHT[key].replacement);
    }
  }
  return str;
};

for (var key in original) {
  if (original[key].tradchn) continue; // skip specifically patched entries
  if (original[key].chinese == '[CN:MISSING]') {
    original[key].tradchn = '[CN:MISSING]';
  } else {
    if (Array.isArray(original[key].chinese)) {
      original[key].tradchn = (original[key].chinese as any[]).map((s, i) => {
        if (
          lastVersion[key] &&
          lastVersion[key].chinese[i] &&
          (lastVersion[key].chinese[i] == s || lastVersion[key].chinese[i]?.func == s?.func) &&
          lastVersion[key].tradchn &&
          lastVersion[key].tradchn[i]
        ) {
          if (typeof s?.func === 'string') {
            return lastVersion[key].tradchn[i];
          }
          return lastVersion[key].tradchn[i];
        }
        if (typeof s?.func === 'string') {
          return { func: T(s.func) };
        }
        return T(s);
      });
    } else {
      if (typeof original[key].chinese?.func == 'string') {
        if (lastVersion[key].chinese?.func == original[key].chinese?.func) {
          original[key].tradchn = lastVersion[key].tradchn;
        } else {
          original[key].tradchn = { func: T(original[key].chinese.func) };
        }
      } else if (lastVersion[key] && lastVersion[key].chinese == original[key].chinese) {
        original[key].tradchn = lastVersion[key].tradchn;
      } else {
        original[key].tradchn = T(original[key].chinese);
      }
    }
  }
}

// build langT.js
const langT: { [key: string]: string | (string | { func: string })[] | { func: string } } & {
  'REPLACE ALL'?: { [key: string]: string };
} = {};

for (let key in original) {
  if (langT[key]) {
    console.error(`duplicate key: "${key}"`);
    process.exit(1);
  }
  if (original[key].tradchn != '[CN:MISSING]') langT[key] = replaceAllForCHT(original[key].tradchn);
}

const BUILD_PATH_CHT = path.join(__dirname, '../build/CookieClickerTCNMod');
fs.mkdirSync(BUILD_PATH_CHT, { recursive: true });

fs.writeFileSync(
  path.join(BUILD_PATH_CHT, 'lang.js'),
  `ModLanguage('ZH-CN',${transformFunc(JSON.stringify(langT))});`
);

// build info.txt
const translatorsT = ['中文潤色與補全，翻譯貢獻者：'];

for (const patch of patches) {
  if (patch?.author) {
    if (translatorsT.indexOf(patch.author) > -1) continue;
    if (translatorsT.length == 1) translatorsT.push(`${patch.author}`);
    else translatorsT.push(`、${patch.author}`);
  }
}

for (const patch of chtPatches) {
  if (patch?.author) {
    if (translatorsT.indexOf(patch.author) > -1) continue;
    if (translatorsT.length == 1) translatorsT.push(`${patch.author}`);
    else translatorsT.push(`、${patch.author}`);
  }
}

translatorsT.push(`與匿名貢獻的各位。`);

const infoT: any = {
  Name: '繁體中文補全模組',
  ID: 'TWCNClickerCNT',
  Author: 'TeeworldsCN',
  Description: translatorsT.join(''),
  ModVersion: Math.floor(Date.now() / 1000),
  GameVersion: metadata.version,
  Date: `${date}/${month}/${year}`,
  Dependencies: [],
  LanguagePacks: ['lang.js'],
  AllowSteamAchievs: true, // just a language mod, we shouldn't break achievements
  Disabled: 1,
};
fs.writeFileSync(path.join(BUILD_PATH_CHT, 'info.txt'), JSON.stringify(infoT, null, 2));

const cht = fs.readFileSync(path.resolve(__dirname, '../resources/script/cht.js'), {
  encoding: 'utf-8',
});

fs.writeFileSync(path.join(BUILD_PATH_CHT, 'main.js'), main.replace('const __TWCNL = {};', cht));

// save current.json
fs.writeFileSync(path.join(INFO_PATH, 'current.json'), JSON.stringify(original, null, 2));
