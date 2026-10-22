import { getCollection } from 'astro:content';

import { navigation, site } from '../config';
import type { SearchEntry } from './search';
import { defaultLocale, localizedPath, translator, type Locale } from '../i18n';

export async function getPosts(locale:Locale=defaultLocale) {
  const originals=await getCollection('blog',({data})=>!data.draft);
  const translations=locale===defaultLocale?[]:await getCollection('translatedBlog',({data})=>!data.draft);
  return originals.map(original=>{
    const entry=translations.find(item=>item.id===`${locale}/blog/${original.id}`)??original;
    return {...original,data:entry.data,body:entry.body,entry,translated:locale===defaultLocale||entry!==original};
  }).sort((a,b)=>b.data.date.valueOf()-a.data.date.valueOf());
}
export async function getProjects(locale:Locale=defaultLocale) {
  const originals=await getCollection('portfolio');
  const translations=locale===defaultLocale?[]:await getCollection('translatedPortfolio');
  return originals.map(original=>{
    const entry=translations.find(item=>item.id===`${locale}/portfolio/${original.id}`)??original;
    return {...original,data:entry.data,body:entry.body,entry,translated:locale===defaultLocale||entry!==original};
  }).sort((a,b)=>b.data.year-a.data.year);
}
export async function getSearchEntries(locale:Locale=defaultLocale): Promise<SearchEntry[]> {
  const [posts, projects] = await Promise.all([getPosts(locale), getProjects(locale)]);
  const t=translator(locale),href=(path:string)=>localizedPath(path,locale);
  return [
    ...navigation.map(n => ({ title: n.path === '/' ? site.name : t(`nav.${n.key}`), description: t('search.open',{page:t(`nav.${n.key}`)}), url: href(n.path), type: 'page' as const, tags: [] })),
    ...posts.map(p => ({ title: p.data.title, description: p.data.description, url: href(`/blog/${p.id}/`), type: 'post' as const, tags: p.data.tags, body: p.body })),
    ...projects.map(p => ({ title: p.data.title, description: p.data.description, url: href(`/portfolio/${p.id}/`), type: 'project' as const, tags: p.data.tags, body: p.body })),
  ];
}
