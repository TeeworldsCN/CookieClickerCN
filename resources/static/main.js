// 按键
const UNIT_TOGGLE_KEY = 90;

// 中文数字魔改
const ModGameUnit = MOD => {
  const CN_UNITS = [
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
  ];

  const CN_UNITS_STACKABLE = [
    [1e8, '亿'],
    [1e4, '万'],
    [1e3, '千'],
    [1e2, '百'],
  ];

  // 替换数字格式化
  const FormatterCN = val => {
    let unit = '';
    if (!isFinite(val)) return '无限';
    if (val >= 1e4) {
      for (const u of CN_UNITS) {
        if (val >= u[0]) {
          val /= u[0];
          unit = u[1];
          break;
        }
      }
      for (const u of CN_UNITS_STACKABLE) {
        while (val >= u[0]) {
          val /= u[0];
          unit = u[1] + unit;
        }
      }
    }
    return Math.floor(val * 100) / 100 + unit;
  };

  // 替换科学计数法
  const SUPNUM = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const FormatterScientific = val => {
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
      superscript += SUPNUM[exponent.charCodeAt(i) - 48];
    }

    return (
      integer +
      '.' +
      decimal.match(/.{1,3}/g).join('\u2008') +
      '×10' +
      (negative ? '⁻' : '') +
      superscript
    );
  };

  const FormatterGroupThree = val => {
    return Math.floor(Math.round(val * 1000) / 1000)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 魔改全局数字格式化函数
  Beautify = (val, floats) => {
    let negative = val < 0;
    let decimal = '';
    let fixed = val.toFixed(floats);
    if (Math.abs(val) < 1000 && floats > 0 && Math.floor(fixed) != fixed)
      decimal = '.' + fixed.toString().split('.')[1];
    val = Math.floor(Math.abs(val));
    if (floats > 0 && fixed == val + 1) val++;
    let output;
    if (Game.prefs.numbercn && Game.keys[UNIT_TOGGLE_KEY] != 1) {
      output = val >= 1e76 && isFinite(val) ? FormatterScientific(val) : FormatterCN(val);
    } else {
      output = val >= 1e16 ? FormatterScientific(val) : FormatterGroupThree(val);
    }

    if (output == '0') negative = false;
    return negative ? '-' + output : output + decimal;
  };
};

const InjectCSS = MOD => {
  // 插入固定的CSS定义
  l('game').insertAdjacentHTML(
    'beforebegin',
    [
      '<style>',
      // 花园修复
      '.modAssetGardenSeedTinyLocked{transform:scale(0.5,0.5);margin:-20px -16px;display:inline-block;width:48px;height:48px;background:url(img/icons.png?v=' +
        Game.version +
        ');}',
      '.modAssetGardenPlantsIcon{background-image:url(img/gardenPlants.png?v=' +
        Game.version +
        ') !important;}',
      '.modAssetTurnInto{background:url(img/turnInto.png);}',
      '.modAssetGardenTip{background-image:url(img/gardenTip.png);background-size:100%;float:right;margin:0px 0px 8px 8px;width:120px;height:153px;}',
      '.modAssetGardenTipCN{background-image:url(' +
        MOD.dir +
        '/gardenTip.png);background-size:100%;float:right;margin:0px 0px 8px 8px;width:120px;height:153px;}',
      // 菜单修复
      '.modAssetSanta{background-image:url(img/santa.png?v=' + Game.version + ');}',
      '.modAssetDragon{background-image:url(img/dragon.png?v=' + Game.version + ');}',
      '.modAssetIcons{background-image:url(img/icons.png?v=' + Game.version + ');}',
      // 牛奶弹窗
      '.modAssetMilkPlain{background:url(img/milkPlain.png);}',
      '.modAssetMilkChocolate{background:url(img/milkChocolate.png);}',
      '.modAssetMilkRaspberry{background:url(img/milkRaspberry.png);}',
      '.modAssetMilkOrange{background:url(img/milkOrange.png);}',
      '.modAssetMilkCaramel{background:url(img/milkCaramel.png);}',
      '.modAssetMilkBanana{background:url(img/milkBanana.png);}',
      '.modAssetMilkLime{background:url(img/milkLime.png);}',
      '.modAssetMilkBlueberry{background:url(img/milkBlueberry.png);}',
      '.modAssetMilkStrawberry{background:url(img/milkStrawberry.png);}',
      '.modAssetMilkVanilla{background:url(img/milkVanilla.png);}',
      '.modAssetMilkHoney{background:url(img/milkHoney.png);}',
      '.modAssetMilkCoffee{background:url(img/milkCoffee.png);}',
      '.modAssetMilkTea{background:url(img/milkTea.png);}',
      '.modAssetMilkCoconut{background:url(img/milkCoconut.png);}',
      '.modAssetMilkCherry{background:url(img/milkCherry.png);}',
      '.modAssetMilkSpiced{background:url(img/milkSpiced.png);}',
      '.modAssetMilkMaple{background:url(img/milkMaple.png);}',
      '.modAssetMilkMint{background:url(img/milkMint.png);}',
      '.modAssetMilkLicorice{background:url(img/milkLicorice.png);}',
      '.modAssetMilkRose{background:url(img/milkRose.png);}',
      '.modAssetMilkDragonfruit{background:url(img/milkDragonfruit.png);}',
      '</style>',
    ].join('')
  );
};

