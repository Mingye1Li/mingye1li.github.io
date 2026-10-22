<script lang="ts">
  import { onMount } from 'svelte';
  import { mountAscii } from '../lib/ascii/renderer';
  import {translator,defaultLocale,type Locale} from '../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);
  export let word = 'MLII01';
  let canvas:HTMLCanvasElement,stage:HTMLDivElement;
  let engine='';
  // Keep the animation lifecycle separate from the UI island.
  onMount(()=>mountAscii(stage,canvas,word,label=>engine=label));
</script>

<div class="hero-region" bind:this={stage} role="img" aria-label={t('hero.animation',{engine,word})}>
  <h1 class="sr-only">{word}</h1>
  <canvas bind:this={canvas} data-engine={engine} aria-hidden="true"></canvas>
</div>
