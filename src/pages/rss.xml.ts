import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import { site } from '../config';
import { withBase } from '../lib/paths';
export async function GET(context: APIContext) {
  return rss({ title: site.name, description:site.description, site:context.site!, items:(await getPosts()).map(p => ({ title:p.data.title, description:p.data.description, pubDate:p.data.date, link:withBase(`/blog/${p.id}/`) })) });
}
