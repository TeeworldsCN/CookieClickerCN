// script for extracting official strings

require('dotenv').config();
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

type LangFile = { [key: string]: string | string[] };

interface LangDescription {
  english: string | string[];
  chinese: string | string[];
}

const GAMEPATH = path.join(process.env.COOKIECLICKER_PATH, 'resources/app/src/index.html');

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

// read game version
const version = fs.readFileSync(GAMEPATH, { encoding: 'utf-8' }).match(/var VERSION=(.*);/);
fs.writeFileSync(
  path.resolve(__dirname, '../resources/metadata.json'),
  JSON.stringify({ version: version ? parseFloat(version[1]) : 2.031 }, null, 2)
);

(async () => {
  // puppeteer out achievements and upgrades
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${GAMEPATH}`);
  await page.click('#langSelect-EN');
  await page.waitForTimeout(500);

  const checkByPart = (key: string, english: string) => {
    if (!(key in LANG_DESC)) {
      LANG_DESC[key] = {
        english: english,
        chinese: '[CN:MISSING]',
      };
    }
  };

  // get achievements and upgrades
  const achvupgHandle = await page.evaluateHandle(
    'tr_entries=[];for (let i in Game.AchievementsById) { let data = Game.AchievementsById[i]; tr_entries.push({id: parseInt(data.id), name: data.name, desc: data.desc, type: data.getType()}) };for (let i in Game.UpgradesById) { let data = Game.UpgradesById[i]; tr_entries.push({id: data.id, name: data.name, desc: data.desc, type: data.getType()}) };JSON.stringify(tr_entries)'
  );
  const achvupg = JSON.parse(await achvupgHandle.jsonValue()) as AchvUpgEntry[];
  interface AchvUpgEntry {
    id: number;
    name: string;
    desc: string;
    type: string;
  }
  for (const entry of achvupg) {
    // check quote
    const quote = entry.desc.match(/<q>(.*)<\/q>/);
    if (quote) {
      checkByPart(`[${entry.type} quote ${entry.id}]${entry.name}`, quote[1]);
    }
    // check name
    checkByPart(`[${entry.type} name ${entry.id}]${entry.name}`, entry.name);
  }

  await browser.close();

  // save original language file
  fs.writeFileSync(
    path.resolve(__dirname, '../resources/original.json'),
    JSON.stringify(LANG_DESC, null, 2)
  );
})();
