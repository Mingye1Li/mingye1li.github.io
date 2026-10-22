import type {APIContext} from 'astro';
import {locales,defaultLocale,type Locale} from '../../i18n';
import {getSearchEntries} from '../../lib/content';
export function getStaticPaths(){return locales.filter(code=>code!==defaultLocale).map(lang=>({params:{lang}}));}
export async function GET({params}:APIContext){return Response.json(await getSearchEntries(params.lang as Locale));}
