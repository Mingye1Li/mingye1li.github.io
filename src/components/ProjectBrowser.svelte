<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { withBase } from '../lib/paths';
  export let projects: { id: string; title: string; description: string; year: number; tags: string[] }[];
  let selected = 'All';
  $: tags = [...new Set(projects.flatMap(p => p.tags))].sort();
  $: filtered = selected === 'All' ? projects : projects.filter(p => p.tags.includes(selected));
</script>
<div class="filter-bar" role="group" aria-label={t("list.filter")}>{#each ['All',...tags] as tag}<button class:active={selected === tag} aria-pressed={selected === tag} onclick={() => selected = tag}>{tag==='All'?t("list.all"):tag}</button>{/each}</div>
<div class="project-grid" aria-live="polite">
  {#each filtered as project}
    <a href={localizedPath(`/portfolio/${project.id}/`,locale)} class="project-tile">
      <div class="project-art" aria-hidden="true"><pre>{project.id === 'mlii01-home' ? '┌────────────────────────────┐\n│  >_ mlii01                 │\n│                            │\n│  code · build · explore    │\n│  █ █ █ ░ ░ ░ ░ ░ ░ ░ ░    │\n└────────────────────────────┘' : '             ┌──────────┐\n  producer ──┤  queue   ├── worker\n             │  ▤ ▤ ▤   ├── worker\n             └──────────┘'}</pre></div>
      <div class="content-card"><div class="card-heading"><h3>{project.title}</h3><span class="date">{project.year}</span></div><p>{project.description}</p><div class="tags">{#each project.tags as tag}<span class="tag">{tag}</span>{/each}</div></div>
    </a>
  {/each}
</div>