// 顺带修复花园小游戏Tooltip重复请求资源的BUG
const FixGardenTooltip = MOD => {
  const FixGarden = () => {
    if (Game.isMinigameReady(Game.Objects['Farm'])) {
      let M = Game.Objects['Farm'].minigame;

      // 修复问号的资源加载
      let oldPlantDesc = M.getPlantDesc;
      M.getPlantDesc = me => {
        return oldPlantDesc(me).replaceAll(
          'gardenSeedTiny" style="background-image:url(img/icons.png?v=' + Game.version + ');',
          'modAssetGardenSeedTinyLocked" style="'
        );
      };

      // 修复Tooltip图标的资源加载
      const TooltipNeededFix = ['toolTooltip', 'soilTooltip', 'seedTooltip'];
      for (const t of TooltipNeededFix) {
        let oldTooltip = M[t];
        M[t] = id => {
          return () => {
            let str = oldTooltip(id)().replaceAll(
              'icon" style="background:url(img/gardenPlants.png?v=' + Game.version + ');',
              'icon modAssetGardenPlantsIcon" style="'
            );
            if (t === 'seedTooltip') {
              str = str.replaceAll(
                'style="background:url(img/turnInto.png);',
                'class="modAssetTurnInto" style="'
              );
            }
            return str;
          };
        };
      }

      // 修复TileTooltip的图标资源加载
      let oldTileTooltip = M.tileTooltip;
      M.tileTooltip = (x, y) => {
        return () =>
          oldTileTooltip(x, y)()
            .replaceAll(
              'icon" style="background:url(img/gardenPlants.png?v=' + Game.version + ');',
              'icon modAssetGardenPlantsIcon" style="'
            )
            .replaceAll(
              'style="background:url(img/gardenPlants.png?v=' + Game.version + ');',
              'class="modAssetGardenPlantsIcon" style="'
            );
      };

      // 替换或翻译花园小游戏的提示图片（因为里面有文本）
      let oldDescFunc = M.tools.info.descFunc;
      M.tools.info.descFunc = () => {
        return oldDescFunc().replace(
          '<img src="img/gardenTip.png" style="float:right;margin:0px 0px 8px 8px;"/>',
          MOD.lang === 'ZH-CN'
            ? '<div class="modAssetGardenTipCN"></div>'
            : '<div class="modAssetGardenTip"></div>'
        );
      };
    } else {
      setTimeout(FixGarden, 500);
    }
  };
  FixGarden();
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
        // if (isCN && params[0].b.toString().codePointAt(params[0].b.length - 1) >= 0x4e00) {
        //   // 移除单位后的空格，保持中文连贯性
        //   str = replaceAll('%1 ', params[0].b, str);
        // }
        str = replaceAll('%1', params[0].b, str);
      } else {
        let plurIndex = locPlur(params[0]);
        plurIndex = Math.min(str.length - 1, plurIndex);
        str = str[plurIndex];
        // if (isCN && params[0].toString().codePointAt(params[0].length - 1) >= 0x4e00) {
        //   // 移除单位后的空格，保持中文连贯性
        //   str = replaceAll('%1 ', params[0], str);
        // }
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
          // if (isCN && out.codePointAt(out.length - 1) >= 0x4e00 && str[i + 1] === ' ') {
          //   // 移除单位后的空格，保持中文连贯性
          //   i++;
          // }
        } else out += '%' + it;
      } else if (it == '%') inPercent = true;
      else out += it;
    }
    if (inPercent) out += '%';
    return out;
  };

  if (isCN) {
    // 让成就的数字Filter支持科学计数法
    beautifyInTextFilter = /((?:[\d]+[,]*(?:\.[\d]+[,]*)?)+(?:e[+-]?\d*)?)/g;
    // 将parseInt替换成可以读取更多数字的方式
    BeautifyInTextFunction = str => {
      return Beautify(Number(str.replace(/,/g, '')));
    };
    BeautifyInText = str => {
      const matchNum = str.match(beautifyInTextFilter);
      if (!matchNum) return str;
      const beautified = BeautifyInTextFunction(matchNum[0]);
      // if (beautified.codePointAt(beautified.length - 1) >= 0x4e00) {
      //   // 移除单位后的空格，保持中文连贯性
      //   str = str.replace(matchNum[0] + ' ', beautified);
      // }
      return str.replace(matchNum[0], beautified);
    };
  }
};

