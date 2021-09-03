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
    var unit = '';
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
    return Math.round(val * 1000) / 1000 + unit;
  };

  // 魔改全局数字格式化函数
  Beautify = (val, floats) => {
    var negative = val < 0;
    var decimal = '';
    var fixed = val.toFixed(floats);
    if (Math.abs(val) < 1000 && floats > 0 && Math.floor(fixed) != fixed)
      decimal = '.' + fixed.toString().split('.')[1];
    val = Math.floor(Math.abs(val));
    if (floats > 0 && fixed == val + 1) val++;
    var output;
    if (Game.prefs.numbercn) {
      output =
        val >= 1e76 && isFinite(val)
          ? val.toPrecision(3).toString()
          : FormatterCN(val)
              .toString()
              .replace(/\B(?=(\d{4})+(?!\d))/g, ',');
    } else {
      output =
        val.toString().indexOf('e+') != -1
          ? val.toPrecision(3).toString()
          : numberFormatters[2](val)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    if (output == '0') negative = false;
    return negative ? '-' + output : output + decimal;
  };
};

// 替换花园小游戏的提示图片（因为里面有文本）
const ModGardenTip = MOD => {
  const hackMinigame = () => {
    if (Game.isMinigameReady(Game.Objects['Farm'])) {
      console.log('[CCCN] Garden minigame loaded, replacing image.');
      var oldDescFunc = Game.Objects['Farm'].minigame.tools.info.descFunc;
      Game.Objects['Farm'].minigame.tools.info.descFunc = () => {
        return oldDescFunc().replace(
          'src="img/gardenTip.png"',
          'src="' + MOD.dir + '/gardenTip.png" width="120"'
        );
      };
    } else {
      setTimeout(hackMinigame, 500);
    }
  };
  hackMinigame();
};

// 修复parseLoc
const FixParseLoc = MOD => {
  parseLoc = function (str, params) {
    if (typeof params === 'undefined') params = [];
    else if (params.constructor !== Array) params = [params];
    if (!str) return '';

    if (params.length == 0) return str;

    if (str.constructor === Array) {
      if (typeof params[0] === 'object') {
        var plurIndex = locPlur(params[0].n);
        plurIndex = Math.min(str.length - 1, plurIndex);
        str = str[plurIndex];
        str = replaceAll('%1', params[0].b, str);
      } else {
        var plurIndex = locPlur(params[0]);
        plurIndex = Math.min(str.length - 1, plurIndex);
        str = str[plurIndex];
        str = replaceAll('%1', params[0], str);
      }
    }

    var out = '';
    var len = str.length;
    var inPercent = false;
    for (var i = 0; i < len; i++) {
      var it = str[i];
      if (inPercent) {
        inPercent = false;
        if (!isNaN(it) && params.length >= parseInt(it) - 1) out += params[parseInt(it) - 1];
        else out += '%' + it;
      } else if (it == '%') inPercent = true;
      else out += it;
    }
    if (inPercent) out += '%';
    return out;
  };
};

// 设置菜单扩充
const ModMenu = MOD => {
  var oldMenu = Game.UpdateMenu;
  Game.UpdateMenu = function () {
    oldMenu();
    if (Game.onMenu == 'prefs') {
      var menu = l('menu').innerHTML;
      l('menu').innerHTML = menu.replace(
        '<div style="height:128px;"></div>',
        '<div class="framed" style="margin:4px 48px;">' +
          '  <div class="block" style="padding:0px;margin:8px 4px;">' +
          '   <div class="subsection" style="padding:0px;">' +
          '    <div class="title">中文模组设置</div>' +
          '    <div class="listing">' +
          Game.WriteButton(
            'numbercn',
            'numbercnButton',
            '使用单位缩短数字' + ON,
            '使用单位缩短数字' + OFF,
            'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;'
          ) +
          '<label>(' +
          '使用中文单位显示数字' +
          ')</label><br>' +
          '    </div>' +
          '   </div>' +
          '  </div>' +
          '</div><div style="height:128px;"></div>'
      );
    }
  };
};

Game.registerMod('TWCNClickerCN', {
  init: function () {
    let lang = localStorageGet('CookieClickerLang');
    FixParseLoc(this);

    // 只有语言是中文的时候启用模组
    if (lang == 'ZH-CN') {
      // 默认设置参数
      if (Game.prefs.numbercn == null) {
        Game.prefs.numbercn = 1;
      }
      ModGameUnit(this);
      ModGardenTip(this);

      ModMenu(this);
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
    var data = JSON.parse(str);
    for (var pref in data.prefs) {
      Game.prefs[pref] = data.prefs[pref];
    }
  },
});
