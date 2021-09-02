# Cookie Clicker 简体中文补全计划

> Made with ❤️ by TeeworldsCN community

---

## 这是什么？

这个是为 Cookie Clicker 的 Steam 版本准备的翻译模组。目的是为了修正一些官方翻译的错误与补充缺失的次要文本。

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
2. 按照这个模式编写你的翻译

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
