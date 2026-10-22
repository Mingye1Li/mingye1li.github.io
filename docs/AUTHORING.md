# 写作与自定义

界面文案与个人简介位于 `src/i18n/locales/`。语言配置、文章译文和稳定章节 ID 的维护方法见 [I18N.md](I18N.md)。

## 添加博文

在 `src/content/blog/` 创建 `.md` 或 `.mdx` 文件：

```md
---
title: 第一篇笔记
description: 一句话摘要。
date: 2026-10-22
tags: [astro, notes]
categories: [Engineering/Frontend]
draft: false
---

## 开始

在这里写正文。
```

`src/content/blog/notes/first.md` 对应 `/blog/notes/first/`，子目录部署时自动增加仓库前缀。`draft: true` 的文章不会被生成或索引。每一级分类都自动生成归档页面。

正文使用普通 Markdown。代码块可加 `title="file.ts"`、`showLineNumbers`、`{2-4}`、`collapse={3-8}` 等 Expressive Code 标记。

## 交互式 Markdown

```md
:::tip
提示内容。
:::

:counter{start="0" label="clicks"}

:pop[术语]{note="补充解释"}

:::details{summary="展开更多"}
隐藏内容。
:::

:::::tabs
::::tab{label="示例一"}
第一组内容。
::::
::::tab{label="示例二"}
第二组内容。
::::
:::::
```

Callout 类型：`note`、`tip`、`info`、`warning`、`danger`、`caution`。

`:::::magic-move{title="example.ts"}` 内用 `::::step{caption="步骤说明"}` 包裹各段代码。嵌套容器的外层冒号数量必须多于内层；外层用五个、内层用四个。代码步骤提供前后按钮、数字选择按钮、方向键及 Home/End，使用淡入/位移过渡。

Mermaid 图直接写入语言为 `mermaid` 的 fenced code block。图表会随浅色/深色主题重新渲染。文章 H2/H3 自动进入页内目录，正文 H2–H6 自动附带可分享的标题链接。

支持 `::youtube{id="..."}`、`::sandbox{id="..."}`、`::gist{id="USER/ID"}`；前两者先显示加载按钮，点击后生成 iframe，Gist 生成到原始代码的链接。加载第三方嵌入时，访问者的浏览器会连接相应服务。

## MDX 与组件

MDX 可以 import Svelte 组件并通过 `client:visible`、`client:load` 等 Astro 指令 hydration。参考 `src/content/blog/l/authoring-reference.mdx`。

静态内容优先用 Markdown。只有需要组件导入时才用 MDX。

## 添加项目

在 `src/content/portfolio/` 新建文件：

```yaml
---
title: My project
description: What it does.
year: 2026
tags: [typescript, svelte]
featured: true
github: https://github.com/your-name/your-project
live: https://example.com
---
```

`featured: true` 出现在首页，`github` 和 `live` 可省略。不要填入不存在的仓库地址。

## 图片和链接

优先把图片放进 `src/assets/` 并使用 Astro `Image`；公共静态文件放进 `public/`。写在组件中的内部 URL 使用 `withBase('/path/')`。Markdown 中尽量使用相对链接，避免写死站点根路径而遗漏项目 Pages 的仓库前缀。

## 修改整体品牌

站点展示内容集中在 `src/config.ts`；首页 ASCII 文字在 `AsciiHero.svelte` 的 `word` 属性中。当前交付品牌已经是 mlii01。终端提示符、偏好存储键和 favicon 同样位于源码中，可按需要修改。

首页每次访问轮换 8 种动画。预览特定模式时使用 `/?asciiEngine=game-of-life`（项目 Pages 使用 `/仓库名/?asciiEngine=game-of-life`）。可用值为 `flow-field`、`plasma`、`game-of-life`、`reaction-diffusion`、`flocking`、`wave-interference`、`contour`、`attractor`。
