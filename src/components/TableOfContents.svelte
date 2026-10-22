<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { onMount } from 'svelte';

  export let headings: { depth: number; slug: string; text: string }[];
  let active = headings[0]?.slug ?? '';
  let expanded = false;
  let enhanced = false;
  let nav: HTMLElement;
  let list: HTMLUListElement;
  let toggle: HTMLButtonElement;

  onMount(() => {
    enhanced = true;
    const article = document.getElementById('article-content');
    const sections = headings.flatMap((heading, index) => {
      const element = document.getElementById(heading.slug);
      return element && article?.contains(element) ? [{ ...heading, element, index }] : [];
    });
    const links = [...list.querySelectorAll('a')];
    let frame = 0;
    let offset = 80;

    const update = () => {
      frame = 0;
      let current: (typeof sections)[number] | undefined = sections[0];
      for (const section of sections) {
        if (section.element.getBoundingClientRect().top <= offset + 2) current = section;
        else break;
      }
      // The last section may be too short to reach the top of the viewport.
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = sections.at(-1);
      }
      if (!current || active === current.slug) return;
      active = current.slug;
      const link = links[current.index];
      if (!link || !list.clientHeight) return;
      const item = link.getBoundingClientRect(), bounds = list.getBoundingClientRect();
      // Scroll only the menu when the current item is outside its visible portion.
      if (item.top < bounds.top) list.scrollTop -= bounds.top - item.top;
      else if (item.bottom > bounds.bottom) list.scrollTop += item.bottom - bounds.bottom;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = () => {
      offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
      schedule();
    };
    const outside = (event: MouseEvent) => {
      if (!nav.contains(event.target as Node)) expanded = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expanded) { expanded = false; toggle.focus(); }
    };
    const observer = new ResizeObserver(schedule);
    if (article) observer.observe(article);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('hashchange', schedule);
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('site:preferences', resize);
    resize();
    // ClientRouter can restore an initial history entry to the top on reload.
    // Honour its section fragment when no saved reading position was restored.
    const initialFrame = requestAnimationFrame(() => {
      if (window.scrollY !== 0 || !location.hash) return;
      let slug: string;
      try { slug = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      sections.find(section => section.slug === slug)?.element.scrollIntoView({ block: 'start', behavior: 'instant' });
      schedule();
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(initialFrame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      window.removeEventListener('hashchange', schedule);
      document.removeEventListener('click', outside);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('site:preferences', resize);
    };
  });
</script>

<nav class="toc-nav" class:enhanced class:expanded bind:this={nav} data-article-toc aria-label={t("article.tocLabel")}>
  <div class="toc-heading">
    <p>{t("article.toc")}</p>
    <button type="button" bind:this={toggle} hidden={!enhanced} aria-label={t("article.tocToggle")} aria-expanded={expanded} aria-controls="article-toc-links" onclick={() => expanded = !expanded}>
      <span aria-hidden="true">{expanded ? '−' : '+'}</span>
    </button>
  </div>
  <ul class="toc-list" id="article-toc-links" bind:this={list}>
    {#each headings as heading}
      <li class:subheading={heading.depth === 3}>
        <a href={`#${encodeURIComponent(heading.slug)}`} aria-current={active === heading.slug ? 'location' : undefined} onclick={() => { active = heading.slug; expanded = false; }}>{heading.text}</a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .toc-nav { font: 12px/1.5 var(--ui-font-mono); }
  .toc-heading { display: flex; align-items: center; justify-content: space-between; }
  .toc-heading p { margin: 0 0 10px 12px; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; opacity: .5; }
  .toc-heading button { display: none; }
  .toc-list { list-style: none; padding: 0; margin: 0; max-height: calc(100dvh - var(--header-height) - 92px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
  li { margin: 0; }
  a { display: block; padding: 5px 10px; border-left: 2px solid var(--color-base-300); color: color-mix(in srgb, var(--color-base-content) 60%, transparent); overflow-wrap: anywhere; text-decoration: none; transition: color .15s, border-color .15s; }
  .subheading a { padding-left: 24px; font-size: 11px; }
  a:hover { color: var(--color-base-content); }
  a[aria-current="location"] { color: var(--color-primary); border-left-color: var(--color-primary); }
  a:focus-visible, button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; border-radius: 2px; }
  @media (max-width: 1023px) {
    .toc-nav { position: relative; border: 1px solid var(--color-base-300); border-radius: 6px; background: var(--color-base-100); }
    .toc-heading { padding: 4px 8px 4px 16px; min-height: 44px; }
    .toc-heading p { margin: 0; }
    .toc-heading button:not([hidden]) { display: grid; place-items: center; width: 36px; height: 36px; font-size: 20px; cursor: pointer; }
    .toc-list { position: absolute; left: -1px; right: -1px; top: 100%; padding: 8px; max-height: min(55dvh, 420px); border: 1px solid var(--color-base-300); border-radius: 0 0 6px 6px; background: var(--color-base-100); box-shadow: 0 12px 24px #0002; }
    .enhanced:not(.expanded) .toc-list { display: none; }
  }
</style>
