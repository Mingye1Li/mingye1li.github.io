# mlii01

参照 [codem8.dev](https://codem8.dev/) 的页面结构与交互，重新编写的完整源码项目。包含 Astro 页面、Svelte 组件、TypeScript 终端解释器、样式、Markdown/MDX 内容、测试与 GitHub Pages 工作流。`dist/` 是可重新生成的构建结果，不是项目源码。

## 开始使用

```sh
npm ci
npm run dev
```

打开终端打印的本地地址，默认是 `http://127.0.0.1:4321/`。

```sh
npm run check    # Astro / TypeScript / Svelte 检查
npm test        # 路径、搜索、虚拟文件系统、管道、存储和游戏逻辑
npm run build   # 生成 dist/
npm run preview # 预览构建结果
npm run verify  # 完整检查，含生成页面的内部链接及资源检查
```

项目通过 `package-lock.json` 锁定依赖。使用 Node.js 22.23.4 或更新版本；开发依赖中也包含项目内的 Node 22 运行时，供 npm scripts 使用，不会修改系统 Node。

## 部署到 GitHub Pages

当前部署仓库：[Mingye1Li/mingye1li.github.io](https://github.com/Mingye1Li/mingye1li.github.io)，网站地址为 [https://mingye1li.github.io/](https://mingye1li.github.io/)。站点品牌保留为 **mlii01**；GitHub 用户名决定 Pages 域名。

1. 将**整个源码项目**推送到你的 GitHub 仓库，默认分支使用 `main`。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 推送到 `main`，或在 **Actions → Deploy to GitHub Pages → Run workflow** 手动运行。
4. 工作流会检查、构建并发布；访问部署任务输出的 URL。

支持两种地址：

- 用户主页：仓库名 `mingye1li.github.io` → `https://mingye1li.github.io/`
- 项目主页：例如仓库名 `mlii` → `https://mingye1li.github.io/mlii/`

工作流用 GitHub 官方 `configure-pages` 的 `origin`、`base_path` 自动配置站点。无需手动改资源路径、复制 `dist` 到源码分支，也不需要部署服务端。若默认分支不是 `main`，修改 `.github/workflows/deploy.yml` 的分支设置。

本地模拟项目子目录（PowerShell）：

```powershell
$env:SITE_URL='https://mingye1li.github.io'
$env:BASE_PATH='/mlii/'
npm run build
node scripts/verify-build.mjs
npm run preview
```

或把 `.env.example` 复制成 `.env` 后编辑。`SITE_URL` 写 origin；项目路径由 `BASE_PATH` 单独设置。

## 修改个人内容

| 内容 | 文件 |
| --- | --- |
| 品牌、GitHub、联系方式、技能、经历、简历 | `src/config.ts` |
| 个人简介、界面翻译 | `src/i18n/locales/*.json` |
| 语言注册 | `src/i18n/config.mjs` |
| 页面模板 | `src/views/*.astro` |
| 博文 | `src/content/blog/**/*.md` 或 `.mdx` |
| 项目 | `src/content/portfolio/*.md` |
| 样式、布局与断点 | `src/styles/global.css` |
| ASCII 动画 | `src/components/AsciiHero.svelte`、`src/lib/ascii-engines.ts`、`src/lib/ascii/` |
| 主题与字体 | `src/lib/preferences.ts`、`ThemePicker.svelte` |
| 终端界面 | `src/components/terminal/Terminal.svelte` |
| 命令解析与虚拟文件系统 | `src/lib/terminal/shell.ts` |
| 小游戏与文字冒险 | `src/components/terminal/Arcade.svelte`、`Adventure.svelte`、`src/lib/terminal/` |
| 部署配置 | `astro.config.mjs`、`.github/workflows/deploy.yml` |

未提供的邮箱、LinkedIn、地点、工作经历默认留空；简历与原站一样显示 `Coming soon.`。项目中的文章是可编辑的原创示例，队列项目明确标为示例，没有把原作者履历或项目经历冒充成你的个人信息。

## 已实现的页面与交互

- 首页 8 种 ASCII 动画轮换、鼠标扰动，最新文章、精选项目；响应式顶部导航。动画使用原站相同的模拟参数、字符网格、文字距离场、渐变和边缘效果。
- i18next + Astro 多语言：英文 `/`、简体中文 `/zh/`，保存语言偏好、切换保留页面及章节、每语言搜索与 RSS；扩展方法见 [docs/I18N.md](docs/I18N.md)。
- About、Blog、Portfolio、Resume、文章详情、项目详情、层级分类页和 404。
- 20 种 DaisyUI 主题，2 种正文字体、5 种终端字体；浏览器持久化。
- `Ctrl/Cmd + K` 搜索，方向键选择、Enter 跳转、Escape 关闭；索引含文章正文。
- 博客日期/标题排序，项目技术标签筛选，文章目录、相邻文章与相关文章。
- Markdown 复制、在终端阅读文章、标题永久链接、代码高亮/复制、callout、popover、计数器、键盘 tabs、折叠内容、直接选择代码步骤、随主题更新的 Mermaid、MDX 中的 Svelte island。
- `Ctrl/Cmd + J` 终端，居中/抽屉/全屏布局；文件操作、重定向、管道、别名、环境变量、历史、Tab 补全、反向历史搜索、nano 编辑器。
- Snake、每日 Wordle（英语/荷兰语词表、键盘颜色与连胜记录）、Matrix、蒸汽火车，以及可输入命令、收集项目蓝图、打开实际页面的文字冒险。
- RSS、sitemap、canonical、Open Graph、跳过导航、键盘焦点、减少动态效果支持。

终端完全运行在浏览器。`rm`、`nano` 等命令只修改本地虚拟数据，不会读写电脑文件或改动仓库中的文章。`reset` 恢复虚拟文件系统；主题、字体和每日游戏使用独立存储键。

此次品牌从旧名称迁移为 `mlii01`。在同一浏览器 origin 上，旧偏好、游戏记录与终端文件会自动读取并迁移；用户文件正文不会被替换。默认 Pages 域名、项目路径、搜索索引和源码包名称也已更新。浏览器存储受 origin 隔离，换域名时不会自动跨域搬运数据。

## 复刻范围与差异

这是根据公开页面重写的实现，**不是原作者未公开仓库的恢复版本**。原站链接的 `jensdn/codem8-home` 在检查时返回 404。页面结构、颜色系统、控件和主要功能都可在本项目源码中修改；首页 ASCII 模拟已与原站公开模块的 60 帧固定输入轨迹逐项对比，8 种模式的字符与透明度全部一致；品牌文字改为 MLII01。实际运行的随机初态、动画时刻、字体设置和设备像素比仍会影响截图。代码步骤动画与小游戏实现不同。

原站的 Trilium ETAPI 导入、可能存在的 Node 服务、ImageKit 配置没有照搬：GitHub Pages 版本使用本地内容集合和静态资源，不需要私有凭据。代码步骤采用淡入/位移切换，不是原站可能使用的字符级 Magic Move 算法；Gist 组件提供原始代码链接而不注入第三方脚本。

架构证据见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，本次交互对比见 [docs/INTERACTION_AUDIT.md](docs/INTERACTION_AUDIT.md)，验证记录见 [docs/VALIDATION.md](docs/VALIDATION.md)，写作说明见 [docs/AUTHORING.md](docs/AUTHORING.md)，字体来源见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
