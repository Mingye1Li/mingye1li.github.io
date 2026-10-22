<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { onMount, tick } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { Shell } from '../../lib/terminal/shell';
  import type { SearchEntry } from '../../lib/search';
  import { setPreference } from '../../lib/preferences';
  import { readStored, writeStored } from '../../lib/storage';
  import Arcade from './Arcade.svelte';
  import Adventure from './Adventure.svelte';
  export let entries: SearchEntry[];
  export let onclose: () => void;
  type Line={text:string;kind?:string;links?:{label:string;url:string}[]};
  let lines:Line[]=[];
  let shell=new Shell(entries);
  let dialog: HTMLDialogElement, input: HTMLInputElement, scroll: HTMLDivElement, editor: HTMLTextAreaElement;
  let command='', prompt=shell.prompt, historyAt=0, draft='', mode='centered', program='', editing='', editorText='', editorMessage='', reverse=false;
  let booted=false;
  onMount(()=>{shell=new Shell(entries,readStored('shell'));const savedMode=readStored('terminal-layout');if(savedMode&&['centered','drawer','fullscreen'].includes(savedMode))mode=savedMode;prompt=shell.prompt;historyAt=shell.state.history.length;});
  function persist(){try{writeStored('shell',shell.serialize());}catch{lines=[...lines,{text:t('terminal.storage'),kind:'error'}];}}
  async function focusInput(){await tick();input?.focus();if(scroll)scroll.scrollTop=scroll.scrollHeight;}
  export async function show(initial?:string){
    if(!dialog.open)dialog.showModal();
    if(!booted){lines=[{text:t('terminal.boot'),kind:'accent'},{text:t('terminal.mounting')},{text:'\nmlii01 :: terminal',kind:'accent'},{text:t('terminal.ready')}];booted=true;}
    if(initial){program='';editing='';await run(initial);}else await focusInput();
  }
  export function close(){if(dialog.open)dialog.close();}
  function layout(value:string){mode=value;try{writeStored('terminal-layout',value);}catch{}}
  async function run(value=command){
    if(!value.trim())return;
    lines=[...lines,{text:`${shell.prompt} ${value}`,kind:'command'}];
    command='';reverse=false;
    const result=shell.run(value);shell=shell;prompt=shell.prompt;historyAt=shell.state.history.length;
    if(result.output||result.links?.length)lines=[...lines,{text:result.output,kind:result.error?'error':'output',links:result.links}];
    if(result.action){
      const {type,value}=result.action;
      if(type==='clear')lines=[];
      else if(type==='reset')lines=[{text:t('terminal.reset'),kind:'accent'}];
      else if(type==='navigate'){close();navigate(value!);}
      else if(type==='theme'||type==='font'||type==='body-font'){setPreference(type,value!);lines=[...lines,{text:`${type} → ${value}`,kind:'accent'}];}
      else if(type==='program')program=value!;
      else if(type==='nano'){editing=value!;editorText=shell.read(value!);editorMessage='';await tick();editor?.focus();}
    }
    if(lines.length>300)lines=lines.slice(-300);
    persist();await focusInput();
  }
  function inputKey(e:KeyboardEvent){
    if(e.key==='ArrowUp'){e.preventDefault();if(historyAt===shell.state.history.length)draft=command;historyAt=Math.max(0,historyAt-1);command=shell.state.history[historyAt]||'';}
    else if(e.key==='ArrowDown'){e.preventDefault();historyAt=Math.min(shell.state.history.length,historyAt+1);command=historyAt===shell.state.history.length?draft:shell.state.history[historyAt];}
    else if(e.key==='Tab'){e.preventDefault();const matches=shell.complete(command);if(matches.length===1){const chunks=command.split(/\s+/);chunks[chunks.length-1]=matches[0];command=chunks.join(' ');}else if(matches.length>1)lines=[...lines,{text:matches.join('  ')}];focusInput();}
    else if((e.ctrlKey||e.metaKey)&&e.key==='l'){e.preventDefault();lines=[];}
    else if((e.ctrlKey||e.metaKey)&&e.key==='r'){e.preventDefault();reverse=!reverse;command='';}
    else if((e.ctrlKey||e.metaKey)&&e.key==='c'){if(!window.getSelection()?.toString()){e.preventDefault();command='';reverse=false;}}
  }
  async function exitProgram(){program='';editing='';await focusInput();}
  function saveEditor(){try{shell.write(editing,editorText);persist();editorMessage=t('terminal.saved');}catch(e){editorMessage=String(e);}}
  function dialogKey(e:KeyboardEvent){
    if(editing&&(e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveEditor();}
    if(editing&&(e.ctrlKey||e.metaKey)&&e.key==='x'){e.preventDefault();exitProgram();}
    if(e.key==='Escape'&&(program||editing)){e.preventDefault();e.stopPropagation();exitProgram();}
  }
  $: reverseMatch=reverse?[...shell.state.history].reverse().find(h=>h.includes(command)):'';
</script>

<dialog bind:this={dialog} class="terminal-dialog" class:drawer={mode==='drawer'} class:fullscreen={mode==='fullscreen'} aria-label={t("terminal.label")} onclose={()=>{program='';editing='';onclose();}} onkeydown={dialogKey} onclick={(e)=>{if(e.target===dialog)close();}}>
  <div class="terminal-window">
    <header class="terminal-titlebar"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="terminal-title">mlii01@web: {shell.state.cwd.replace('/home/mlii01','~')}</span><div class="terminal-layout"><button class:active={mode==='centered'} aria-label={t("terminal.centered")} aria-pressed={mode==='centered'} onclick={()=>layout('centered')}>▣</button><button class:active={mode==='drawer'} aria-label={t("terminal.drawer")} aria-pressed={mode==='drawer'} onclick={()=>layout('drawer')}>▂</button><button class:active={mode==='fullscreen'} aria-label={t("terminal.fullscreen")} aria-pressed={mode==='fullscreen'} onclick={()=>layout('fullscreen')}>□</button></div><button class="close-terminal" aria-label={t("terminal.close")} onclick={close}>×</button></header>
    {#if program==='adventure'}<Adventure {locale} {entries} onexit={exitProgram} onnavigate={url=>{close();navigate(url);}}/>
    {:else if program}<Arcade {locale} {program} onexit={exitProgram}/>
    {:else if editing}<div class="editor"><header>mlii nano · {editing}</header><textarea bind:this={editor} bind:value={editorText} aria-label={t("terminal.editing",{file:editing})} spellcheck="false"></textarea><footer><button onclick={saveEditor}>^S {t("terminal.save")}</button><button onclick={exitProgram}>^X {t("terminal.exit")}</button><span aria-live="polite">{editorMessage}</span></footer></div>
    {:else}<div class="terminal-scroll" bind:this={scroll} aria-label={t("terminal.output")}>
      {#each lines as line}<div class={`terminal-line ${line.kind||''}`}>{line.text}{#if line.links}<div>{#each line.links as link}<a class="terminal-link" href={link.url} onclick={close}>{link.label} →</a><br/>{/each}</div>{/if}</div>{/each}
      <form class="terminal-input-line" onsubmit={(e)=>{e.preventDefault();run(reverse?reverseMatch||command:command);}}><label class="terminal-prompt" for="terminal-input">{reverse?'(reverse-i-search)':prompt}</label><input id="terminal-input" bind:this={input} bind:value={command} aria-label={t("terminal.input")} spellcheck="false" autocapitalize="off" autocomplete="off" onkeydown={inputKey}/></form>
      {#if reverse}<p class="terminal-line">{reverseMatch||t('terminal.noMatch')}</p>{/if}
    </div>{/if}
    <footer class="terminal-footer"><span>{t("terminal.hint",{action:t(program||editing?"terminal.back":"terminal.dismiss")})}</span><span>mlii01-sh</span></footer>
  </div>
</dialog>
