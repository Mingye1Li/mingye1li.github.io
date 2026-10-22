import i18next, { type TOptions } from 'i18next';
import { languages, defaultLocale } from './config.mjs';
import { stripBase, withBase } from '../lib/paths';
export { languages, defaultLocale };
export type Locale=keyof typeof languages;
export const locales=Object.keys(languages) as Locale[];
export const isLocale=(value:string):value is Locale=>Object.hasOwn(languages,value);
const instances=new Map<Locale,ReturnType<typeof i18next.createInstance>>();
export function translator(locale:Locale=defaultLocale){
  let instance=instances.get(locale);
  if(!instance){
    instance=i18next.createInstance();
    // Bundled resources initialize synchronously; each locale has its own instance
    // so concurrent static page rendering never shares a mutable current language.
    void instance.init({lng:locale,fallbackLng:defaultLocale,supportedLngs:locales,initAsync:false,resources:Object.fromEntries(locales.map(code=>[code,{translation:languages[code].messages}])),interpolation:{escapeValue:false}});
    instances.set(locale,instance);
  }
  return(key:string,options?:TOptions):string=>instance!.t(key,options) as string;
}
export function localeFromPath(path:string,base?:string):Locale{
  const first=stripBase(path,base).split('/')[1];return isLocale(first)?first:defaultLocale;
}
export function unlocalizePath(path:string,base?:string):string{
  const clean=stripBase(path,base),first=clean.split('/')[1];
  return isLocale(first)?clean.slice(first.length+1)||'/':clean;
}
export function localizedPath(path:string,locale:Locale=defaultLocale,base?:string):string{
  const route=unlocalizePath(path,base);
  const normalized=route==='/404.html'||route==='/404/'?(locale===defaultLocale?'/404.html':'/404/'):route;
  return withBase(`${locale===defaultLocale?'':`/${locale}`}${normalized.startsWith('/')?normalized:`/${normalized}`}`,base);
}
export function pageTranslator(){const locale=document.documentElement.dataset.locale;return translator(locale&&isLocale(locale)?locale:localeFromPath(location.pathname));}
