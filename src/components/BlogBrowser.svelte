<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { withBase, categorySlug } from '../lib/paths';
  export let posts: { id: string; title: string; description: string; date: string; tags: string[]; categories: string[] }[];
  let sort: 'date' | 'title' = 'date';
  let ascending = false;
  $: sorted = [...posts].sort((a,b) => (sort === 'date' ? a.date.localeCompare(b.date) : a.title.localeCompare(b.title)) * (ascending ? 1 : -1));
  function order(key: 'date' | 'title') { if (sort === key) ascending = !ascending; else { sort = key; ascending = key === 'title'; } }
</script>
<table class="blog-table">
  <thead><tr><th aria-sort={sort === 'date' ? ascending ? 'ascending' : 'descending' : 'none'}><button onclick={() => order('date')}>{t("list.date")} {sort === 'date' ? ascending ? '↑' : '↓' : ''}</button></th><th aria-sort={sort === 'title' ? ascending ? 'ascending' : 'descending' : 'none'}><button onclick={() => order('title')}>{t("list.title")} {sort === 'title' ? ascending ? '↑' : '↓' : ''}</button></th><th class="taxonomy">{t("list.categories")}</th></tr></thead>
  <tbody>{#each sorted as post}<tr><td><a href={localizedPath(`/blog/${post.id}/`,locale)} aria-label={t("list.read",{title:post.title,date:post.date})}><time datetime={post.date}>{post.date}</time></a></td><td><a href={localizedPath(`/blog/${post.id}/`,locale)}>{post.title}</a><p>{post.description}</p></td><td class="taxonomy">{#each post.categories as category}<a href={localizedPath(`/blog/category/${categorySlug(category)}/`,locale)}>{category.split('/').at(-1)}</a>{/each}<div class="tags">{#each post.tags.slice(0,2) as tag}<span class="tag">{tag}</span>{/each}</div></td></tr>{/each}</tbody>
</table>
