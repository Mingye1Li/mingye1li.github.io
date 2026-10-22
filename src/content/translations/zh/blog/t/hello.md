---
title: 第一篇文章
description: 用一篇短文检查基础功能，也从这里开始写作。
date: 2026-07-08
tags: [astro, markdown]
---

## 你好，世界 {#hello-world}

欢迎来到 **mlii01**。这篇短文用来检查本地 Markdown、日期、标签和文章导航是否正常配合。

```ts
const site = 'mlii01';
console.log(`Hello from ${site}!`);
```

写新文章很简单：在 `src/content/blog/` 中创建 Markdown 文件，填写标题、描述和日期，然后开始写作。下一次构建后，它会自动出现在首页、文章列表、搜索和 RSS 订阅中。

中文译文放在 `src/content/translations/zh/blog/` 的相同相对路径。没有译文的文章会显示英文原文，并附上说明。

:::tip
试试上方的“在终端中打开”，也可以在终端输入 `cat /blog/t/hello.md`。
:::