// 修复百亿级别单位数字换行闪烁的问题
const ModCookiesFormat = MOD => {
  Game.registerHook('draw', () => {
    // 只有使用中文单位时需要
    if (Game.prefs.numbercn && Game.keys[UNIT_TOGGLE_KEY] != 1) {
      const cookies = l('cookies');
      cookies.innerHTML = cookies.innerHTML.replace(
        /(-?[0-9]+.?[0-9][^\s]*)(?:<br>| )块饼干/,
        (_, v) => v + '块饼干'
      );
    }
  });
};

// 菜单修改
const MENU_HOOKS = [];
const AddMenuHook = func => {
  MENU_HOOKS.push(func);
};
const SetupMenuHooks = MOD => {
  let oldMenu = Game.UpdateMenu;
  Game.UpdateMenu = function () {
    oldMenu();
    let menuHTML = l('menu').innerHTML;
    for (let hook of MENU_HOOKS) {
      menuHTML = hook(MOD, menuHTML);
    }
    menu.innerHTML = menuHTML;
  };
};

// 添加设置
const ModPrefMenu = (MOD, menu) => {
  if (Game.onMenu == 'prefs') {
    return menu.replace(
      '<div style="height:128px;"></div>',
      '<div class="framed" style="margin:4px 48px;">' +
        '  <div class="block" style="padding:0px;margin:8px 4px;">' +
        '   <div class="subsection" style="padding:0px;">' +
        '    <div class="title">中文模组设置</div>' +
        '    <div class="listing">' +
        Game.WriteButton(
          'numbercn',
          'numbercnButton',
          '使用中文计数单位' + ON,
          '使用中文计数单位' + OFF,
          'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
        ) +
        '<label>(按住<b>Z键</b>可临时显示完整数字)</label><br>' +
        '    </div>' +
        '   </div>' +
        '  </div>' +
        '</div><div style="height:128px;"></div>'
    );
  }
  return menu;
};

