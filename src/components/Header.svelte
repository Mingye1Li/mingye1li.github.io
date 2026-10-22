<script lang="ts">
  import { onMount } from 'svelte';
  import { navigation, site } from '../config';

  import type { SearchEntry } from '../lib/search';
  import ThemePicker from './ThemePicker.svelte';
  import SearchDialog from './SearchDialog.svelte';
  import Terminal from './terminal/Terminal.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import {localizedPath,unlocalizePath,translator,defaultLocale,type Locale} from '../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);
  const href=(path:string)=>localizedPath(path,locale);
  export let entries: SearchEntry[];
  export let pathname: string;
  let mobileOpen = false;
  let searchOpen = false;
  let terminalOpen = false;
  let searchDialog: SearchDialog;
  let terminal: Terminal;
  let searchButton: HTMLButtonElement;
  let terminalButton: HTMLButtonElement;
  $: current = unlocalizePath(pathname);
  function openSearch() { mobileOpen = false; terminal?.close(); searchOpen = true; searchDialog.show(); }
  function openTerminal(command?: string) { mobileOpen = false; searchDialog?.close(); terminalOpen = true; terminal.show(command); }
  onMount(() => {
    const route = () => { pathname = window.location.pathname; mobileOpen = false; };
    const keyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchOpen ? searchDialog.close() : openSearch(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); terminalOpen ? terminal.close() : openTerminal(); }
      if (e.key === 'Escape') mobileOpen = false;
    };
    const command = (event: Event) => openTerminal((event as CustomEvent<string>).detail);
    const outside = (event: MouseEvent) => { if (!(event.target as Element).closest('.site-header')) mobileOpen = false; };
    document.addEventListener('keydown', keyboard);
    document.addEventListener('astro:page-load', route);
    document.addEventListener('site:terminal', command);
    document.addEventListener('click', outside);
    return () => { document.removeEventListener('keydown', keyboard); document.removeEventListener('astro:page-load', route); document.removeEventListener('site:terminal', command); document.removeEventListener('click', outside); };
  });
</script>

<header class="site-header">
  <nav aria-label={t("nav.main")}>
    <a class="brand" href={href('/')}>{site.name}</a>
    <button class="mobile-toggle nav-button" aria-label={t("nav.menu")} aria-expanded={mobileOpen} aria-controls="mobile-nav" onclick={() => mobileOpen = !mobileOpen}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d={mobileOpen ? 'M6 6l12 12M6 18L18 6' : 'M4 7h16M4 12h16M4 17h16'}/></svg></button>
    <span class="nav-divider"></span>
    <div class="desktop-nav">{#each navigation as item}<a class:active={item.path === '/' ? current === '/' : current.startsWith(item.path.replace(/\/$/, ''))} aria-current={(item.path === '/' ? current === '/' : current.startsWith(item.path.replace(/\/$/, ''))) ? 'page' : undefined} href={href(item.path)}>{locale===defaultLocale?item.name:item.path==='/'?'~/':`/${t(`nav.${item.key}`)}`}</a>{/each}</div>
    <div class="nav-actions">
      <button bind:this={searchButton} class="nav-button" aria-label={t("nav.searchShortcut")} aria-expanded={searchOpen} onclick={openSearch}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><span class="action-label">{t("nav.search")}</span><span class="shortcut"><kbd>Ctrl</kbd><kbd>K</kbd></span></button>
      <button bind:this={terminalButton} class="nav-button" aria-label={t("nav.terminalShortcut")} aria-expanded={terminalOpen} onclick={() => openTerminal()}><span class="terminal-icon">&gt;_</span><span class="action-label">{t("nav.terminal")}</span><span class="shortcut"><kbd>Ctrl</kbd><kbd>J</kbd></span></button>
      <span class="nav-divider small"></span><LanguagePicker {locale}/><ThemePicker {locale} />
    </div>
  </nav>
  {#if mobileOpen}<div class="mobile-nav" id="mobile-nav">{#each navigation as item}<a href={href(item.path)} onclick={() => mobileOpen = false}>{locale===defaultLocale?item.name:item.path==='/'?'~/':`/${t(`nav.${item.key}`)}`}</a>{/each}</div>{/if}
</header>
<SearchDialog {locale} {entries} bind:this={searchDialog} onclose={() => { searchOpen = false; if (!terminalOpen) searchButton?.focus(); }} />
<Terminal {locale} {entries} bind:this={terminal} onclose={() => { terminalOpen = false; if (!searchOpen) terminalButton?.focus(); }} />
