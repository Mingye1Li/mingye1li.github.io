import en from './locales/en.json' with { type: 'json' };
import zh from './locales/zh.json' with { type: 'json' };

// Add another JSON import and one entry here to enable a new language everywhere.
export const languages = {
  en: { label: 'English', short: 'EN', htmlLang: 'en', messages: en },
  zh: { label: '简体中文', short: '中文', htmlLang: 'zh-CN', messages: zh },
};
export const defaultLocale = 'en';

/** Content files use the locale directory; UI routes use the same registry. */
export function contentLocale(path='') {
  const code=path.replaceAll('\\','/').match(/\/translations\/([^/]+)\//)?.[1];
  return code && Object.hasOwn(languages,code) ? code : defaultLocale;
}
