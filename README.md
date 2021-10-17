# Cookie Clicker 简体中文补全计划

> Made with ❤️ by TeeworldsCN community

---

## 这是什么？

这个是为 Cookie Clicker 的 Steam 版本准备的翻译模组。目的是为了修正一些官方翻译的错误与补充缺失的次要文本。（但是还进行了一些其实没什么必要的优化和修复）

## 特性

- **额外功能**
  - 本模组不会触发“第三方”成就，也不会禁用 Steam 成就
  - 使用中文计数单位显示数字（可以在设置中关闭，或按住**Z 键**临时显示完整数字）
    - 最小中文单位为百，从万起计（1000 显示`1000`、10000 显示`1万`、1000000 显示`1百万`）
    - 大数单位均为万进定义（现代默认），从`1e16`起，每 4 数量级进一单位（`1京 = 1e16`）
      - 包括单位（数量级从小到大）：京、垓、秭、穰、沟、涧、正、载、极、恒河沙、阿僧祇、那由他、不可思议、无量、大数。
      - `1亿亿大数(1e88)`及以上会显示为科学计数法，最大可显示`9.99千万亿大数`
      - 单位`兆(1e12)`被跳过，以避免与`百万(1e6)`产生歧义。`1e12`显示为`1万亿`
  - 13 位有效数字的人类科学计数法
    - 原版会显示 `1.141e+22`，此 Mod 会修改为 `1.141 238 428 293×10²²`
    - 此外，未开启中文计数单位的情况下强制将所有大于等于 10¹⁶ 的数字使用科学计数法显示，因为 Javascript 会在自动显示科学计数法之前就开始丢失精度，15 位有效数字是一个比较常见的“还会有数字”的范围
  - 本地化了一些后期解锁的饼干升级
    - 饼干解锁后可以在设置中设置是否使用本地化的版本
- **翻译与校订**
  - 修复了尽可能多的翻译错误。（若发现更多问题欢迎提交 issue 或 PR）
  - 补充上了一些官方翻译禁用掉的引用文本（显示在提示窗口右下角的一些玩梗文本）
    - 引用文本原文一共有 789 条，目前还在逐渐添加中（当前进度：500 左右）
  - 替换/翻译了花园小游戏内的一张带文本的图片
  - (尽量)统一了游戏中空格的使用，空格的规范如下
    - 句子中有阿拉伯数字，百分比的，在两边添加空格，（计数单位和数字算为一整个数字，之间无空格），如：`获得了 1 块饼干。`，`获得了 1百万 块饼干。`
    - 名词后的空格全部删除，如原文：`农场 的生产率翻倍。` 变更为 `农场的生产率翻倍。`
  - 去除了时间格式中的逗号
- **修复**
  - 修复了官方的本地化函数导致字符串结尾的百分号不能显示的问题

## 使用方式：

1. 点击[这里](https://github.com/TeeworldsCN/CookieClickerCN/releases/download/latest/cookieclicker-cn.zip)下载最新的翻译模组。
2. 打开 Cookie Clicker，点击**选项**->**模式**->**管理模式**->**打开/mods 文件夹**。
3. 打开**local**文件夹，并将下载好的模组解压至打开的**local**文件夹中。
4. 关闭并重新打开 Cookie Clicker，在**管理模式**中启用安装好的翻译模组并按提示重新加载游戏即可。

## 如何贡献？

### 小白的方式：

[创建一个 issue](https://github.com/TeeworldsCN/CookieClickerCN/issues/new) 告诉我们你想要做的修改。

### 大佬的方式：

1. 在 `resources/patches` 目录下创建个新的 json 文件。
2. 按照下面的格式编写你的翻译，`translation key`和`原文`可以参考`resources/original.json`文件。

```JSON
{
  "author": "翻译作者名，若不想署名，删除这行",
  "<translation key>": {
    "comment": "[可选行] 在这个key中可以写说明，不需要注释的话请删除",
    "english": "[可选行] 英文原文，可以不写，但是写上比较方便其他人阅读",
    "chinese": "翻译的文本",
  },
}
```

3. 确认 json 格式正确**并**使用[Prettier](https://prettier.io/)格式化。
4. 若想要覆盖其他人的贡献，请在自己的 json 文件中提供更新的翻译，**并**在其他人的贡献文件中的相关条目中添加 `deprecated: "原因"`
5. 提交 Pull Request。
