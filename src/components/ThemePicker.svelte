<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { onMount } from 'svelte';
  import { themes, bodyFonts, terminalFonts, readPreference, setPreference } from '../lib/preferences';
  let open = false;
  let theme = 'dark';
  let bodyFont = 'inter';
  let font = 'jetbrains';
  let root: HTMLDivElement;
  onMount(() => {
    const sync = () => { theme = readPreference('theme', 'dark'); bodyFont = readPreference('body-font', 'inter'); font = readPreference('font', 'jetbrains'); };
    sync();
    const outside = (event: MouseEvent) => { if (!root.contains(event.target as Node)) open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') open = false; };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('site:preferences', sync);
    const close = () => open = false;
    document.addEventListener('astro:before-swap', close);
    return () => { document.removeEventListener('click', outside); document.removeEventListener('keydown', escape); document.removeEventListener('site:preferences', sync); document.removeEventListener('astro:before-swap', close); };
  });
</script>

<div class="theme-picker" bind:this={root}>
  <button class="nav-button" aria-label={t("theme.switch")} aria-expanded={open} aria-controls="theme-menu" onclick={() => open = !open}>
    <span class="theme-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>[◐ {t("theme.name")}]</span>
  </button>
  {#if open}
    <div class="theme-menu" id="theme-menu" role="group" aria-label={t("theme.selection")}>
      <p class="menu-label">── {t("theme.select")} ──</p>
      <div class="theme-grid">
        {#each themes as id}
          <button class:chosen={theme === id} aria-pressed={theme === id} onclick={() => setPreference('theme', id)}>
            <span class="theme-preview" data-theme={id}><i></i><i></i><i></i><i></i></span>
            <span>{id === 'lofi' ? 'Lo-Fi' : id.charAt(0).toUpperCase() + id.slice(1)}</span><span class="checkmark">{theme === id ? '✓' : ''}</span>
          </button>
        {/each}
      </div>
      <p class="menu-label">── {t("theme.body")} ──</p>
      <div class="font-options">{#each Object.entries(bodyFonts) as [id, label]}<button aria-pressed={bodyFont === id} class:chosen={bodyFont === id} onclick={() => setPreference('body-font', id)}>{label}</button>{/each}</div>
      <p class="menu-label">── {t("theme.terminal")} ──</p>
      <div class="font-options">{#each Object.entries(terminalFonts) as [id, label]}<button aria-pressed={font === id} class:chosen={font === id} onclick={() => setPreference('font', id)}>{label}</button>{/each}</div>
    </div>
  {/if}
</div>
