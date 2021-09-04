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

// 顺带修复花园小游戏Tooltip重复请求资源的BUG
const FixGardenTooltip = MOD => {
  const FixGarden = () => {
    if (Game.isMinigameReady(Game.Objects['Farm'])) {
      // 插入固定的CSS定义
      l('gardenBG').insertAdjacentHTML(
        'beforebegin',
        [
          '<style>',
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
          '</style>',
        ].join('')
      );

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
          MOD.lang === "ZH-CN" ? '<div class="modAssetGardenTipCN"></div>' : '<div class="modAssetGardenTip"></div>'
        );
      };
    } else {
      setTimeout(FixGarden, 500);
    }
  };
  FixGarden();
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
    //  保存语言
    this.lang = localStorageGet('CookieClickerLang');
    
    // 修复官方游戏的一些BUG
    FixParseLoc(this);
    FixGardenTooltip(this);

    // 只有语言是中文的时候启用模组
    if (this.lang == 'ZH-CN') {
      // 默认设置参数
      if (Game.prefs.numbercn == null) {
        Game.prefs.numbercn = 1;
      }
      ModGameUnit(this);
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
