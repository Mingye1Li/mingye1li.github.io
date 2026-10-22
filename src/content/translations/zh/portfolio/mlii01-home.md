---
title: mlii01 个人主页
description: 使用 Astro、Svelte 和 Tailwind CSS 构建的个人作品集与博客，包含 ASCII 动画、多彩主题和浏览器交互终端。
year: 2026
tags: [astro, svelte, tailwind, typescript, vite]
featured: true
live: /
---

## mlii01 个人主页 {#mlii01-home}

这就是你正在浏览的网站：一个记录文章、项目和实验的地方。界面借鉴了经典终端，同时保留常规导航和易读的页面。

## 目标 {#goals}

- 通过静态 HTML 交付有用的内容。
- 让内容和组件易于编辑。
- 为交互功能增添探索的乐趣。
- 无需服务器或付费服务，即可运行在 GitHub Pages 上。

## 技术栈 {#technical-stack}

| 层级 | 实现 |
| --- | --- |
| 页面 | Astro 静态生成 |
| 交互组件 | Svelte islands |
| 样式 | Tailwind CSS v4 与 DaisyUI v5 |
| 内容 | Markdown 与 MDX 集合 |
| 多语言 | i18next 与 Astro 路由 |
| 代码示例 | Expressive Code |
| 图表 | 按需加载的 Mermaid |
| 部署 | GitHub Actions 与 Pages |

## 设计选择 {#design-decisions}

页面保持简洁：小标签、轻巧的卡片边框和单列布局为文字留出空间。生成式 ASCII 图案为首页带来动态效果，无需下载大型视频或图片。

主题、字体和语言设置保存在浏览器中。终端包含虚拟文件系统、管道、文本编辑器和小游戏。所有功能都可以在源码中修改。

## 本地开发 {#local-development}

```sh
npm ci
npm run dev
```

检查并构建完整项目：

```sh
npm run verify
```
