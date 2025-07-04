var __TWCNL = {};

(function () {
  const __TWCNG = {
    // 按键
    UNIT_TOGGLE_KEY: 90,

    // 数字长度设置
    CN_NUMBER_LEN: [
      { threshold: 1e16, sciDecimals: 12 },
      { threshold: 1e13, sciDecimals: 9 },
      { threshold: 1e10, sciDecimals: 6 },
      { threshold: 1e7, sciDecimals: 3 },
    ],

    // 万亿
    CN_UNIT_TRILLION: __TWCNL.CN_UNITS_MIN[3] + __TWCNL.CN_UNITS_MIN[4],

    // 尾记中文单位
    FormatterCN: (val, floats) => {
      if (!isFinite(val)) return loc('[CCCN]INFINITY');
      let unit = '';
      if (val >= 1e4) {
        for (const u of __TWCNL.CN_UNITS) {
          if (!Game.prefs.numbercntrillion && u[2] == 12) continue;
          if (val >= u[0]) {
            val = Math.round(val / (u[0] / 10000)) / 10000;
            unit = u[1];
            break;
          }
        }
        for (var i = 0; i < __TWCNL.CN_UNITS_STACKABLE.length - Game.prefs.numbercnminunit; i++) {
          const u = __TWCNL.CN_UNITS_STACKABLE[i];
          while (val >= u[0]) {
            val = Math.round(val / (u[0] / 10000)) / 10000;
            unit = u[1] + unit;
          }
        }

        const prec = Game.prefs.numbercndecimal;
        if (Game.prefs.numbercnfixlen) {
          return (
            (Math.floor(val * prec) / prec)
              .toFixed(Game.prefs.numbercndecimallen)
              .replace(/\B(?=(\d{4})+(?!\d))/g, '\u2008') + unit
          );
        } else {
          return (
            (Math.floor(val * prec) / prec).toString().replace(/\B(?=(\d{4})+(?!\d))/g, '\u2008') +
            unit
          );
        }
      } else {
        return val.toString();
      }
    },

    // 叠记中文单位
    FormatterCNFull: val => {
      if (!isFinite(val)) return loc('[CCCN]INFINITY');

      const minUnit = Math.min(Game.prefs.numbercnminunit, 3);
      const minValue = Math.pow(10, minUnit + 1);
      const groups = Game.prefs.numbercnfullsegs;
      if (groups < 1) groups = 1;
      if (groups > 3) groups = 3;

      const safeConcat = (pre, cur, unit, order, ignoreCur) => {
        if (unit) {
          cur.high = cur.high + order;
          cur.low = order;
        }

        if (pre.low - cur.high > 1) {
          if (minUnit == 0) {
            cur.text = __TWCNL.CN_UNITS_NUM[0] + cur.text;
          } else {
            cur.text = ('0' + cur.text).padStart(minUnit + 1, '0');
          }
        }

        if (unit) {
          cur.text = ignoreCur ? unit : cur.text + unit;
        }

        const text =
          pre.text.endsWith(__TWCNG.CN_UNIT_TRILLION) && cur.text.endsWith(__TWCNL.CN_UNITS_MIN[4])
            ? pre.text.slice(0, -1) + cur.text
            : pre.text + cur.text;

        return { text, high: Math.max(cur.high, pre.high), low: cur.low };
      };

      const segmenting = (val, sub) => {
        let segments = { text: '', high: 0, low: 0 };

        if (val <= 0) {
          return {
            text: '',
            high: 0,
            low: 0,
          };
        }

        if (val < minValue) {
          val = Math.floor(val);
          if (minUnit == 0) return { text: __TWCNL.CN_UNITS_NUM[val], high: 0, low: 0 };
          let text = val > 0 ? val.toString() : '';
          return {
            text,
            high: text.length - 1,
            low: 0,
          };
        }

        let units = 0;

        const sliceUnit = (val, u) => {
          if (val >= u[0]) {
            const segment = Math.floor(val / u[0]);
            val -= segment * u[0];
            if (segment > 0) {
              segments = safeConcat(
                segments,
                segmenting(segment, true),
                u[1],
                u[2],
                sub && units == 0 && segment == 1 && u[2] == 1
              );
            }
            units++;
          } else if (units > 1) {
            units++;
          }
          return val;
        };

        if (!sub) {
          for (const u of __TWCNL.CN_UNITS) {
            if (units >= groups) break;
            if (val <= 0) break;
            if (!Game.prefs.numbercntrillion && u[2] == 12) {
              val = sliceUnit(val, [u[0], __TWCNG.CN_UNIT_TRILLION, u[2]]);
            } else {
              val = sliceUnit(val, u);
            }
          }
        }

        for (const u of __TWCNL.CN_UNITS_STACKABLE) {
          if (!sub && units >= groups) break;
          if (val <= 0) break;

          if (val < minValue) {
            segments = safeConcat(segments, segmenting(val, true));
            val = 0;
            break;
          } else {
            val = sliceUnit(val, u);
          }
        }

        if (val > 0 && (sub || units < groups)) {
          segments = safeConcat(segments, segmenting(val, true));
        }
        return segments;
      };

      return segmenting(val, val < 1e8).text || (minUnit == 0 ? __TWCNL.CN_UNITS_NUM[0] : '0');
    },

    // 替换科学计数法
    SUPNUM: [
      '\u2070',
      '\u00B9',
      '\u00B2',
      '\u00B3',
      '\u2074',
      '\u2075',
      '\u2076',
      '\u2077',
      '\u2078',
      '\u2079',
    ],
    FormatterScientific: (val, decimals) => {
      const [coefficient, exponent] = val.toExponential(decimals).split('e');
      let [integer, decimal] = coefficient.split('.');

      decimal ??= '';

      if (__TWCNG.isModdingAchievement)
        while (decimal.endsWith('000')) decimal = decimal.slice(0, -3);

      let superscript = '';
      let negative = false;
      for (var i = 0; i < exponent.length; i++) {
        if (exponent.charAt(i) == '+') {
          negative = false;
          continue;
        }
        if (exponent.charAt(i) == '-') {
          negative = true;
          continue;
        }
        superscript += __TWCNG.SUPNUM[exponent.charCodeAt(i) - 48];
      }

      let decimalPart = decimal.match(/.{1,3}/g);
      if (!decimalPart) decimalPart = decimal;
      else decimalPart = decimalPart.join('\u2008');

      return (
        integer +
        (decimalPart ? '.' : '') +
        decimalPart +
        '×10' +
        (negative ? '⁻' : '') +
        superscript
      );
    },

    FormatterGroupThree: val => {
      return Math.floor(Math.round(val * 1000) / 1000)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    SaveDataMap: {
      s: 'numbercnsci',
      c: 'numbercn',
      u: 'numbercnfull',
      g: 'numbercnfullsegs',
      l: 'numbercnscilen',
      d: 'numbercndecimallen',
      m: 'numbercnminunit',
      t: 'numbercntrillion',
      b: 'brandcn',
      f: 'numbercnfixlen',
      o: 'fontcn',
    },

    // 满足以下条件则不显示饼干名
    CookieNameRegex: [
      / cookies?$/i,
      / crumbs?$/i,
      / biscuits?$/i,
      / macarons?$/i,
      / digestives?$/i,
      / pie$/i,
      / dough$/i,
      / motif$/,
      / donut$/,
      / cake$/,
      /^Gingerbread /,
    ],

    // 不显示以下饼干名
    CookieNameBlacklist: new Set([
      341, // Cigars
      407, // Ice cream sandwiches
      476, // Wheat slims
      550, // croissant
      553, // the chip taken out one
      556, // Toast
      559, // Cheeseburger
      560, // the lone chip one
      610, // Pizza,
      620, // Candy,
      657, // Taiyaki
      699, // Butter biscuit (with butter)
    ]),

    // 必显示以下饼干名
    CookieNameWhitelist: new Set([
      340, // Vanity
      401, // Lombardia
      402, // Bastenaken
      405, // Anzac
      536, // Burbon
      580, // Nice
      584, // Berger
      608, // Marie
      652, // Granola
      653, // Ricotta
      678, // Battenberg
      723, // Ischler
      807, // Dalgona
      810, // Kolachy
      811, // Gomma
      817, // Steamed
      870, // Spritz
      871, // Mbatata
    ]),
  };

  // 中文数字魔改
  const ModGameUnit = MOD => {
    const oldBeautify = Beautify;
    Beautify = (val, floats) => {
      let negative = val < 0;
      let decimal = '';
      let fixed = val.toFixed(floats);
      if (Math.abs(val) < 1000 && floats > 0 && Math.floor(fixed) != fixed)
        decimal = '.' + fixed.toString().split('.')[1];
      val = Math.floor(Math.abs(val));
      if (floats > 0 && fixed == val + 1) val++;
      let output;

      const numLen = __TWCNG.CN_NUMBER_LEN[Game.prefs.numbercnscilen];

      if (
        Game.prefs.numbercn &&
        Game.keys[__TWCNG.UNIT_TOGGLE_KEY] != 1 &&
        (val < 1e88 || !isFinite(val))
      ) {
        output = Game.prefs.numbercnfull ? __TWCNG.FormatterCNFull(val) : __TWCNG.FormatterCN(val);
      } else {
        output = Game.prefs.numbercnsci
          ? val >= numLen.threshold
            ? __TWCNG.FormatterScientific(val, numLen.sciDecimals)
            : __TWCNG.FormatterGroupThree(val)
          : oldBeautify(val, floats);
      }

      if (output == '0') negative = false;
      if (Game.prefs.numbercnfull) {
        const numeralDecimal = decimal;
        decimal = '';
        for (const c of numeralDecimal) {
          if (Game.prefs.numbercnminunit == 0 && c == '.') {
            decimal += __TWCNL.CN_FLOATING_POINT;
          } else {
            const numeral = c.charCodeAt(0) - 48;
            if (Game.prefs.numbercnminunit == 0 && numeral >= 0 && numeral <= 9)
              decimal += __TWCNL.CN_UNITS_NUM[numeral];
            else decimal += c;
          }
        }
      }
      return negative ? '-' + output : output + decimal;
    };
  };

  // 翻译花园小游戏的提示图片（因为里面有文本）
  const ModGardenTooltip = (MOD, M) => {
    let oldDescFunc = M.tools.info.descFunc;
    M.tools.info.descFunc = function () {
      return oldDescFunc().replace(
        '<img src="img/gardenTip.png" style="float:right;margin:0px 0px 8px 8px;"/>',
        '<img src="' +
          MOD.dirURI +
          '/gardenTip.png" width="120px" style="float:right;margin:0px 0px 8px 8px;"/>'
      );
    };
  };

  // 将花园收获饼干Popup改为Notify，避免和解锁种子提示冲突，并修复收获饼干数量没有翻译的问题
  const ModGardenPopup = (MOD, M) => {
    M.plants.bakeberry.onHarvest = function (x, y, age) {
      if (age >= this.mature) {
        let moni = Math.min(Game.cookies * 0.03, Game.cookiesPs * 60 * 30);
        if (moni != 0) {
          Game.Earn(moni);
          Game.Notify(
            loc('You harvested %1', this.name),
            loc('Found <b>%1</b>!', loc('%1 cookie', Beautify(moni))),
            [0, this.icon, 'img/gardenPlants.png'],
            6
          );
        }
        M.dropUpgrade('Bakeberry cookies', 0.015);
      }
    };
    M.plants.chocoroot.onHarvest = function (x, y, age) {
      if (age >= this.mature) {
        let moni = Math.min(Game.cookies * 0.03, Game.cookiesPs * 60 * 3);
        if (moni != 0) {
          Game.Earn(moni);
          Game.Notify(
            loc('You harvested %1', this.name),
            loc('Found <b>%1</b>!', loc('%1 cookie', Beautify(moni))),
            [0, this.icon, 'img/gardenPlants.png'],
            6
          );
        }
      }
    };
    M.plants.whiteChocoroot.onHarvest = function (x, y, age) {
      if (age >= this.mature) {
        let moni = Math.min(Game.cookies * 0.03, Game.cookiesPs * 60 * 3);
        if (moni != 0) {
          Game.Earn(moni);
          Game.Notify(
            loc('You harvested %1', this.name),
            loc('Found <b>%1</b>!', loc('%1 cookie', Beautify(moni))),
            [0, this.icon, 'img/gardenPlants.png'],
            6
          );
        }
      }
    };
    M.plants.queenbeet.onHarvest = function (x, y, age) {
      if (age >= this.mature) {
        let moni = Math.min(Game.cookies * 0.04, Game.cookiesPs * 60 * 60);
        if (moni != 0) {
          Game.Earn(moni);
          Game.Notify(
            loc('You harvested %1', this.name),
            loc('Found <b>%1</b>!', loc('%1 cookie', Beautify(moni))),
            [0, this.icon, 'img/gardenPlants.png'],
            6
          );
        }
      }
    };
    M.plants.duketater.onHarvest = function (x, y, age) {
      if (age >= this.mature) {
        let moni = Math.min(Game.cookies * 0.08, Game.cookiesPs * 60 * 60 * 2);
        if (moni != 0) {
          Game.Earn(moni);
          Game.Notify(
            loc('You harvested %1', this.name),
            loc('Found <b>%1</b>!', loc('%1 cookie', Beautify(moni))),
            [0, this.icon, 'img/gardenPlants.png'],
            6
          );
          M.dropUpgrade('Duketater cookies', 0.005);
        }
      }
    };
    M.plants.crumbspore.onDie = function (x, y) {
      let moni = Math.min(Game.cookies * 0.01, Game.cookiesPs * 60) * Math.random();
      if (moni != 0) {
        Game.Earn(moni);
        Game.Notify(
          loc('%1 decayed', this.name),
          loc('Exploded into <b>%1</b>!', loc('%1 cookie', Beautify(moni))),
          [0, this.icon, 'img/gardenPlants.png'],
          6
        );
      }
    };
    M.plants.doughshroom.onDie = function (x, y) {
      let moni = Math.min(Game.cookies * 0.03, Game.cookiesPs * 60 * 5) * Math.random();
      if (moni != 0) {
        Game.Earn(moni);
        Game.Notify(
          loc('%1 decayed', this.name),
          loc('Exploded into <b>%1</b>!', loc('%1 cookie', Beautify(moni))),
          [0, this.icon, 'img/gardenPlants.png'],
          6
        );
      }
    };
  };

  // 花园小游戏加载检查器
  const ModGarden = MOD => {
    const gardenChecker = () => {
      if (Game.isMinigameReady(Game.Objects['Farm'])) {
        let M = Game.Objects['Farm'].minigame;
        ModGardenTooltip(MOD, M);
        ModGardenPopup(MOD, M);
      } else {
        setTimeout(gardenChecker, 500);
      }
    };
    gardenChecker();
  };

  // 修复股票小游戏内未翻译的文本
  const ModMarket = MOD => {
    const hackMarket = () => {
      if (Game.isMinigameReady(Game.Objects['Bank'])) {
        let M = Game.Objects['Bank'].minigame;
        M.loanTypes[2][0] = loc('a retirement loan');
        const oldGoodTooltip = M.goodTooltip;
        M.goodTooltip = id => {
          let func = oldGoodTooltip(id);
          return () =>
            func().replace(
              '<div class="line"></div>',
              '<div class="line"></div><div class="description">' +
                '<q>' +
                loc(
                  FindLocStringByPart('STOCK ' + (id + 1) + ' DESC'),
                  id == 17 ? Game.bakeryName : undefined // “你”商品的文本需要玩家变量
                ) +
                '</q>' +
                '<div class="line">'
            );
        };
      } else {
        setTimeout(hackMarket, 500);
      }
    };
    hackMarket();
  };

  // 修复Santa升级提示中未翻译的文本
  const ModUpgrade152 = MOD => {
    Game.UpgradesById[152].buyFunction = function () {
      const drop = choose(Game.santaDrops);
      Game.Unlock(drop);
      const dropName = Game.Upgrades[drop].dname;
      Game.Notify(
        loc('In the festive hat, you find...'),
        loc('a festive test tube<br>and <b>%1</b>.', dropName),
        Game.Upgrades[drop].icon
      );
    };
  };

  // 修复黄金开关未翻译的文本
  const ModUpgrade332 = MOD => {
    Game.UpgradesById[332].descFunc = function () {
      if (Game.Has('Residual luck')) {
        let bonus = 0;
        const upgrades = Game.goldenCookieUpgrades;
        for (let i in upgrades) {
          if (Game.Has(upgrades[i])) bonus++;
        }
        return (
          '<div style="text-align:center;">' +
          Game.listTinyOwnedUpgrades(Game.goldenCookieUpgrades) +
          '<br><br>' +
          loc(
            'The effective boost is <b>+%1%</b><br>thanks to residual luck<br>and your <b>%2</b> %3.',
            [
              Beautify(Math.round(50 + bonus * 10)),
              Beautify(bonus),
              loc('golden cookie upgrade', bonus),
            ]
          ) +
          '</div><div class="line"></div>' +
          this.ddesc
        );
      }
      return this.desc;
    };
  };

  // 修复巧克力蛋提示中未翻译的文本
  const ModUpgrade227 = MOD => {
    Game.UpgradesById[227].buyFunction = function () {
      const cookies = Game.cookies * 0.05;
      Game.Notify(
        Game.Upgrades['Chocolate egg'].dname,
        loc('The egg bursts into <b>%1</b> cookies!', Beautify(cookies)),
        Game.Upgrades['Chocolate egg'].icon
      );
      Game.Earn(cookies);
    };
  };

  // 魔改一个带特效的分形引擎引文
  const ModUpgrade531 = MOD => {
    Game.UpgradesById[531].descFunc = function () {
      var str = loc('[CCCN]U531', Game.bakeryName);
      var i = Math.floor(Game.T * 0.1) % 100;
      var offset = 'transform:translate3d(-' + i + '%, 5px, 0);';
      return (
        this.baseDesc +
        '<style>.CNS{margin-left:2px;margin-right:2px;max-width:250px;overflow:hidden;display:inline-block;white-space:nowrap;}.CNS p{white-space:nowrap;overflow:hidden;display:inline-block;}</style>' +
        '<q style="font-style:normal;font-family:Courier monospace;white-space:nowrap;">' +
        '<span class="CNS"><p style="' +
        offset +
        '">' +
        str +
        '</p><p style="' +
        offset +
        '">' +
        str +
        '</p></span></q>'
      );
    };
  };

  // 魔改点鼠标的老鼠的随机引文
  const ModUpgrade534 = MOD => {
    Game.UpgradesById[534].descFunc = function () {
      Math.seedrandom(Game.seed + '-blasphemouse');
      if (Math.random() < 0.3) {
        Math.seedrandom();
        return `${this.baseDesc}<q>${loc('[CCCN]U534A')}</q>`;
      } else {
        Math.seedrandom();
        return `${this.baseDesc}<q>${loc('[CCCN]U534B')}</q>`;
      }
    };
  };

  // 魔改猴子排序的随机引文
  const ModUpgrade606 = MOD => {
    const shuffle = arr => {
      var i = arr.length,
        j,
        temp;
      if (i == 0) return arr;
      while (--i) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    };

    Game.UpgradesById[606].descFunc = function () {
      Math.seedrandom(Game.seed + '-tombolacomputing');
      const red = [];
      const blue = [];
      for (let i = 1; i <= 33; i++) {
        if (i < 10) red.push('0' + i.toString());
        else red.push(i.toString());
      }
      for (let i = 1; i <= 16; i++) {
        if (i < 10) blue.push('0' + i.toString());
        else blue.push(i.toString());
      }

      const code = shuffle(red).slice(0, 6).join(' ') + '-' + shuffle(blue)[0];
      const str = loc('[CCCN]U606', code);

      Math.seedrandom();
      return `${this.baseDesc}<q>${str}</q>`;
    };
  };

  // 修复彩蛋掉落未翻译的文本
  const ModDropEgg = MOD => {
    Game.DropEgg = failRate => {
      failRate *= 1 / Game.dropRateMult();
      if (Game.season != 'easter') return;
      if (Game.HasAchiev('Hide & seek champion')) failRate *= 0.7;
      if (Game.Has('Omelette')) failRate *= 0.9;
      if (Game.Has('Starspawn')) failRate *= 0.9;
      if (Game.hasGod) {
        const godLvl = Game.hasGod('seasons');
        if (godLvl == 1) failRate *= 0.9;
        else if (godLvl == 2) failRate *= 0.95;
        else if (godLvl == 3) failRate *= 0.97;
      }
      if (Math.random() >= failRate) {
        let drop = '';
        if (Math.random() < 0.1) drop = choose(Game.rareEggDrops);
        else drop = choose(Game.eggDrops);
        if (Game.Has(drop) || Game.HasUnlocked(drop)) {
          //reroll if we have it
          if (Math.random() < 0.1) drop = choose(Game.rareEggDrops);
          else drop = choose(Game.eggDrops);
        }
        if (Game.Has(drop) || Game.HasUnlocked(drop)) return;
        Game.Unlock(drop);
        Game.Notify(
          loc('You found an egg!'),
          '<b>' + Game.Upgrades[drop].dname + '</b>',
          Game.Upgrades[drop].icon
        );
      }
    };
  };

  // 修复抚摸龙掉落未翻译的通知
  const ModTouchSpecialPic = MOD => {
    Game.ClickSpecialPic = function () {
      if (
        Game.specialTab == 'dragon' &&
        Game.dragonLevel >= 4 &&
        Game.Has('Pet the dragon') &&
        l('specialPic')
      ) {
        triggerAnim(l('specialPic'), 'pucker');
        PlaySound('snd/click' + Math.floor(Math.random() * 7 + 1) + '.mp3', 0.5);
        if (Date.now() - Game.lastClickedSpecialPic > 2000) PlaySound('snd/growl.mp3');
        //else if (Math.random()<0.5) PlaySound('snd/growl.mp3',0.5+Math.random()*0.2);
        Game.lastClickedSpecialPic = Date.now();
        if (Game.prefs.particles) {
          Game.particleAdd(
            Game.mouseX,
            Game.mouseY - 32,
            Math.random() * 4 - 2,
            Math.random() * -2 - 4,
            Math.random() * 0.2 + 0.5,
            1,
            2,
            [20, 3]
          );
        }
        if (Game.dragonLevel >= 8 && Math.random() < 1 / 20) {
          Math.seedrandom(Game.seed + '/dragonTime');
          var drops = ['Dragon scale', 'Dragon claw', 'Dragon fang', 'Dragon teddy bear'];
          drops = shuffle(drops);
          var drop = drops[Math.floor((new Date().getMinutes() / 60) * drops.length)];
          if (!Game.Has(drop) && !Game.HasUnlocked(drop)) {
            Game.Unlock(drop);
            Game.Notify(
              Game.Upgrades[drop].dname,
              '<b>' + loc('Your dragon dropped something!') + '</b>',
              Game.Upgrades[drop].icon
            );
          }
          Math.seedrandom();
        }
      }
    };
  };

  // 升级提示魔改
  const ModCrateTooltip = MOD => {
    const oldCrateTooltip = Game.crateTooltip;
    Game.crateTooltip = function (me, context) {
      let result = oldCrateTooltip(me, context);

      // 小猫购买提示魔改
      if (me.kitten) result = result.replace(loc('[CCCN]PURCHASE'), loc('[CCCN]PURRCHASE'));

      // 饼干原名显示功能
      if (me.pool === 'cookie') {
        const showName = () => {
          if (Game.prefs.brandcn && __TWCNL.BRAND_COOKIE_CN && __TWCNL.BRAND_COOKIE_CN[me.id])
            return false;
          if (__TWCNG.CookieNameWhitelist.has(me.id)) return true;
          if (__TWCNG.CookieNameBlacklist.has(me.id)) return false;

          for (const regex of __TWCNG.CookieNameRegex) {
            if (regex.test(me.name)) {
              return false;
            }
          }
          return true;
        };

        if (showName()) {
          result = result.replace(
            '<div class="tag"',
            `<div class="subname">\(${me.name}\)</div><div class="tag"`
          );
        }
      }

      // result = result.replace(
      //   '<div class="tag"',
      //   `<div class="id">\(${me.id}\)</div><div class="tag"`
      // );
      return result;
    };
  };

  // 建筑物 Tooltip 魔改
  const ModObjectTooltip = MOD => {
    for (const i in Game.Objects) {
      const oldTooltip = Game.Objects[i].tooltip;
      Game.Objects[i].tooltip = function () {
        let result = oldTooltip.bind(this)();
        if (this.actionName) {
          result = result.replace(new RegExp(loc('[CCCN]BUILDING_ACTION_REGEX')), (og, num) => {
            const localized = loc(`[CCCN]ACTION ${this.actionName}`, `<b>${num}</b>`, 'NF');
            return localized === 'NF' ? og : localized;
          });
        }
        return result;
      };
    }
  };

  // 升级 Tooltip 魔改
  const ModObjectLevelTooltip = MOD => {
    for (const i in Game.Objects) {
      const oldLevelTooltip = Game.Objects[i].levelTooltip;
      Game.Objects[i].levelTooltip = function () {
        let result = oldLevelTooltip.bind(this)();
        if (this.extraName) {
          if (this.level) {
            result = result.replace(new RegExp(loc('[CCCN]BUILDING_EXTRANAME_REGEX')), og => {
              const localized = loc(
                `[CCCN]EXTRANAME ${this.extraName}`,
                this.level.toString(),
                'NF'
              );
              return localized === 'NF' ? og : `${localized}${og}`;
            });
          }
        }
        return result;
      };
    }
  };

  // 重写 Tickers 逻辑 (用于支持非英文屏蔽掉的 Tickers)
  const ModTickers2048 = MOD => {
    Game.getNewTicker = manual => {
      const list = [];

      const PUSH = str => str && list.push(str);
      const CONCAT = str => list.push(...str.filter(() => !!str));
      const CLEAR = () => list.splice(0, list.length);
      const SCARY = !Game.prefs.notScary;
      const NEWS_PREFIX = loc('News :').replace(' ', '&nbsp;') + ' ';
      const NEWS = content => content && `${NEWS_PREFIX}${content}`;
      const GRANDMA = says => `<q>${says}</q><sig>${Game.Objects['Grandma'].single}</sig>`;
      const BUILT = (name, num = 1) => Game.Objects[name].amount >= num;
      const ACHIEVED = name => Game.HasAchiev(name);
      const UPGRADED = name => Game.Has(name);
      const CHANCE = percentage => Math.random() < percentage / 100;
      const EARNED = amount => Game.cookiesEarned >= amount;
      const SEASON = name => Game.season == name.toLowerCase();
      // const PLEDGES = amount => Game.pledges >= amount;
      const PLEDGED = Game.pledges > 0;
      const WRATH = Game.elderWrath != 0;
      const RESET = Game.resets != 0;

      const L = key => {
        if (key in locStrings) return loc(key);
        return null;
      };

      const C = arr => {
        if (arr && Array.isArray(arr)) return choose(arr);
        return null;
      };

      const PUSH_WITH = (cond, name, news = true) => {
        if (cond(name)) {
          const localized = L(`Ticker (${name})`);
          if (!localized) return;
          if (Array.isArray(localized)) {
            list.push(news ? NEWS(C(localized)) : C(localized));
          } else {
            list.push(news ? NEWS(localized) : localized);
          }
        }
      };

      if (SEASON('Fools')) {
        // 愚人新闻
        if (EARNED(1000)) PUSH(C(L('Ticker (fools 2048)')));
        if (EARNED(1000) && CHANCE(10)) PUSH(C(L('Ticker (fools rare 2048)')));

        if (Game.TickerN % 2 == 0 || EARNED(10100000000)) {
          // 建筑新闻
          for (var obj in Game.Objects) {
            if (obj != 'Cursor' && obj != 'Grandma' && BUILT(obj))
              PUSH(NEWS(C(L(`Ticker (fools ${obj})`))));
          }
        }

        if (!EARNED(5)) {
          PUSH(L('Such a grand day to begin a new business.'));
        } else if (!EARNED(50)) {
          PUSH(L("You're baking up a storm!"));
        } else if (!EARNED(100)) {
          PUSH(
            L(
              'You are confident that one day, your cookie company will be the greatest on the market!'
            )
          );
        } else if (!EARNED(1000)) {
          PUSH(L('Business is picking up!'));
        } else if (!EARNED(5000)) {
          PUSH(L("You're making sales left and right!"));
        } else if (!EARNED(20000)) {
          PUSH(L('Everyone wants to buy your cookies!'));
        } else if (!EARNED(50000)) {
          PUSH(L('You are now spending most of your day signing contracts!'));
        } else if (!EARNED(500000)) {
          PUSH(L('You\'ve been elected "business tycoon of the year"!'));
        } else if (!EARNED(1000000)) {
          PUSH(L('Your cookies are a worldwide sensation! Well done, old chap!'));
        } else if (!EARNED(5000000)) {
          PUSH(
            L(
              'Your brand has made its way into popular culture. Children recite your slogans and adults reminisce them fondly!'
            )
          );
        } else if (!EARNED(1000000000)) {
          PUSH(L("A business day like any other. It's good to be at the top!"));
        } else if (!EARNED(10100000000)) {
          PUSH(
            L(
              "You look back at your career. It's been a fascinating journey, building your baking empire from the ground up."
            )
          );
        }
      } else if (WRATH && ((PLEDGED && !RESET && CHANCE(30)) || CHANCE(3))) {
        // 天启新闻
        if (Game.elderWrath == 1) PUSH(NEWS(C(L('Ticker (grandma invasion start)'))));
        if (Game.elderWrath == 2) PUSH(NEWS(C(L('Ticker (grandma invasion rise)'))));
        if (Game.elderWrath == 3) PUSH(NEWS(C(L('Ticker (grandma invasion full)'))));
      } else {
        // 正常新闻
        if (Game.TickerN % 2 == 0 || EARNED(10100000000)) {
          if (CHANCE(75) || !EARNED(10000)) {
            // 老奶奶新闻
            if (BUILT('Grandma')) {
              PUSH(GRANDMA(C(L('Ticker (grandma)'))));
            }

            if (SCARY && BUILT('Grandma', 50)) {
              PUSH(GRANDMA(C(L('Ticker (threatening grandma)'))));
            }

            if (SCARY && ACHIEVED('Just wrong') && CHANCE(40)) {
              PUSH(GRANDMA(C(L('Ticker (angry grandma)'))));
            }

            if (SCARY && BUILT('Grandma') && PLEDGED && !WRATH) {
              PUSH(GRANDMA(C(L('Ticker (grandmas return)'))));
            }

            // 建筑新闻
            for (var obj in Game.Objects) {
              if (obj != 'Cursor' && obj != 'Grandma' && BUILT(obj))
                PUSH(NEWS(C(L(`Ticker (${obj})`))));
            }

            // 季节新闻
            if (EARNED(1000)) {
              PUSH_WITH(SEASON, 'Halloween');
              PUSH_WITH(SEASON, 'Christmas');
              PUSH_WITH(SEASON, 'Valentines');
              PUSH_WITH(SEASON, 'Easter');
            }
          }

          // 升级与成就新闻（补充）
          if (CHANCE(5)) {
            PUSH_WITH(ACHIEVED, 'Base 10');
            PUSH_WITH(ACHIEVED, 'From scratch');
            PUSH_WITH(ACHIEVED, 'A world filled with cookies');
            PUSH_WITH(ACHIEVED, 'Last Chance to See');
            PUSH_WITH(UPGRADED, 'Serendipity');
            PUSH_WITH(UPGRADED, 'Season switcher');
            PUSH_WITH(UPGRADED, 'Kitten helpers');
            PUSH_WITH(UPGRADED, 'Kitten workers');
            PUSH_WITH(UPGRADED, 'Kitten engineers');
            PUSH_WITH(UPGRADED, 'Kitten overseers');
            PUSH_WITH(UPGRADED, 'Kitten managers');
            PUSH_WITH(UPGRADED, 'Kitten accountants');
            PUSH_WITH(UPGRADED, 'Kitten specialists');
            PUSH_WITH(UPGRADED, 'Kitten experts');
            PUSH_WITH(UPGRADED, 'Kitten consultants');
            PUSH_WITH(UPGRADED, 'Kitten assistants to the regional manager');
            PUSH_WITH(UPGRADED, 'Kitten marketeers');
            PUSH_WITH(UPGRADED, 'Kitten analysts');
            PUSH_WITH(UPGRADED, 'Kitten executives');
            PUSH_WITH(UPGRADED, 'Kitten admins');
            PUSH_WITH(UPGRADED, 'Kitten angels');
            PUSH_WITH(UPGRADED, 'Kitten wages');
            PUSH_WITH(ACHIEVED, 'Jellicles');
          }

          // 糖块新闻
          if (CHANCE(20)) {
            PUSH_WITH(ACHIEVED, 'Dude, sweet');
          }

          // 稀有新闻
          if (CHANCE(0.1)) {
            CONCAT(L('Ticker (misc rare)'));
          }

          // 杂项新闻
          if (EARNED(10000)) {
            PUSH(NEWS(C(L('Ticker (misc extended 1)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 2)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 3)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 4)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 5)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 6)'))));
          }
        }

        // 孤独新闻
        if (list.length == 0) {
          if (!EARNED(5)) {
            PUSH(L('You feel like making cookies. But nobody wants to eat your cookies.'));
          } else if (!EARNED(50)) {
            PUSH(
              L('Your first batch goes to the trash. The neighborhood raccoon barely touches it.')
            );
          } else if (!EARNED(100)) {
            PUSH(L('Your family accepts to try some of your cookies.'));
          } else if (!EARNED(500)) {
            PUSH(L('Your cookies are popular in the neighborhood.'));
          } else if (!EARNED(1000)) {
            PUSH(L('People are starting to talk about your cookies.'));
          } else if (!EARNED(5000)) {
            PUSH(L('Your cookies are talked about for miles around.'));
          } else if (!EARNED(10000)) {
            PUSH(L('Your cookies are renowned in the whole town!'));
          } else if (!EARNED(50000)) {
            PUSH(L('Your cookies bring all the boys to the yard.'));
          } else if (!EARNED(100000)) {
            PUSH(L('Your cookies now have their own website!'));
          } else if (!EARNED(500000)) {
            PUSH(L('Your cookies are worth a lot of money.'));
          } else if (!EARNED(1000000)) {
            PUSH(L('Your cookies sell very well in distant countries.'));
          } else if (!EARNED(5000000)) {
            PUSH(L('People come from very far away to get a taste of your cookies.'));
          } else if (!EARNED(10000000)) {
            PUSH(L('Kings and queens from all over the world are enjoying your cookies.'));
          } else if (!EARNED(50000000)) {
            PUSH(L('There are now museums dedicated to your cookies.'));
          } else if (!EARNED(100000000)) {
            PUSH(L('A national day has been created in honor of your cookies.'));
          } else if (!EARNED(500000000)) {
            PUSH(L('Your cookies have been named a part of the world wonders.'));
          } else if (!EARNED(1000000000)) {
            PUSH(L('History books now include a whole chapter about your cookies.'));
          } else if (!EARNED(5000000000)) {
            PUSH(L('Your cookies have been placed under government surveillance.'));
          } else if (!EARNED(10000000000)) {
            PUSH(L('The whole planet is enjoying your cookies!'));
          } else if (!EARNED(50000000000)) {
            PUSH(L('Strange creatures from neighboring planets wish to try your cookies.'));
          } else if (!EARNED(100000000000)) {
            PUSH(L('Elder gods from the whole cosmos have awoken to taste your cookies.'));
          } else if (!EARNED(500000000000)) {
            PUSH(
              L(
                'Beings from other dimensions lapse into existence just to get a taste of your cookies.'
              )
            );
          } else if (!EARNED(1000000000000)) {
            PUSH(L('Your cookies have achieved sentience.'));
          } else if (!EARNED(5000000000000)) {
            PUSH(L('The universe has now turned into cookie dough, to the molecular level.'));
          } else if (!EARNED(10000000000000)) {
            PUSH(L('Your cookies are rewriting the fundamental laws of the universe.'));
          } else if (!EARNED(10000000000000)) {
            PUSH(
              L(
                'A Lal news station runs a 10-minute segment about your cookies. Success!<br><small>(you win a cookie)</small>'
              )
            );
          } else if (!EARNED(10100000000000)) {
            PUSH(L("it's time to stop playing"));
          }
        }
      }

      for (var i = 0; i < Game.modHooks['ticker'].length; i++) {
        var arr = Game.modHooks['ticker'][i]();
        if (arr) list = list.concat(arr);
      }

      Game.TickerEffect = 0;

      // 幸运新闻
      if (
        !manual &&
        Game.T > Game.fps * 10 &&
        Game.Has('Fortune cookies') &&
        Math.random() < (Game.HasAchiev('O Fortuna') ? 0.04 : 0.02)
      ) {
        var fortunes = [];
        for (var i in Game.Tiers['fortune'].upgrades) {
          var it = Game.Tiers['fortune'].upgrades[i];
          if (!Game.HasUnlocked(it.name)) fortunes.push(it);
        }

        if (!Game.fortuneGC) fortunes.push('fortuneGC');
        if (!Game.fortuneCPS) fortunes.push('fortuneCPS');

        if (fortunes.length > 0) {
          CLEAR();
          var me = C(fortunes);
          Game.TickerEffect = { type: 'fortune', sub: me };

          if (me == 'fortuneGC')
            me = L('Today is your lucky day!'); /*<br>Click here for a golden cookie.';*/
          else if (me == 'fortuneCPS') {
            Math.seedrandom(Game.seed + '-fortune');
            me =
              L('Your lucky numbers are:') +
              ' ' +
              Math.floor(Math.random() * 100) +
              ' ' +
              Math.floor(Math.random() * 100) +
              ' ' +
              Math.floor(Math.random() * 100) +
              ' ' +
              Math.floor(Math.random() * 100) /*+'<br>Click here to gain one hour of your CpS.'*/;
            Math.seedrandom();
          } else {
            const qIndex = me.ddesc.indexOf('<q>');
            if (qIndex >= 0) {
              // 若有风味文本则使用风味文本
              me = me.dname + ' : ' + me.ddesc.substring(qIndex + 3, me.ddesc.length - 4);
            } else if (me.buildingTie) {
              // 若没有风味文本则使用固定文本
              me =
                me.dname +
                ' : ' +
                L(
                  C([
                    'Never forget your %1.',
                    'Pay close attention to the humble %1.',
                    "You've been neglecting your %1.",
                    'Remember to visit your %1 sometimes.',
                  ]),
                  me.buildingTie.single
                );
            } else {
              // Edge case
              me =
                me.dname +
                ' : ' +
                L(
                  C([
                    "You don't know what you have until you've lost it.",
                    'Remember to take breaks.',
                    "Hey, what's up. I'm a fortune cookie.",
                    'You think you have it bad? Look at me.',
                  ])
                );
            }
          }
          me =
            '<span class="fortune"><div class="icon" style="vertical-align:middle;display:inline-bLk;background-position:' +
            -29 * 48 +
            'px ' +
            -8 * 48 +
            'px;transform:scale(0.5);margin:-16px;position:relative;left:-4px;top:-2px;"></div>' +
            me +
            '</span>';
          CLEAR();
          PUSH(me);
        }
      }

      if (Game.windowW < Game.tickerTooNarrow) {
        CLEAR();
        PUSH('<div style="transform:scale(0.8,1.2);">' + NEWS(loc('help me!')) + '</div>');
      }

      Game.TickerAge = Game.fps * 10;
      Game.Ticker = choose(list);
      Game.AddToLog(Game.Ticker);
      Game.TickerN++;
      Game.TickerDraw();
    };
  };

  const ModTickers205X = MOD => {
    Game.getNewTicker = manual => {
      var loreProgress = Math.round((Math.log(Game.cookiesEarned / 10) * Math.LOG10E + 1) | 0);

      const list = [];

      const PUSH = str => str && list.push(str);
      const CONCAT = str => list.push(...str.filter(() => !!str));
      const CLEAR = () => list.splice(0, list.length);
      const SCARY = !Game.prefs.notScary;
      const NEWS_PREFIX = loc('News :').replace(' ', '&nbsp;') + ' ';
      const NEWS = content => content && `${NEWS_PREFIX}${content}`;
      const GRANDMA = says => `<q>${says}</q><sig>${Game.Objects['Grandma'].single}</sig>`;
      const BUILT = (name, num = 1) => Game.Objects[name].amount >= num;
      const ACHIEVED = name => Game.HasAchiev(name);
      const UPGRADED = name => Game.Has(name);
      const CHANCE = percentage => Math.random() < percentage / 100;
      const EARNED = amount => Game.cookiesEarned >= amount;
      const LORE = amount => loreProgress > amount;
      const SEASON = name => Game.season == name.toLowerCase();
      // const PLEDGES = amount => Game.pledges >= amount;
      const PLEDGED = Game.pledges > 0;
      const WRATH = Game.elderWrath != 0;
      const RESET = Game.resets != 0;

      const L = (key, ...args) => {
        if (key in locStrings) return loc(key, ...args);
        return null;
      };

      const C = arr => {
        if (arr && Array.isArray(arr)) return choose(arr);
        return null;
      };

      const PUSH_WITH = (cond, name, news = true) => {
        if (cond(name)) {
          const localized = L(`Ticker (${name})`);
          if (!localized) return;
          if (Array.isArray(localized)) {
            list.push(news ? NEWS(C(localized)) : C(localized));
          } else {
            list.push(news ? NEWS(localized) : localized);
          }
        }
      };

      if (SEASON('Fools')) {
        // 愚人新闻
        if (EARNED(1000))
          PUSH(
            C([
              C(L('Ticker (fools 2050)')),
              `${C(L('Ticker (fools 2050 action 1)'))}${C(L('Ticker (fools 2050 action 2)'))}`,
              L('The word of the day is: %1.', C(L('Ticker (fools 2050 wotd)'))),
            ])
          );
        if (EARNED(1000) && CHANCE(5)) PUSH(C(L('Ticker (fools rare 2050)')));

        if (Game.TickerN % 2 == 0) {
          // 建筑新闻
          for (var obj in Game.Objects) {
            if (obj != 'Cursor' && obj != 'Grandma' && BUILT(obj))
              PUSH(NEWS(C(L(`Ticker (fools ${obj})`))));
          }
        }

        if (!LORE(0)) {
          PUSH(L('Such a grand day to begin a new business.'));
        } else if (!LORE(1)) {
          PUSH(L("You're baking up a storm!"));
        } else if (!LORE(2)) {
          PUSH(
            L(
              'You are confident that one day, your cookie company will be the greatest on the market!'
            )
          );
        } else if (!LORE(3)) {
          PUSH(L('Business is picking up!'));
        } else if (!LORE(4)) {
          PUSH(L("You're making sales left and right!"));
        } else if (!LORE(5)) {
          PUSH(L('Everyone wants to buy your cookies!'));
        } else if (!LORE(6)) {
          PUSH(L('You are now spending most of your day signing contracts!'));
        } else if (!LORE(7)) {
          PUSH(L('You\'ve been elected "business tycoon of the year"!'));
        } else if (!LORE(8)) {
          PUSH(L('Your cookies are a worldwide sensation! Well done, old chap!'));
        } else if (!LORE(9)) {
          PUSH(
            L(
              'Your brand has made its way into popular culture. Children recite your slogans and adults reminisce them fondly!'
            )
          );
        } else if (!LORE(10)) {
          PUSH(L("A business day like any other. It's good to be at the top!"));
        } else if (!LORE(11)) {
          PUSH(
            L(
              "You look back at your career. It's been a fascinating journey, building your baking empire from the ground up."
            )
          );
        }
      } else if (WRATH && ((PLEDGED && !RESET && CHANCE(30)) || CHANCE(3))) {
        // 天启新闻
        if (Game.elderWrath == 1) PUSH(NEWS(C(L('Ticker (grandma invasion start)'))));
        if (Game.elderWrath == 2) PUSH(NEWS(C(L('Ticker (grandma invasion rise)'))));
        if (Game.elderWrath == 3) PUSH(NEWS(C(L('Ticker (grandma invasion full)'))));
      } else {
        // 正常新闻
        if (Game.TickerN % 2 == 0 || LORE(14)) {
          if (CHANCE(75) || !EARNED(10000)) {
            // 老奶奶新闻
            if (BUILT('Grandma')) {
              PUSH(GRANDMA(C(L('Ticker (grandma)'))));
            }

            if (SCARY && BUILT('Grandma', 50)) {
              PUSH(GRANDMA(C(L('Ticker (threatening grandma)'))));
            }

            if (SCARY && ACHIEVED('Just wrong') && CHANCE(40)) {
              PUSH(GRANDMA(C(L('Ticker (angry grandma)'))));
            }

            if (SCARY && BUILT('Grandma') && PLEDGED && !WRATH) {
              PUSH(GRANDMA(C(L('Ticker (grandmas return)'))));
            }

            // 建筑新闻
            for (var obj in Game.Objects) {
              if (obj != 'Cursor' && obj != 'Grandma' && BUILT(obj))
                PUSH(NEWS(C(L(`Ticker (${obj})`))));
            }

            // 季节新闻
            if (EARNED(1000)) {
              PUSH_WITH(SEASON, 'Halloween');
              PUSH_WITH(SEASON, 'Christmas');
              PUSH_WITH(SEASON, 'Valentines');
              PUSH_WITH(SEASON, 'Easter');
            }
          }

          // 升级与成就新闻（补充）
          if (CHANCE(5)) {
            PUSH_WITH(ACHIEVED, 'Base 10');
            PUSH_WITH(ACHIEVED, 'From scratch');
            PUSH_WITH(ACHIEVED, 'A world filled with cookies');
            PUSH_WITH(ACHIEVED, 'Last Chance to See');
            PUSH_WITH(UPGRADED, 'Serendipity');
            PUSH_WITH(UPGRADED, 'Season switcher');
            PUSH_WITH(UPGRADED, 'Kitten helpers');
            PUSH_WITH(UPGRADED, 'Kitten workers');
            PUSH_WITH(UPGRADED, 'Kitten engineers');
            PUSH_WITH(UPGRADED, 'Kitten overseers');
            PUSH_WITH(UPGRADED, 'Kitten managers');
            PUSH_WITH(UPGRADED, 'Kitten accountants');
            PUSH_WITH(UPGRADED, 'Kitten specialists');
            PUSH_WITH(UPGRADED, 'Kitten experts');
            PUSH_WITH(UPGRADED, 'Kitten consultants');
            PUSH_WITH(UPGRADED, 'Kitten assistants to the regional manager');
            PUSH_WITH(UPGRADED, 'Kitten marketeers');
            PUSH_WITH(UPGRADED, 'Kitten analysts');
            PUSH_WITH(UPGRADED, 'Kitten executives');
            PUSH_WITH(UPGRADED, 'Kitten admins');
            PUSH_WITH(UPGRADED, 'Kitten strategists');
            PUSH_WITH(UPGRADED, 'Kitten angels');
            PUSH_WITH(UPGRADED, 'Kitten wages');
            PUSH_WITH(ACHIEVED, 'Jellicles');
          }

          // 糖块新闻
          if (CHANCE(20)) {
            PUSH_WITH(ACHIEVED, 'Dude, sweet');
          }

          // 稀有新闻
          if (CHANCE(0.1)) {
            CONCAT(L('Ticker (misc rare)'));
          }

          // 杂项新闻
          if (EARNED(10000)) {
            PUSH(NEWS(C(L('Ticker (misc extended 1)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 2)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 3)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 4)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 5)'))));
            PUSH(NEWS(C(L('Ticker (misc extended 6)'))));
          }
        }

        // 孤独新闻
        if (list.length == 0) {
          if (!LORE(0))
            CONCAT([L('You feel like making cookies. But nobody wants to eat your cookies.')]);
          else if (!LORE(1))
            CONCAT([
              L('Your first batch goes to the trash. The neighborhood raccoon barely touches it.'),
            ]);
          else if (!LORE(2)) CONCAT([L('Your family accepts to try some of your cookies.')]);
          else if (!LORE(3))
            CONCAT([
              L('Your cookies are popular in the neighborhood.'),
              L('People are starting to talk about your cookies.'),
            ]);
          else if (!LORE(4))
            CONCAT([
              L('Your cookies are talked about for miles around.'),
              L('Your cookies are renowned in the whole town!'),
            ]);
          else if (!LORE(5))
            CONCAT([
              L('Your cookies bring all the boys to the yard.'),
              L('Your cookies now have their own website!'),
            ]);
          else if (!LORE(6))
            CONCAT([
              L('Your cookies are worth a lot of money.'),
              L('Your cookies sell very well in distant countries.'),
            ]);
          else if (!LORE(7))
            CONCAT([
              L('People come from very far away to get a taste of your cookies.'),
              L('Kings and queens from all over the world are enjoying your cookies.'),
            ]);
          else if (!LORE(8))
            CONCAT([
              L('There are now museums dedicated to your cookies.'),
              L('A national day has been created in honor of your cookies.'),
            ]);
          else if (!LORE(9))
            CONCAT([
              L('Your cookies have been named a part of the world wonders.'),
              L('History books now include a whole chapter about your cookies.'),
            ]);
          else if (!LORE(10))
            CONCAT([
              L('Your cookies have been placed under government surveillance.'),
              L('The whole planet is enjoying your cookies!'),
            ]);
          else if (!LORE(11))
            CONCAT([
              L('Strange creatures from neighboring planets wish to try your cookies.'),
              L('Elder gods from the whole cosmos have awoken to taste your cookies.'),
            ]);
          else if (!LORE(12))
            CONCAT([
              L(
                'Beings from other dimensions lapse into existence just to get a taste of your cookies.'
              ),
              L('Your cookies have achieved sentience.'),
            ]);
          else if (!LORE(13))
            CONCAT([
              L('The universe has now turned into cookie dough, to the molecular level.'),
              L('Your cookies are rewriting the fundamental laws of the universe.'),
            ]);
          else if (!LORE(14))
            CONCAT([
              L(
                'A Lal news station runs a 10-minute segment about your cookies. Success!<br><small>(you win a cookie)</small>'
              ),
              L("it's time to stop playing"),
            ]);
        }
      }

      for (var i = 0; i < Game.modHooks['ticker'].length; i++) {
        var arr = Game.modHooks['ticker'][i]();
        if (arr) list = list.concat(arr);
      }

      Game.TickerEffect = 0;

      // 幸运新闻
      if (
        !manual &&
        Game.T > Game.fps * 10 &&
        Game.Has('Fortune cookies') &&
        Math.random() < (Game.HasAchiev('O Fortuna') ? 0.04 : 0.02)
      ) {
        var fortunes = [];
        for (var i in Game.Tiers['fortune'].upgrades) {
          var it = Game.Tiers['fortune'].upgrades[i];
          if (!Game.HasUnlocked(it.name)) fortunes.push(it);
        }

        if (!Game.fortuneGC) fortunes.push('fortuneGC');
        if (!Game.fortuneCPS) fortunes.push('fortuneCPS');

        if (fortunes.length > 0) {
          CLEAR();
          var me = C(fortunes);
          Game.TickerEffect = { type: 'fortune', sub: me };

          if (me == 'fortuneGC')
            me = L('Today is your lucky day!'); /*<br>Click here for a golden cookie.';*/
          else if (me == 'fortuneCPS') {
            Math.seedrandom(Game.seed + '-fortune');
            me =
              L('Your lucky numbers are:') +
              ' ' +
              Math.floor(Math.random() * 100) +
              ' ' +
              Math.floor(Math.random() * 100) +
              ' ' +
              Math.floor(Math.random() * 100) +
              ' ' +
              Math.floor(Math.random() * 100) /*+'<br>Click here to gain one hour of your CpS.'*/;
            Math.seedrandom();
          } else {
            const qIndex = me.ddesc.indexOf('<q>');
            if (qIndex >= 0) {
              // 若有风味文本则使用风味文本
              me = me.dname + ' : ' + me.ddesc.substring(qIndex + 3, me.ddesc.length - 4);
            } else if (me.buildingTie) {
              // 若没有风味文本则使用固定文本
              me =
                me.dname +
                ' : ' +
                L(
                  C([
                    'Never forget your %1.',
                    'Pay close attention to the humble %1.',
                    "You've been neglecting your %1.",
                    'Remember to visit your %1 sometimes.',
                  ]),
                  me.buildingTie.single
                );
            } else {
              // Edge case
              me =
                me.dname +
                ' : ' +
                L(
                  C([
                    "You don't know what you have until you've lost it.",
                    'Remember to take breaks.',
                    "Hey, what's up. I'm a fortune cookie.",
                    'You think you have it bad? Look at me.',
                  ])
                );
            }
          }
          me =
            '<span class="fortune"><div class="icon" style="vertical-align:middle;display:inline-bLk;background-position:' +
            -29 * 48 +
            'px ' +
            -8 * 48 +
            'px;transform:scale(0.5);margin:-16px;position:relative;left:-4px;top:-2px;"></div>' +
            me +
            '</span>';
          CLEAR();
          PUSH(me);
        }
      }

      if (Game.windowW < Game.tickerTooNarrow) {
        CLEAR();
        PUSH('<div style="transform:scale(0.8,1.2);">' + NEWS(loc('help me!')) + '</div>');
      }

      Game.TickerAge = Game.fps * 10;
      Game.Ticker = choose(list);
      Game.AddToLog(Game.Ticker);
      Game.TickerN++;
      Game.TickerDraw();
    };
  };

  // 修复parseLoc
  const FixParseLoc = () => {
    const isCN = localStorageGet('CookieClickerLang') === 'ZH-CN';

    parseLoc = (str, params) => {
      if (typeof params === 'undefined') params = [];
      else if (params.constructor !== Array) params = [params];
      if (!str) return '';

      // Transform func field into actual functions
      if (str.constructor === Array) {
        const ogStr = str;
        let hasFunc = false;
        for (let i = 0; i < ogStr.length; i++) {
          const s = ogStr[i];
          if (typeof s === 'function') {
            if (!hasFunc) {
              str = [...ogStr];
              hasFunc = true;
            }
            str[i] = s();
          }
        }
      } else if (typeof str === 'function') {
        str = str();
      }

      if (params.length == 0) return str;

      if (str.constructor === Array) {
        if (typeof params[0] === 'object') {
          let plurIndex = locPlur(params[0].n);
          plurIndex = Math.min(str.length - 1, plurIndex);
          str = str[plurIndex];
          str = replaceAll('%1', params[0].b, str);
        } else {
          let plurIndex = locPlur(params[0]);
          plurIndex = Math.min(str.length - 1, plurIndex);
          str = str[plurIndex];
          str = replaceAll('%1', params[0], str);
        }
      }

      let out = '';
      let len = str.length;
      let inPercent = false;
      for (let i = 0; i < len; i++) {
        let it = str[i];
        if (inPercent) {
          inPercent = false;
          afterReplace = true;
          if (!isNaN(it) && params.length >= parseInt(it) - 1) {
            out += params[parseInt(it) - 1];
          } else out += '%' + it;
        } else if (it == '%') inPercent = true;
        else out += it;
      }
      if (inPercent) out += '%';
      return out;
    };

    if (isCN) {
      // 让成就的数字Filter支持科学计数法
      beautifyInTextFilterSN = /\d(?:\.\d*)?e\+\d+/g;
      beautifyInTextFilterUN = /(\d+(?:\.\d+)?)( (?:\w+lion)| (?:thousand))/;
      // 将parseInt替换成可以读取更多数字的方式
      BeautifyInTextFunction = str => {
        return Beautify(Number(str.replace(/,/g, '')));
      };
      BeautifyInText = str => {
        let matchNumUnit = str.match(beautifyInTextFilterUN);

        if (matchNumUnit) {
          // 将单位替换成BeautifyInTextFunction可处理的格式
          const unitIndex = formatLong.indexOf(matchNumUnit[2]);
          if (unitIndex < 0) return str;
          const unitExp = (formatLong.indexOf(matchNumUnit[2]) + 1) * 3;
          const beautified = BeautifyInTextFunction(`${matchNumUnit[1]}e${unitExp}`);
          return str.replace(matchNumUnit[0], beautified);
        }

        let matchNum = str.match(beautifyInTextFilterSN) || str.match(beautifyInTextFilter);
        if (matchNum) {
          const beautified = BeautifyInTextFunction(matchNum[0]);
          return str.replace(matchNum[0], beautified);
        }
        return str;
      };
      BeautifyAll = () => {
        __TWCNG.isModdingAchievement = true;
        for (var i in Game.UpgradesById) {
          const it = Game.UpgradesById[i];
          const type = it.getType();
          let found = false;
          it.ddesc = BeautifyInText(it.baseDesc || it.ddesc);
          found = FindLocStringByPart(type + ' desc ' + it.id);
          if (found) it.ddesc = loc(found);
          if (__TWCNL.BRAND_COOKIE_CN && Game.prefs.brandcn && __TWCNL.BRAND_COOKIE_CN[i]) {
            // 替换的饼干特殊判断
            it.ddesc += '<q>' + __TWCNL.BRAND_COOKIE_CN[i].quote + '</q>';
          } else {
            found = FindLocStringByPart(type + ' quote ' + it.id);
            if (found) it.ddesc += '<q>' + loc(found) + '</q>';
          }
        }
        for (var i in Game.AchievementsById) {
          const it = Game.AchievementsById[i];
          const type = it.getType();
          let found = false;
          it.ddesc = BeautifyInText(it.baseDesc || it.ddesc);
          found = FindLocStringByPart(type + ' desc ' + it.id);
          if (found) it.ddesc = loc(found);
          found = FindLocStringByPart(type + ' quote ' + it.id);
          if (found) it.ddesc += '<q>' + loc(found) + '</q>';
        }
        __TWCNG.isModdingAchievement = false;
      };
    }
  };

  // 修复百亿级别单位数字换行闪烁的问题
  const ModCookiesFormat = MOD => {
    Game.registerHook('draw', () => {
      // 只有使用中文单位时需要
      if (Game.prefs.numbercn && Game.keys[__TWCNG.UNIT_TOGGLE_KEY] != 1) {
        const cookies = l('cookies');
        cookies.innerHTML = cookies.innerHTML.replace(
          new RegExp('(-?[0-9]+(?:.[0-9])?[^sa-z]*)(?:<br>| )' + loc('[CCCN]COOKIES')),
          (_, v) => v + loc('[CCCN]COOKIES')
        );
      }
    });
  };

  // 魔改随机烘焙坊名
  const ModRandomBakeryName = MOD => {
    const RandomName = Game.RandomBakeryName;
    Game.RandomBakeryName = function () {
      return RandomName().replace(/ /g, '');
    };
  };

  // 汉化背景选择器中的背景名
  const ModBackgroundSelector = MOD => {
    for (let i in Game.BGsByChoice) {
      if (i == 0) continue;
      Game.BGsByChoice[i].name = loc('[bg] ' + Game.BGsByChoice[i].name);
    }
  };

  // 菜单修改
  const MENU_HOOKS = [];
  const AddMenuHook = (MOD, func) => {
    if (typeof CCSE == 'undefined') {
      MENU_HOOKS.push([MOD, func]);
    } else {
      if (Game.customOptionsMenu == null) {
        Game.customOptionsMenu = [];
      }
      Game.customOptionsMenu.push(() => {
        CCSE.AppendOptionsMenu(func(MOD));
      });
    }
  };

  // 统计修改
  const ModStats = MOD => {
    const oldMenu = Game.UpdateMenu;
    Game.UpdateMenu = function () {
      oldMenu();

      if (Game.onMenu == 'stats') {
        const special = l('statsSpecial');
        if (!special) return;

        const thirdChild = special.children[2];
        if (!thirdChild) return;

        if (Game.season == 'fools') {
          const foolLine1 = document.createElement('div');
          foolLine1.className = 'listing';
          foolLine1.innerHTML = `<b>${loc('Money made from selling cookies:')}</b> ${Beautify(
            Game.cookiesEarned * 0.08,
            2
          )} ${loc('cookie dollars')}`;

          special.insertBefore(foolLine1, thirdChild);

          if (Game.Objects['Portal'].highest > 0) {
            var date = new Date();
            date.setTime(Date.now() - Game.startDate);
            var timeInSeconds = date.getTime() / 1000;

            const foolLine2 = document.createElement('div');
            foolLine2.className = 'listing';
            foolLine2.innerHTML = `<b>${loc('TV show seasons produced:')}</b>
              ${Beautify(
                Math.floor((timeInSeconds / 60 / 60) * (Game.Objects['Portal'].highest * 0.13) + 1)
              )}`;
            special.insertBefore(foolLine2, thirdChild);
          }
        }
      }
    };
  };

  const SetupMenuHooks = MOD => {
    if (typeof CCSE == 'undefined') {
      const oldMenu = Game.UpdateMenu;
      Game.UpdateMenu = function () {
        oldMenu();
        if (Game.onMenu == 'prefs') {
          let menuHTML = l('menu').innerHTML;
          for (let hook of MENU_HOOKS) {
            menuHTML = menuHTML.replace(
              '<div style="height:128px;"></div>',
              '<div class="framed" style="margin:4px 48px;"><div class="block" style="padding:0px;margin:8px 4px;"><div class="subsection" style="padding:0px;">' +
                hook[1](hook[0], menuHTML) +
                '</div></div></div><div style="height:128px;"></div>'
            );
          }
          menu.innerHTML = menuHTML;
        }
      };
    }
  };

  // 添加设置
  const ModSlider = (
    slider,
    leftText,
    rightText,
    startValueDisplayFunction,
    startValueFunction,
    min,
    max,
    step,
    callback
  ) => {
    if (!callback) callback = '';
    return (
      '<div class="sliderBox"><div style="float:left;" class="smallFancyButton">' +
      leftText +
      '</div><div style="float:right;" class="smallFancyButton" id="' +
      slider +
      'RightText">' +
      rightText.replace('[$]', startValueDisplayFunction()) +
      '</div><input class="slider" style="clear:both;" type="range" min="' +
      min +
      '" max="' +
      max +
      '" step="' +
      step +
      '" value="' +
      startValueFunction() +
      '" onchange="' +
      callback +
      '" oninput="' +
      callback +
      '" onmouseup="PlaySound(\'snd/tick.mp3\');" id="' +
      slider +
      '"/></div>'
    );
  };

  const DisabledButton = (button, text) => {
    return '<a class="smallFancyButton option off disabled" id="' + button + '">' + text + '</a>';
  };

  const ModPrefButton = (prefName, button, on, off, callback, invert) => {
    var invert = invert ? 1 : 0;
    if (!callback) callback = '';
    callback += "PlaySound('snd/tick.mp3');";
    return (
      '<a class="smallFancyButton prefButton option' +
      (Game.prefs[prefName] ^ invert ? '' : ' off') +
      '" id="' +
      button +
      '" ' +
      Game.clickStr +
      '="Game.Toggle(\'' +
      prefName +
      "','" +
      button +
      "','" +
      on +
      "','" +
      off +
      "','" +
      invert +
      "');" +
      callback +
      '">' +
      (Game.prefs[prefName] ? on : off) +
      '</a>'
    );
  };

  const ModPrefMenu = MOD => {
    return (
      `<div class="title">${loc('[CCCN]SETTING_TITLE')}</div>` +
      '<div class="listing">' +
      ModPrefButton(
        'numbercn',
        'numbercnButton',
        loc('[CCCN]SETTING_CNUNIT') + ON,
        loc('[CCCN]SETTING_CNUNIT') + OFF,
        'Game.UpdateMenu();BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
      ) +
      `<label>(${loc('[CCCN]SETTING_CNUNIT_LABEL')})</label><br>` +
      (Game.prefs.numbercn
        ? ModPrefButton(
            'numbercnfull',
            'numbercnFullButton',
            loc('[CCCN]SETTING_CNUNITFULL') + ON,
            loc('[CCCN]SETTING_CNUNITFULL') + OFF,
            'Game.UpdateMenu();BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
          ) +
          `<label>(${loc('[CCCN]SETTING_CNUNITFULL_LABEL')})</label><br>` +
          (Game.prefs.numbercnfull
            ? ModSlider(
                'numbercnFullSegs',
                loc('[CCCN]SETTING_CNUNITFULLSEGS'),
                loc('[CCCN]SETTING_CNUNITFULLSEGS_RIGHT'),
                () => Game.prefs.numbercnfullsegs,
                () => Game.prefs.numbercnfullsegs,
                1,
                3,
                1,
                "Game.prefs.numbercnfullsegs=parseInt(l('numbercnFullSegs').value);l('numbercnFullSegsRightText').innerHTML=loc('[CCCN]SETTING_CNUNITFULLSEGS_RIGHT').replace('[$]',Math.floor(l('numbercnFullSegs').value));BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;"
              )
            : ModSlider(
                'numbercnDecimal',
                loc('[CCCN]SETTING_DECIMAL'),
                loc('[CCCN]SETTING_DECIMAL_RIGHT'),
                () => Math.log10(Game.prefs.numbercndecimal),
                () => Math.log10(Game.prefs.numbercndecimal),
                0,
                8,
                1,
                "Game.prefs.numbercndecimal=Math.pow(10,Math.floor(l('numbercnDecimal').value));l('numbercnDecimalRightText').innerHTML=loc('[CCCN]SETTING_DECIMAL_RIGHT').replace('[$]',Math.floor(l('numbercnDecimal').value));BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;"
              )) +
          '<br>' +
          ModSlider(
            'numbercnMinUnit',
            loc('[CCCN]SETTING_MIN_UNIT'),
            '[$]',
            () => __TWCNL.CN_UNITS_MIN[Game.prefs.numbercnminunit],
            () => Game.prefs.numbercnminunit,
            0,
            Game.prefs.numbercnfull ? 3 : 4,
            1,
            "Game.prefs.numbercnminunit=parseInt(l('numbercnMinUnit').value);l('numbercnMinUnitRightText').innerHTML=__TWCNL.CN_UNITS_MIN[l('numbercnMinUnit').value];BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;"
          ) +
          '<br>' +
          ModPrefButton(
            'numbercnfixlen',
            'numbercnFixLenButton',
            loc('[CCCN]SETTING_FIXLEN') + ON,
            loc('[CCCN]SETTING_FIXLEN') + OFF,
            'Game.UpdateMenu();BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
          ) +
          `<label>(${loc('[CCCN]SETTING_FIXLEN_LABEL')})</label><br>` +
          ModPrefButton(
            'numbercntrillion',
            'numbercntrillionButton',
            loc('[CCCN]SETTING_TRILLION') + ON,
            loc('[CCCN]SETTING_TRILLION') + OFF,
            'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
          ) +
          `<label>(${loc('[CCCN]SETTING_TRILLION_LABEL')})</label><br>`
        : '') +
      '<br>' +
      ModPrefButton(
        'numbercnsci',
        'numbercnDisableButton',
        loc('[CCCN]SETTING_SCIENTIFIC') + ON,
        loc('[CCCN]SETTING_SCIENTIFIC') + OFF,
        'Game.UpdateMenu();BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
      ) +
      `<label>(${loc('[CCCN]SETTING_SCIENTIFIC_LABEL')})</label><br>` +
      (Game.prefs.numbercnsci
        ? ModSlider(
            'numbercnScientific',
            loc('[CCCN]SETTING_SCILEN'),
            '[$]',
            () => loc('[CCCN]SETTING_SCILEN_VALUES')[Game.prefs.numbercnscilen],
            () => Game.prefs.numbercnscilen,
            0,
            3,
            1,
            "Game.prefs.numbercnscilen=parseInt(l('numbercnScientific').value);l('numbercnScientificRightText').innerHTML=loc('[CCCN]SETTING_SCILEN_VALUES')[Math.floor(l('numbercnScientific').value)];BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;"
          ) + `<label>(${loc('[CCCN]SETTING_SCILEN_LABEL')})</label><br>`
        : '') +
      '<br>' +
      (__TWCNL.BRAND_COOKIE_CN
        ? Game.Has('Box of brand biscuits')
          ? ModPrefButton(
              'brandcn',
              'brandcnButton',
              '替换品牌饼干' + ON,
              '替换品牌饼干' + OFF,
              "Game.mods['" +
                MOD.id +
                "'].toggleBrandCookies();Game.RefreshStore();Game.upgradesToRebuild=1;"
            ) + '<label>(将“一盒品牌饼干”升级替换为本土化的品牌)</label><br>'
          : DisabledButton('brandcnButton', '??????????  ??') +
            '<label>(根据你目前的进度，该选项不会有影响也不能更改)</label><br>'
        : '') +
      ModPrefButton(
        'fontcn',
        'fontcnButton',
        '修改字体' + ON,
        '修改字体' + OFF,
        "Game.mods['" + MOD.id + "'].toggleFonts();"
      ) +
      '<label>(启用后将使用精心挑选的与英文原版风格近似的字体)</label><br>' +
      '</div>'
    );
  };

  // 去除时间格式的逗号
  const ModSayTime = MOD => {
    const oldSayTime = Game.sayTime;
    Game.sayTime = (time, detail) =>
      oldSayTime(time, detail)
        .replace(/, /g, '')
        .replace(/Infinity/g, '∞');
  };

  // 替换品牌饼干
  const ModBrandedCookies = MOD => {
    MOD.OriginalBrandCookies = {};
    for (let uid in __TWCNL.BRAND_COOKIE_CN) {
      const it = Game.UpgradesById[uid];
      if (it) {
        MOD.OriginalBrandCookies[uid] = {
          name: it.dname,
          desc: it.ddesc,
          icon: it.icon,
        };
        if (__TWCNL.BRAND_COOKIE_CN[uid].quote) {
          __TWCNL.BRAND_COOKIE_CN[uid].desc =
            it.ddesc.replace(/<q>.*/, '') + '<q>' + __TWCNL.BRAND_COOKIE_CN[uid].quote + '</q>';
        }
        __TWCNL.BRAND_COOKIE_CN[uid].icon.push(`${MOD.dirURI}/brands.png`, it.icon[0], it.icon[1]);
      }
    }

    // 魔改ParticleAdd还原魔改饼干
    const ParticleAdd = Game.particleAdd;
    Game.particleAdd = (x, y, xd, yd, size, dur, z, pic, text) => {
      const part = ParticleAdd(x, y, xd, yd, size, dur, z, pic, text);
      // 还原魔改饼干
      if (part.picPos[3]) part.picPos = [part.picPos[3], part.picPos[4]];
      return part;
    };
  };

  // 魔改Synergie升级的描述文本
  const ModSynergies = MOD => {
    for (let id in Game.UpgradesById) {
      const it = Game.UpgradesById[id];
      if (
        (it.tier === 'synergy1' || it.tier === 'synergy2') &&
        it.buildingTie1 &&
        it.buildingTie2
      ) {
        it.baseDesc =
          loc('%1 gain <b>+%2%</b> CpS for each %3.', [
            cap(it.buildingTie1.plural),
            5,
            it.buildingTie2.single,
          ]) +
          '<br>' +
          loc('%1 gain <b>+%2%</b> CpS for each %3.', [
            cap(it.buildingTie2.plural),
            0.1,
            it.buildingTie1.single,
          ]);
      }
    }
  };

  // 魔改建筑Buff提示
  const ModBuildingBuffs = MOD => {
    const buildingBuff = Game.buffTypesByName['building buff'];
    const oldBuffFunc = buildingBuff.func;
    buildingBuff.func = (time, pow, building) => {
      const obj = Game.ObjectsById[building];
      const result = oldBuffFunc(time, pow, building);
      // 替换 dname
      result.dname = loc(`[Building Buff] ${obj.name}`);
      return result;
    };

    const buildingDebuff = Game.buffTypesByName['building debuff'];
    const oldDebuffFunc = buildingDebuff.func;
    buildingDebuff.func = (time, pow, building) => {
      const obj = Game.ObjectsById[building];
      const result = oldDebuffFunc(time, pow, building);
      // 替换 dname
      result.dname = loc(`[Building Debuff] ${obj.name}`);
      return result;
    };
  };

  const FixPlaySound = () => {
    // 用monophonic换性能，游戏里也没什么地方需要同时播放一个声音好几遍的情况
    PlaySound = (url, vol, pitchVar) => {
      var volume = 1;
      var volumeSetting = Game.volume;
      if (typeof vol !== 'undefined') volume = vol;
      if (volume < -5) {
        volume += 10;
        volumeSetting = Game.volumeMusic;
      }
      if (!volumeSetting || volume == 0) return 0;
      if (typeof Sounds[url] === 'undefined') {
        Sounds[url] = new Audio(url);
        Sounds[url].onloadeddata = function (e) {
          PlaySound(url, vol, pitchVar);
        };
      } else if (Sounds[url].readyState >= 2) {
        var sound = Sounds[url];
        sound.volume = Math.pow((volume * volumeSetting) / 100, 2);
        if (pitchSupport) {
          var pitchVar = typeof pitchVar === 'undefined' ? 0.05 : pitchVar;
          var rate = 1 + (Math.random() * 2 - 1) * pitchVar;
          sound.preservesPitch = false;
          sound.mozPreservesPitch = false;
          sound.webkitPreservesPitch = false;
          sound.playbackRate = rate;
        }
        try {
          sound.currentTime = 0;
          sound.play();
        } catch (e) {}
      }
    };
  };

  // 植入CSS
  const ModInjectCSS = MOD => {
    // 修改Notes里的行间距
    document.head.insertAdjacentHTML(
      'beforeEnd',
      '<style>.note .title{line-height:1em} .framed .subname{font-size:80%;opacity:0.7;line-height:110%;}</style>'
    );

    // 只有在启用中文字体时才加载字体CSS
    if (Game.prefs.fontcn) {
      document.head.insertAdjacentHTML(
        'beforeEnd',
        `<link id="fontcn-css" href="${MOD.dirURI}/fonts.css" rel="stylesheet" type="text/css">`
      );
    }
  };

  // 在游戏加载前就修复Loc函数 (需要赶在本地化成就之前就生效)
  FixParseLoc();

  Game.registerMod(__TWCNL.MOD_ID, {
    init: function () {
      // 提供语言给函数
      this.lang = localStorageGet('CookieClickerLang');
      this.dirURI = this.dir
        ? 'file:///' + encodeURI(this.dir.replace(/\\/g, '/'))
        : 'CookieClickerCNMod';
      this.lastSpaceKeyStatus = 0;

      SetupMenuHooks(this);

      // onDraw
      Game.registerHook('draw', () => {
        if (
          this.lang == 'ZH-CN' &&
          Game.prefs.numbercn &&
          this.lastSpaceKeyStatus != Game.keys[__TWCNG.UNIT_TOGGLE_KEY]
        ) {
          // 检测按键变化
          this.lastSpaceKeyStatus = Game.keys[__TWCNG.UNIT_TOGGLE_KEY];
          BeautifyAll();
          Game.RefreshStore();
          Game.upgradesToRebuild = 1;
        }
      });

      // 其他语言也会被修复
      FixPlaySound(this);

      // 切换为其他语言时需要可以替换回来
      if (__TWCNL.BRAND_COOKIE_CN) ModBrandedCookies(this);

      // 只有语言是中文的时候启用模组
      if (this.lang == 'ZH-CN') {
        // 默认设置参数
        if (Game.prefs.numbercn == null) Game.prefs.numbercn = 1;
        if (Game.prefs.numbercnfull == null) Game.prefs.numbercnfull = 0;
        if (Game.prefs.numbercnfullsegs == null) Game.prefs.numbercnfullsegs = 2;
        if (Game.prefs.numbercnfixlen == null) Game.prefs.numbercnfixlen = 0;
        if (Game.prefs.numbercnsci == null) Game.prefs.numbercnsci = 1;
        if (Game.prefs.numbercnscilen == null) Game.prefs.numbercnscilen = 0;
        if (Game.prefs.numbercndecimal == null) Game.prefs.numbercndecimal = 100;
        if (Game.prefs.numbercndecimallen == null)
          Game.prefs.numbercndecimallen = Math.log10(Game.prefs.numbercndecimal);
        if (Game.prefs.numbercnminunit == null) Game.prefs.numbercnminunit = 1;
        if (Game.prefs.numbercntrillion == null)
          Game.prefs.numbercntrillion = __TWCNL.DEF_SETTING_TRILLION;
        if (Game.prefs.brandcn == null) Game.prefs.brandcn = __TWCNL.DEF_SETTING_BRAND;
        if (Game.prefs.fontcn == null) Game.prefs.fontcn = 1;

        ModTouchSpecialPic(this);
        ModMarket(this);
        ModUpgrade152(this);
        ModUpgrade227(this);
        ModUpgrade332(this);
        ModUpgrade531(this);
        ModUpgrade534(this);
        ModUpgrade606(this);
        ModDropEgg(this);
        ModBackgroundSelector(this);
        ModInjectCSS(this);
        ModSayTime(this);
        ModGameUnit(this);
        ModCookiesFormat(this);
        ModGarden(this);
        ModSynergies(this);
        ModRandomBakeryName(this);
        ModCrateTooltip(this);
        ModObjectTooltip(this);
        ModObjectLevelTooltip(this);
        ModBuildingBuffs(this);
        ModStats(this);

        // Tickers 改动太大，修改前确认版本
        if (Game.version == 2.048) {
          ModTickers2048(this);
        }

        if (Game.version >= 2.051 && Game.version < 2.06) {
          ModTickers205X(this);
        }

        AddMenuHook(this, ModPrefMenu);
      }
    },

    save: function () {
      const p = {};
      for (let key in __TWCNG.SaveDataMap) {
        const option = __TWCNG.SaveDataMap[key];
        p[key] = Game.prefs[option];
      }

      return JSON.stringify({ p });
    },

    load: function (str) {
      try {
        let data = JSON.parse(str);
        if (data.prefs) {
          for (let pref in data.prefs) {
            Game.prefs[pref] = data.prefs[pref];
          }
          Game.prefs.numbercndecimallen = Math.log10(Game.prefs.numbercndecimal);
        } else if (data.p) {
          for (let key in __TWCNG.SaveDataMap) {
            const option = __TWCNG.SaveDataMap[key];
            if (data.p[key] != null) Game.prefs[option] = data.p[key];
          }
          Game.prefs.numbercndecimal = Math.pow(10, Game.prefs.numbercndecimallen);
        }
      } catch (e) {
        console.error(e);
      }

      BeautifyAll();
      this.toggleBrandCookies();
    },
    toggleBrandCookies: function () {
      const data =
        Game.prefs.brandcn && this.lang == 'ZH-CN'
          ? __TWCNL.BRAND_COOKIE_CN
          : this.OriginalBrandCookies;
      for (let uid in data) {
        const it = Game.UpgradesById[uid];
        it.dname = data[uid].name;
        it.ddesc = data[uid].desc;
        it.icon = data[uid].icon;
      }
    },
    toggleFonts: function () {
      const existingLink = document.getElementById('fontcn-css');

      if (Game.prefs.fontcn) {
        // 启用字体：如果没有加载则加载字体CSS
        if (!existingLink) {
          document.head.insertAdjacentHTML(
            'beforeEnd',
            `<link id="fontcn-css" href="${this.dirURI}/fonts.css" rel="stylesheet" type="text/css">`
          );
        }
      } else {
        // 禁用字体：移除字体CSS
        if (existingLink) {
          existingLink.remove();
        }
      }

      // 更新菜单按钮状态
      Game.UpdateMenu();
    },
  });
})();
