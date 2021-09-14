const __TWCNG = {
  // 中文品牌饼干
  BRAND_COOKIE_CN: {
    120: {
      name: '猫耳朵',
      quote: '经典零食。我们的产品是用上好的橘猫制成的。',
      icon: [0, 0],
    },
    121: {
      name: '鿏丽素',
      quote: '绝不含任何非放射性成分。',
      icon: [1, 0],
    },
    122: {
      name: '好吃片',
      quote: '不好吃的话，可能是你对坚果过敏，建议多吃点。',
      icon: [2, 0],
    },
    123: {
      name: '巧克力派',
      quote: '老奶奶的最爱？',
      icon: [3, 0],
    },
    125: {
      name: '2×3',
      quote:
        '两片奶酪夹入三片奶油饼干中，大概没有人想过可以这么干——我们甚至可以用这个概念申请商标了。',
      icon: [0, 1],
    },
    // 126: {
    //   name: '',
    //   quote: '',
    //   icon: [1, 1],
    // },
    127: {
      name: '趣咄咄',
      quote: '保留对所有巧克力豆饼干发律师函的权利。',
      icon: [2, 1],
    },
    128: {
      name: '行星杯',
      quote:
        '最下面的仅有的薄薄一层奶油才是最好吃的。我们可以把它们刮下来做成新的饼干。至于里面已经有的饼干和巧克力，就和塑料包装搅碎一起当作早餐麦片卖掉就好了。',
      icon: [3, 1],
    },
    344: {
      name: '辣条',
      quote: '同样是小麦制成的，只不过这些上面撒的不是糖罢了。',
      icon: [0, 2],
    },
    401: {
      name: '鲜贝',
      quote: '不保证含有海鲜。',
      icon: [1, 2],
    },
    402: {
      name: '小猫熊面饼',
      quote: '据说用水泡会变的难吃，和饼干一样。',
      icon: [2, 2],
    },
    463: {
      name: '大灰兔奶糖',
      quote: '用饼干制成的包装——不是指最外面这层。',
      icon: [3, 2],
    },
    612: {
      name: '俄芙巧克力',
      quote:
        '你可以选择整齐地掰下每个小块，也可以反人类一样整板咬着吃。一些海外国家生产的这些东西有数百种独特的口味，如绿茶味、龙虾浓汤味和黑巧克力味。',
      icon: [0, 3],
    },
    618: {
      name: '霜饼',
      quote: '据说撒在烘焙米饼上的糖霜是从冰雹中提取出来的。',
      icon: [1, 3],
    },
    619: {
      name: '诡脆鲨威化饼干',
      quote: '小心它一口被你吃掉。',
      icon: [2, 3],
    },
    // 726: {
    //   name: '726',
    //   quote: '',
    //   icon: [3, 3],
    // },
  },

  // 按键
  UNIT_TOGGLE_KEY: 90,

  CN_UNITS: [
    [1e72, '大数'],
    [1e68, '无量'],
    [1e64, '不可思议'],
    [1e60, '那由他'],
    [1e56, '阿僧祇'],
    [1e52, '恒河沙'],
    [1e48, '极'],
    [1e44, '载'],
    [1e40, '正'],
    [1e36, '涧'],
    [1e32, '沟'],
    [1e28, '穰'],
    [1e24, '秭'],
    [1e20, '垓'],
    [1e16, '京'],
  ],

  CN_UNITS_STACKABLE: [
    [1e8, '亿'],
    [1e4, '万'],
    [1e3, '千'],
    [1e2, '百'],
  ],

  // 替换数字格式化
  FormatterCN: val => {
    let unit = '';
    if (!isFinite(val)) return '无限';
    if (val >= 1e4) {
      for (const u of __TWCNG.CN_UNITS) {
        if (val >= u[0]) {
          val /= u[0];
          unit = u[1];
          break;
        }
      }
      for (const u of __TWCNG.CN_UNITS_STACKABLE) {
        while (val >= u[0]) {
          val /= u[0];
          unit = u[1] + unit;
        }
      }
    }
    const prec = Game.prefs.numbercndecimal;
    return Math.floor(val * prec) / prec + unit;
  },

  // 替换科学计数法
  SUPNUM: ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'],
  FormatterScientific: val => {
    const [coefficient, exponent] = val.toExponential(12).split('e');
    const [integer, decimal] = coefficient.split('.');
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

    return (
      integer +
      '.' +
      decimal.match(/.{1,3}/g).join('\u2008') +
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
};

(function () {
  // 中文数字魔改
  const ModGameUnit = MOD => {
    Beautify = (val, floats) => {
      let negative = val < 0;
      let decimal = '';
      let fixed = val.toFixed(floats);
      if (Math.abs(val) < 1000 && floats > 0 && Math.floor(fixed) != fixed)
        decimal = '.' + fixed.toString().split('.')[1];
      val = Math.floor(Math.abs(val));
      if (floats > 0 && fixed == val + 1) val++;
      let output;
      if (Game.prefs.numbercn && Game.keys[__TWCNG.UNIT_TOGGLE_KEY] != 1) {
        output =
          val >= 1e76 && isFinite(val)
            ? __TWCNG.FormatterScientific(val)
            : __TWCNG.FormatterCN(val);
      } else {
        output = val >= 1e16 ? __TWCNG.FormatterScientific(val) : __TWCNG.FormatterGroupThree(val);
      }

      if (output == '0') negative = false;
      return negative ? '-' + output : output + decimal;
    };
  };

  // 翻译花园小游戏的提示图片（因为里面有文本）
  const ModGardenTooltip = MOD => {
    const hackGarden = () => {
      if (Game.isMinigameReady(Game.Objects['Farm'])) {
        let M = Game.Objects['Farm'].minigame;

        let oldDescFunc = M.tools.info.descFunc;
        M.tools.info.descFunc = () => {
          return oldDescFunc().replace(
            '<img src="img/gardenTip.png" style="float:right;margin:0px 0px 8px 8px;"/>',
            '<img src="' +
              MOD.dirURI +
              '/gardenTip.png" width="120px" style="float:right;margin:0px 0px 8px 8px;"/>'
          );
        };
      } else {
        setTimeout(hackGarden, 500);
      }
    };
    hackGarden();
  };

  // 修复股票小游戏内未翻译的文本
  const ModMarket = MOD => {
    const hackMarket = () => {
      if (Game.isMinigameReady(Game.Objects['Bank'])) {
        let M = Game.Objects['Bank'].minigame;
        M.loanTypes[2][0] = loc('a retirement loan');
      } else {
        setTimeout(hackMarket, 500);
      }
    };
    hackMarket();
  };

  // 修复Santa升级提示中未翻译的文本
  const ModUpgrade152 = MOD => {
    Game.UpgradesById[152].buyFunction = () => {
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

  // 修复parseLoc
  const FixParseLoc = () => {
    const isCN = localStorageGet('CookieClickerLang') === 'ZH-CN';

    parseLoc = (str, params) => {
      if (typeof params === 'undefined') params = [];
      else if (params.constructor !== Array) params = [params];
      if (!str) return '';

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
      // 将parseInt替换成可以读取更多数字的方式
      BeautifyInTextFunction = str => {
        return Beautify(Number(str.replace(/,/g, '')));
      };
      BeautifyInText = str => {
        let matchNum = str.match(beautifyInTextFilterSN) || str.match(beautifyInTextFilter);
        if (!matchNum) return str;
        const beautified = BeautifyInTextFunction(matchNum[0]);
        return str.replace(matchNum[0], beautified);
      };
      BeautifyAll = () => {
        for (var i in Game.UpgradesById) {
          const it = Game.UpgradesById[i];
          const type = it.getType();
          let found = false;
          it.ddesc = BeautifyInText(it.baseDesc || it.ddesc);
          found = FindLocStringByPart(type + ' desc ' + it.id);
          if (found) it.ddesc = loc(found);
          if (Game.prefs.brandcn && __TWCNG.BRAND_COOKIE_CN[i]) {
            // 替换的饼干特殊判断
            it.ddesc += '<q>' + __TWCNG.BRAND_COOKIE_CN[i].quote + '</q>';
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
          /(-?[0-9]+(?:\.[0-9])?[^\s]*)(?:<br>| )块饼干/,
          (_, v) => v + '块饼干'
        );
      }
    });
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
                '</div></div></div></div><div style="height:128px;"></div>'
            );
          }
          menu.innerHTML = menuHTML;
        }
      };
    }
  };

  // 添加设置
  const ModSlider = (slider, leftText, rightText, startValueFunction, min, max, step, callback) => {
    if (!callback) callback = '';
    return (
      '<div class="sliderBox"><div style="float:left;" class="smallFancyButton">' +
      leftText +
      '</div><div style="float:right;" class="smallFancyButton" id="' +
      slider +
      'RightText">' +
      rightText.replace('[$]', startValueFunction()) +
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

  const ModPrefMenu = MOD => {
    return (
      '    <div class="title">中文模组设置</div>' +
      '    <div class="listing">' +
      ModSlider(
        'numbercnDecimal',
        '中文单位前保留',
        '小数点后[$]位',
        () => Math.log10(Game.prefs.numbercndecimal),
        0,
        4,
        1,
        "Game.prefs.numbercndecimal=Math.pow(10,Math.floor(l('numbercnDecimal').value));l('numbercnDecimalRightText').innerHTML='小数点后'+Math.floor(l('numbercnDecimal').value)+'位';BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;"
      ) +
      '<br>' +
      Game.WriteButton(
        'numbercn',
        'numbercnButton',
        '使用中文计数单位' + ON,
        '使用中文计数单位' + OFF,
        'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
      ) +
      '<label>(按住<b>Z键</b>可临时显示完整数字)</label><br>' +
      (Game.Has('Box of brand biscuits')
        ? Game.WriteButton(
            'brandcn',
            'brandcnButton',
            '替换品牌饼干' + ON,
            '替换品牌饼干' + OFF,
            "Game.mods['" +
              MOD.id +
              "'].toggleBrandCookies();Game.RefreshStore();Game.upgradesToRebuild=1;"
          ) + '<label>(将“一盒品牌饼干”升级替换为本土化的品牌)</label><br>'
        : DisabledButton('brandcnButton', '??????????  ??') +
          '<label>(根据你目前的进度，该选项不会有影响也不能更改。)</label><br>')
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
    for (let uid in __TWCNG.BRAND_COOKIE_CN) {
      const it = Game.UpgradesById[uid];
      if (it) {
        MOD.OriginalBrandCookies[uid] = {
          name: it.dname,
          desc: it.ddesc,
          icon: it.icon,
        };
        if (__TWCNG.BRAND_COOKIE_CN[uid].quote) {
          __TWCNG.BRAND_COOKIE_CN[uid].desc =
            it.ddesc.replace(/<q>.*/, '') + '<q>' + __TWCNG.BRAND_COOKIE_CN[uid].quote + '</q>';
        }
        __TWCNG.BRAND_COOKIE_CN[uid].icon.push(
          `'${MOD.dirURI}/brands.png'`,
          it.icon[0],
          it.icon[1]
        );
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

  // 在游戏加载前就修复Loc函数 (需要赶在本地化成就之前就生效)
  FixParseLoc();

  Game.registerMod('TWCNClickerCN', {
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
      ModMarket(this);
      ModUpgrade152(this);

      // 只有语言是中文的时候启用模组
      if (this.lang == 'ZH-CN') {
        // 默认设置参数
        if (Game.prefs.numbercn == null) Game.prefs.numbercn = 1;
        if (Game.prefs.numbercndecimal == null) Game.prefs.numbercndecimal = 100;
        if (Game.prefs.brandcn == null) Game.prefs.brandcn = 1;

        ModBrandedCookies(this);
        ModSayTime(this);
        ModGameUnit(this);
        ModCookiesFormat(this);
        ModGardenTooltip(this);
        AddMenuHook(this, ModPrefMenu);
      }
    },
    save: function () {
      return JSON.stringify({
        prefs: {
          numbercn: Game.prefs.numbercn,
          numbercndecimal: Game.prefs.numbercndecimal,
          brandcn: Game.prefs.brandcn,
        },
      });
    },
    load: function (str) {
      let data = JSON.parse(str);
      for (let pref in data.prefs) {
        Game.prefs[pref] = data.prefs[pref];
      }
      BeautifyAll();
      this.toggleBrandCookies();
    },
    toggleBrandCookies: function () {
      const data = Game.prefs.brandcn ? __TWCNG.BRAND_COOKIE_CN : this.OriginalBrandCookies;
      for (let uid in data) {
        const it = Game.UpgradesById[uid];
        it.dname = data[uid].name;
        it.ddesc = data[uid].desc;
        it.icon = data[uid].icon;
      }
    },
  });
})();
