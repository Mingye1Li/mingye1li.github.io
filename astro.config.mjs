import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { unified } from '@astrojs/markdown-remark';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode, {pluginFramesTexts} from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { pluginCollapsibleSections,pluginCollapsibleSectionsTexts } from '@expressive-code/plugin-collapsible-sections';
import tailwindcss from '@tailwindcss/vite';
import remarkDirective from 'remark-directive';
import { remarkWidgets, rehypeDiagrams } from './src/plugins/markdown.mjs';
import { languages, defaultLocale,contentLocale } from './src/i18n/config.mjs';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
for (const language of Object.values(languages)) {
  const text={...languages[defaultLocale].messages.code,...language.messages.code};
  pluginFramesTexts.addLocale(language.htmlLang,{terminalWindowFallbackTitle:text.terminal,copyButtonTooltip:text.copy,copyButtonCopied:text.copied});
  pluginCollapsibleSectionsTexts.addLocale(language.htmlLang,{collapsedLines:text.collapsed});
}
export default defineConfig({
  site: process.env.SITE_URL || env.SITE_URL || 'https://mingye1li.github.io',
  base: process.env.BASE_PATH || env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  i18n: { locales: Object.keys(languages), defaultLocale, routing: { prefixDefaultLocale: false } },
  integrations: [
    expressiveCode({
      getBlockLocale: ({file}) => languages[contentLocale(file.path)].htmlLang,
      plugins: [pluginLineNumbers(), pluginCollapsibleSections()],
      themes: ['github-dark', 'github-light'],
      themeCssSelector: (theme) => theme.name === 'github-light' ? '[data-color-mode="light"]' : '[data-color-mode="dark"]',
    }),
    mdx(), svelte(), sitemap(),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkWidgets],
      rehypePlugins: [rehypeDiagrams],
    }),
  },
  vite: { plugins: [tailwindcss()] },
});
