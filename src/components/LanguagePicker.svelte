<script lang="ts">
  import {navigate} from 'astro:transitions/client';
  import {languages,locales,localizedPath,translator,type Locale} from '../i18n';
  import {writeStored} from '../lib/storage';
  export let locale:Locale;
  $: t=translator(locale);
  function change(event:Event){
    const next=(event.target as HTMLSelectElement).value as Locale;
    try{writeStored('locale',next);}catch{}
    navigate(localizedPath(location.pathname,next)+location.search+location.hash);
  }
</script>
<select class="language-picker nav-button" aria-label={t('nav.language')} value={locale} onchange={change}>
  {#each locales as code}<option value={code} lang={languages[code].htmlLang}>{languages[code].short}</option>{/each}
</select>
