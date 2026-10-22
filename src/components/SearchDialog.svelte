<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { tick } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { searchEntries, type SearchEntry } from '../lib/search';
  export let entries: SearchEntry[];
  export let onclose: () => void;
  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let query = '';
  let selected = 0;
  $: results = searchEntries(entries, query).slice(0, 16);
  $: if (query !== undefined) selected = 0;
  export async function show() { query = ''; dialog.showModal(); await tick(); input.focus(); }
  export function close() { if (dialog.open) dialog.close(); }
  function choose(index = selected) { const item = results[index]; if (item) { close(); navigate(item.url); } }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); selected = results.length ? (selected + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length : 0;
      tick().then(() => document.getElementById(`search-result-${selected}`)?.scrollIntoView({ block: 'nearest' }));
    } else if (event.key === 'Enter') { event.preventDefault(); choose(); }
  }
</script>

<dialog bind:this={dialog} class="search-dialog" aria-label={t("search.label")} onclose={onclose} onclick={(e) => { if (e.target === dialog) close(); }} onkeydown={keydown}>
  <div class="search-box">
    <div class="search-input-row"><span aria-hidden="true">⌕</span><input bind:this={input} bind:value={query} role="combobox" aria-label={t("search.label")} aria-autocomplete="list" aria-expanded="true" aria-controls="search-results" aria-activedescendant={results.length ? `search-result-${selected}` : undefined} placeholder={t("search.placeholder")} autocomplete="off" spellcheck="false"/><button onclick={close} aria-label={t("search.close")}><kbd>esc</kbd></button></div>
    <div class="search-results" id="search-results" role="listbox" aria-label={t("search.results")}>
      {#if !results.length}<p class="empty-state">{t("search.empty")}</p>{:else}
        <p class="menu-label">{t("search.results")}</p>
        {#each results as item, index}
          <button id={`search-result-${index}`} role="option" aria-selected={index === selected} class:active={index === selected} onclick={() => choose(index)} onpointermove={() => selected = index}>
            <span class="result-symbol">{item.type === 'post' ? '▤' : item.type === 'project' ? '◇' : '~'}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><span class="result-type">{t(`search.${item.type}`)}</span>
          </button>
        {/each}
      {/if}
    </div>
    <footer><span><kbd>↑↓</kbd> {t("search.navigate")}</span><span><kbd>↵</kbd> {t("search.select")}</span><span><kbd>esc</kbd> {t("search.dismiss")}</span></footer>
  </div>
</dialog>