// 修复统计菜单的图标重复加载的问题
const FixStatMenu = (MOD, menu) => {
  if (Game.onMenu == 'stats') {
    return menu
      .replaceAll(
        /style="background:url\(img\/santa\.png\) ([^"]*)" class="trophy"/g,
        (_, v) => 'style="background-position:' + v + '" class="trophy modAssetSanta"'
      )
      .replaceAll(
        /style%3D%22width%3A96px%3Bheight%3A96px%3Bmargin%3A4px%20auto%3Bbackground%3Aurl%28img\/santa\.png%29%20/g,
        'class%3D%22modAssetSanta%22%20style%3D%22width%3A96px%3Bheight%3A96px%3Bmargin%3A4px%20auto%3Bbackground-position%3A'
      )
      .replaceAll(
        /style="background:url\(img\/dragon\.png\?v=[0-9.]*\) ([^"]*)" class="trophy"/g,
        (_, v) => 'style="background-position:' + v + '" class="trophy modAssetDragon"'
      )
      .replaceAll(
        /style%3D%22width%3A96px%3Bheight%3A96px%3Bmargin%3A4px%20auto%3Bbackground%3Aurl%28img\/dragon\.png%3Fv%3D[0-9.]*%29%20/g,
        'class%3D%22modAssetDragon%22%20style%3D%22width%3A96px%3Bheight%3A96px%3Bmargin%3A4px%20auto%3Bbackground-position%3A'
      )
      .replaceAll(
        /style="background:url\(img\/icons\.png\?v=[0-9.]*\) ([^"]*)" class="trophy"/g,
        (_, v) => 'style="background-position:' + v + '" class="trophy modAssetIcons"'
      )
      .replaceAll(
        /style%3D%22width%3A100%25%3Bheight%3A96px%3Bposition%3Aabsolute%3Bleft%3A0px%3Bbottom%3A0px%3Bbackground%3Aurl%28img\/milk(\w*)\.png%29%3B/g,
        (_, v) =>
          'class%3D%22modAssetMilk' +
          v +
          '%22%20style%3D%22width%3A100%25%3Bheight%3A96px%3Bposition%3Aabsolute%3Bleft%3A0px%3Bbottom%3A0px%3B'
      );
  }
  return menu;
};

// 修复播放声音时重复读取音频的问题
const FixPlaySound = () => {
  PlaySound = (url, vol, pitchVar) => {
    let volume = 1;
    let volumeSetting = Game.volume;
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
      let sound = Sounds[url];
      sound.volume = Math.pow((volume * volumeSetting) / 100, 2);
      sound.currentTime = 0;
      sound.play();
    }
  };
};

// 去除时间格式的逗号
const ModSayTime = MOD => {
  const oldSayTime = Game.sayTime;
  Game.sayTime = (time, detail) => oldSayTime(time, detail).replace(/,/g, '');
};

// 在游戏加载前就修复Loc函数 (需要赶在本地化成就之前就生效)
FixParseLoc();
FixPlaySound();

Game.registerMod('TWCNClickerCN', {
  init: function () {
    // 提供语言给函数
    this.lang = localStorageGet('CookieClickerLang');
    this.lastSpaceKeyStatus = 0;

    // 修复官方游戏的一些BUG
    InjectCSS(this);
    FixGardenTooltip(this);
    SetupMenuHooks(this);
    AddMenuHook(FixStatMenu);

    // onDraw
    Game.registerHook('draw', () => {
      if (
        this.lang == 'ZH-CN' &&
        Game.prefs.numbercn &&
        this.lastSpaceKeyStatus != Game.keys[UNIT_TOGGLE_KEY]
      ) {
        // 检测空格变化
        this.lastSpaceKeyStatus = Game.keys[UNIT_TOGGLE_KEY];
        BeautifyAll();
        Game.RefreshStore();
        Game.upgradesToRebuild = 1;
      }
    });

    // 只有语言是中文的时候启用模组
    if (this.lang == 'ZH-CN') {
      // 默认设置参数
      if (Game.prefs.numbercn == null) Game.prefs.numbercn = 1;

      ModSayTime(this);
      ModGameUnit(this);
      ModCookiesFormat(this);
      AddMenuHook(ModPrefMenu);
    }
  },
  save: function () {
    return JSON.stringify({
      prefs: {
        numbercn: Game.prefs.numbercn,
      },
    });
  },
  load: function (str) {
    let data = JSON.parse(str);
    for (let pref in data.prefs) {
      Game.prefs[pref] = data.prefs[pref];
    }
  },
});
