// script for extracting official strings

require('dotenv').config();
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

type LangFile = { [key: string]: string | string[] };

interface LangDescription {
  english: string | string[];
  chinese: string | string[];
}

const GAMEPATH = path.join(process.env.COOKIECLICKER_PATH, 'resources/app/src/index.html');
const SOURCES = [
  'resources/app/src/main.js',
  'resources/app/src/minigameGarden.js',
  'resources/app/src/minigameGrimoire.js',
  'resources/app/src/minigameMarket.js',
  'resources/app/src/minigamePantheon.js',
  'resources/app/steam/steam.js',
].map(s => path.join(process.env.COOKIECLICKER_PATH, s));

// read game version
const version = fs.readFileSync(GAMEPATH, { encoding: 'utf-8' }).match(/var VERSION=(.*);/);
fs.writeFileSync(
  path.resolve(__dirname, '../resources/metadata.json'),
  JSON.stringify({ version: version ? parseFloat(version[1]) : 2.031 }, null, 2)
);

const langData: { [lang: string]: LangFile } = {};

// require hack for lang files
(global as any).AddLanguage = (lang: string, _: string, data: LangFile) => {
  langData[lang] = data;
};

// load official translations
const EN_LANGPATH = path.join(process.env.COOKIECLICKER_PATH, 'resources/app/src/loc/EN.js');
require(EN_LANGPATH);
const ZH_LANGPATH = path.join(process.env.COOKIECLICKER_PATH, 'resources/app/src/loc/ZH-CN.js');
require(ZH_LANGPATH);

const LANG_DESC: { [key: string]: LangDescription } = {};

// compile language description
for (var key in langData['EN']) {
  if (!key) continue; // ignore header
  LANG_DESC[key] = {
    english: langData['EN'][key] === '/' ? key : langData['EN'][key],
    chinese: '[CN:MISSING]',
  };
}

for (var key in langData['ZH-CN']) {
  if (!key) continue; // ignore header
  var value = langData['ZH-CN'][key] === '/' ? '[CN:MISSING]' : langData['ZH-CN'][key];
  if (LANG_DESC[key]) {
    LANG_DESC[key].chinese = value;
  } else {
    LANG_DESC[key] = {
      english: '[EN:MISSING]',
      chinese: value,
    };
  }
}

// extract plain text in sources
const plains: string[] = [];
for (const source of SOURCES) {
  const matches = fs
    .readFileSync(source, { encoding: 'utf-8' })
    .match(/loc\("((?:[^"]|(?:\\\"))*)"\)/g);

  const loc = (s: string) => plains.push(s);

  for (const match of matches) {
    eval(match);
  }
}

for (const text of plains) {
  if (!LANG_DESC[text]) {
    LANG_DESC[text] = {
      english: text,
      chinese: '[CN:MISSING]',
    };
  }
}

(async () => {
  // puppeteer out runtime strings
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto(`file://${GAMEPATH}`);
  await page.waitForSelector('#langSelect-EN');
  await page.click('#langSelect-EN');
  await page.waitForNetworkIdle();

  const checkByPart = (key: string, english: string) => {
    if (!(key in LANG_DESC)) {
      LANG_DESC[key] = {
        english: english,
        chinese: '[CN:MISSING]',
      };
    }
  };

  // get achievements and upgrades
  const achvupgHandle = await page.evaluateHandle<any, any>(
    'tr_entries=[];for (let i in Game.AchievementsById) { let data = Game.AchievementsById[i]; tr_entries.push({id: parseInt(data.id), name: data.name, desc: data.desc, type: data.getType(), descFunc: !!data.descFunc}) };for (let i in Game.UpgradesById) { let data = Game.UpgradesById[i]; tr_entries.push({id: data.id, name: data.name, desc: data.desc, type: data.getType(), pool: data.pool, descFunc: !!data.descFunc && data.descFunc.toString().indexOf("Unshackled!") == -1}) };JSON.stringify(tr_entries)'
  );
  const achvupg = JSON.parse(await achvupgHandle.jsonValue()) as AchvUpgEntry[];
  interface AchvUpgEntry {
    id: number;
    name: string;
    desc: string;
    type: string;
    pool: string;
    descFunc: boolean;
  }

  const SPECIAL_DESC: AchvUpgEntry[] = [];

  for (const entry of achvupg) {
    // check quote
    const quote = entry.desc.match(/<q>(.*)<\/q>/);
    if (quote) {
      checkByPart(`[${entry.type} quote ${entry.id}]${entry.name}`, quote[1]);
    }
    // check name
    checkByPart(`[${entry.type} name ${entry.id}]${entry.name}`, entry.name);

    if (entry.descFunc) {
      SPECIAL_DESC.push(entry);
    }
  }

  await browser.close();

  // save original language file
  fs.writeFileSync(
    path.resolve(__dirname, '../resources/original.json'),
    JSON.stringify(LANG_DESC, null, 2)
  );

  // save id's for special descriptions
  fs.writeFileSync(
    path.resolve(__dirname, '../resources/special.json'),
    JSON.stringify(SPECIAL_DESC, null, 2)
  );
})();
