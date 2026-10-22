<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { onMount, tick } from 'svelte';
  import { Adventure } from '../../lib/terminal/adventure';
  import type { SearchEntry } from '../../lib/search';
  export let entries: SearchEntry[];
  export let onexit: () => void;
  export let onnavigate: (url:string) => void;
  const game = new Adventure(entries,locale);
  let command = '', room = game.room, collected = 0;
  let transcript = [`THE MLII01 DUNGEON\nType help for commands. Explore the site and collect ${game.total} project blueprints.`,game.look()];
  let input: HTMLInputElement, output: HTMLDivElement;
  onMount(() => input.focus());
  async function run(value = command) {
    if(!value.trim()) return;
    const result = game.run(value);
    transcript = [...transcript, `> ${value}`, result.output].slice(-100);
    room=game.room;collected=game.inventory.size;command='';
    if(result.url) { onnavigate(result.url); return; }
    if(result.exit) { onexit(); return; }
    await tick(); output.scrollTop=output.scrollHeight;input.focus();
  }
</script>
<section class="adventure" aria-label={t("game.adventure")}>
  <div class="arcade-bar"><strong>MLII01 DUNGEON</strong><span>artifacts: {collected}/{game.total}</span><button class="outline-button" onclick={onexit}>{t("game.exit")}</button></div>
  <div class="adventure-output" bind:this={output} role="log" aria-live="polite">{#each transcript as line}<p>{line}</p>{/each}</div>
  <div class="adventure-actions">{#each ['look','map','take','inventory','open','back'] as action}<button class="outline-button" onclick={()=>run(action)}>{action}</button>{/each}</div>
  <form class="terminal-input-line" onsubmit={event=>{event.preventDefault();run();}}><label class="terminal-prompt" for="adventure-input">{room} &gt;</label><input id="adventure-input" aria-label={t("game.command")} bind:this={input} bind:value={command} autocomplete="off" spellcheck="false" /></form>
</section>
<style>
  .adventure { display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 16px; gap: 12px; font: 12px/1.6 var(--ui-font-mono); }
  .adventure-output { flex: 1; min-height: 0; overflow: auto; }
  .adventure-output p { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0 0 14px; }
  .adventure-actions { display: flex; flex-wrap: wrap; gap: 5px; }
  .arcade-bar { flex-wrap: wrap; gap: 12px; }
</style>
