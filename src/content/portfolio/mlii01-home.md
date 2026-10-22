---
title: mlii01 Home
description: A personal portfolio and blog built with Astro, Svelte, and Tailwind CSS. An ASCII homepage, expressive themes, and an interactive browser terminal.
year: 2026
tags: [astro, svelte, tailwind, typescript, vite]
featured: true
live: /
---

## mlii01 Home

This is the site you are looking at: a small place for articles, projects, and experiments. The interface takes inspiration from classic terminals while keeping ordinary navigation and readable pages.

## Goals

- Deliver useful content as static HTML.
- Keep content and components easy to edit.
- Make the interactive parts fun to explore.
- Run on GitHub Pages without a server or paid service.

## Technical stack

| Layer | Implementation |
| --- | --- |
| Pages | Astro with static generation |
| Interactive components | Svelte islands |
| Styles | Tailwind CSS v4 and DaisyUI v5 |
| Content | Markdown and MDX collections |
| Code examples | Expressive Code |
| Diagrams | Mermaid, loaded on demand |
| Deployment | GitHub Actions and Pages |

## Design decisions

The page is deliberately restrained. Small labels, quiet card borders, and a single content column leave room for the writing. The generative ASCII field adds movement without requiring a large video or image download.

Theme and font settings are local to the browser. The terminal includes a virtual filesystem, shell pipelines, a text editor, and a small arcade. All of those features are implemented in the source tree.

## Local development

```sh
npm ci
npm run dev
```

To check and build the complete project:

```sh
npm run verify
```
