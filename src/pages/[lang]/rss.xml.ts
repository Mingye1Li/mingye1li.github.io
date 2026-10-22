import rss from '@astrojs/rss';
import type {APIContext} from 'astro';
import {locales,defaultLocale,localizedPath,translator,type Locale} from '../../i18n';
import {getPosts} from '../../lib/content';
import {site} from '../../config';
export function getStaticPaths(){return locales.filter(code=>code!==defaultLocale).map(lang=>({params:{lang}}));}
export async function GET(context:APIContext){
  const locale=context.params.lang as Locale,t=translator(locale);
  return rss({title:site.name,description:t('site.description'),site:context.site!,items:(await getPosts(locale)).map(post=>({title:post.data.title,description:post.data.description,pubDate:post.data.date,link:localizedPath(`/blog/${post.id}/`,locale)}))});
}
