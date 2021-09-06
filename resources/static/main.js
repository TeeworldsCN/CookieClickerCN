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
    const prec = Game.prefs.numbercndecimal;
    return Math.floor(val * prec) / prec + unit;
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

// 顺带修复花园小游戏Tooltip重复请求资源的BUG
const ModGardenTooltip = MOD => {
  const hackGarden = () => {
    if (Game.isMinigameReady(Game.Objects['Farm'])) {
      let M = Game.Objects['Farm'].minigame;

      // 翻译花园小游戏的提示图片（因为里面有文本）
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
        Game.UpgradesById[i].ddesc = BeautifyInText(
          Game.UpgradesById[i].baseDesc || Game.UpgradesById[i].ddesc
        );
      }
      for (var i in Game.AchievementsById) {
        Game.AchievementsById[i].ddesc = BeautifyInText(
          Game.AchievementsById[i].baseDesc || Game.AchievementsById[i].ddesc
        );
      }
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
const ModSlider = function (
  slider,
  leftText,
  rightText,
  startValueFunction,
  min,
  max,
  step,
  callback
) {
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
        '    </div>' +
        '   </div>' +
        '  </div>' +
        '</div><div style="height:128px;"></div>'
    );
  }

  return menu;
};

// 去除时间格式的逗号
const ModSayTime = MOD => {
  const oldSayTime = Game.sayTime;
  Game.sayTime = (time, detail) => oldSayTime(time, detail).replace(/,/g, '');
};

// 在游戏加载前就修复Loc函数 (需要赶在本地化成就之前就生效)
FixParseLoc();

Game.registerMod('TWCNClickerCN', {
  init: function () {
    // 提供语言给函数
    this.lang = localStorageGet('CookieClickerLang');
    this.dirURI = this.dir && 'file:///' + this.dir.replace(/\\/g, '/');
    this.lastSpaceKeyStatus = 0;

    SetupMenuHooks(this);

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
      if (Game.prefs.numbercndecimal == null) Game.prefs.numbercndecimal = 100;

      ModSayTime(this);
      ModGameUnit(this);
      ModCookiesFormat(this);
      ModGardenTooltip(this);
      AddMenuHook(ModPrefMenu);
    }
  },
  save: function () {
    return JSON.stringify({
      prefs: {
        numbercn: Game.prefs.numbercn,
        numbercndecimal: Game.prefs.numbercndecimal,
      },
    });
  },
  load: function (str) {
    let data = JSON.parse(str);
    for (let pref in data.prefs) {
      Game.prefs[pref] = data.prefs[pref];
    }
    BeautifyAll();
  },
});
