<script lang="ts">
  export let text = 'Small components. Living pages.';
  export let label = 'Interactive Svelte island';
  let count=0;
</script>
<button class="gradient-text" style="font-size:22px;font-weight:600" onclick={()=>count++} aria-label={label}>{text} {count ? `(${count})` : ''}</button>
