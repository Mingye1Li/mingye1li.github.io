<script lang="ts">
  import {translator,defaultLocale,localizedPath,type Locale} from '../../i18n';
  export let locale:Locale=defaultLocale;
  $: t=translator(locale);

  import { onMount } from 'svelte';
  import { dailyWord, evaluateGuess, keyboardStates, wordleStreak } from '../../lib/terminal/games';
  import { readStored, writeStored } from '../../lib/storage';
  export let program: string;
  export let onexit: () => void;
  let snake = [[8,8],[7,8],[6,8]], food = [17,8], direction = [1,0], nextDirection=[1,0], dead=false, paused=false, score=0;
  let guesses: string[] = [], current='', message='', answer='', date='', language='en', storeKey='';
  let matrix='';
  let wins:string[]=[];
  let stage:HTMLElement;
  $: won=guesses.includes(answer);
  $: finished=won||guesses.length>=6;
  $: keys=keyboardStates(guesses,answer);
  $: streak=wordleStreak(wins,date);
  function saveWordle() { try { writeStored(storeKey,JSON.stringify(guesses)); if(guesses.includes(answer)&&!wins.includes(date)) {wins=[...wins,date].slice(-366);writeStored(`wordle-wins-${language}`,JSON.stringify(wins));} } catch {} }
  function guessKey(key:string) {
    if(finished) return;
    if(key==='Enter') { if(current.length!==5) {message=t('game.five');return;} guesses=[...guesses,current]; current=''; message=guesses.at(-1)===answer?t('game.solved'):guesses.length===6?t('game.answer',{word:answer.toUpperCase()}):''; saveWordle(); }
    else if(key==='Backspace') current=current.slice(0,-1);
    else if(/^[a-zA-Z]$/.test(key)&&current.length<5) { current+=key.toLowerCase(); message=''; }
  }
  function turn(dx:number,dy:number) { if(dx!==-direction[0]||dy!==-direction[1]) nextDirection=[dx,dy]; }
  function restart() {snake=[[8,8],[7,8],[6,8]];food=[17,8];direction=[1,0];nextDirection=[1,0];dead=false;score=0;paused=false;}
  onMount(() => {
    const now=new Date(); date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    stage.focus();
    language=program.split(':')[1]||'en'; answer=dailyWord(date,language); storeKey=`wordle-${date}-${language}`;
    if(program.startsWith('wordle')) try {
      const stored=JSON.parse(readStored(storeKey)||'[]'); if(Array.isArray(stored)&&stored.length<=6&&stored.every(v=>typeof v==='string'&&/^[a-z]{5}$/.test(v))) guesses=stored;
      const savedWins=JSON.parse(readStored(`wordle-wins-${language}`)||'[]'); if(Array.isArray(savedWins)) wins=savedWins.filter(v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v));
      saveWordle();
    } catch {}
    const keydown=(e:KeyboardEvent)=>{
      if(e.key==='Escape') return;
      if((e.key==='Enter'||e.key===' ') && (e.target as Element).closest('button')) return;
      if(program==='snake') { const keys:Record<string,number[]>={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}; if(keys[e.key]) { e.preventDefault(); turn(keys[e.key][0],keys[e.key][1]); } if(e.key===' ') {e.preventDefault(); if(dead) restart();else paused=!paused;} }
      if(program.startsWith('wordle') && !e.ctrlKey && !e.metaKey && !e.altKey) { if(e.key==='Backspace'||e.key==='Enter'||/^[a-zA-Z]$/.test(e.key)) {e.preventDefault();guessKey(e.key);} }
    };
    document.addEventListener('keydown',keydown);
    let tick=0;
    const timer=setInterval(()=>{
      if(document.hidden) return;
      if(program==='snake'&&!dead&&!paused) {
        direction=nextDirection;
        const head=[snake[0][0]+direction[0],snake[0][1]+direction[1]];
        const eats=head[0]===food[0]&&head[1]===food[1];
        if(head[0]<0||head[0]>=24||head[1]<0||head[1]>=16||(eats?snake:snake.slice(0,-1)).some(([x,y])=>x===head[0]&&y===head[1])) {dead=true;return;}
        snake=[head,...(eats?snake:snake.slice(0,-1))];
        if(eats) {score++; const free=[];for(let y=0;y<16;y++)for(let x=0;x<24;x++)if(!snake.some(([sx,sy])=>sx===x&&sy===y))free.push([x,y]); if(!free.length){dead=true;return;} food=free[Math.floor(Math.random()*free.length)];}
      }
      if(program==='matrix') { tick++; matrix=Array.from({length:26},(_,y)=>Array.from({length:64},(_,x)=>{const n=(x*31+tick*3)%38;return y>n-10&&y<n?'01アイウエオカキクケコ'.charAt(Math.floor(Math.random()*12)):' ';}).join('')).join('\n'); }
    },130);
    const trainTimer=program==='sl'?setTimeout(onexit,6500):undefined;
    return()=>{clearInterval(timer);clearTimeout(trainTimer);document.removeEventListener('keydown',keydown);};
  });
</script>

<section class="arcade" aria-label={program} bind:this={stage} tabindex="-1">
  {#if program === 'snake'}
    <div class="arcade-bar"><strong>SNAKE</strong><span>{t("game.score",{count:score})}</span><button class="outline-button" onclick={restart}>{t("game.restart")}</button><button class="outline-button" onclick={onexit}>{t("game.exit")}</button></div>
    <div class="snake-board" role="img" aria-label={t('game.board',{score:t('game.score',{count:score}),status:t(dead?'game.over':paused?'game.paused':'game.playing')})}>
      {#each Array(384) as _,i}<i class:snake={snake.some(([x,y])=>x===i%24&&y===Math.floor(i/24))} class:food={food[0]===i%24&&food[1]===Math.floor(i/24)}></i>{/each}
    </div>
    <p class="arcade-message">{dead?t('game.over'):paused?t('game.paused'):''}</p><div class="dpad"><button aria-label={t("game.left")} onclick={()=>turn(-1,0)}>←</button><button aria-label={t("game.up")} onclick={()=>turn(0,-1)}>↑</button><button aria-label={t("game.down")} onclick={()=>turn(0,1)}>↓</button><button aria-label={t("game.right")} onclick={()=>turn(1,0)}>→</button><button aria-label={t("game.pause")} onclick={()=>paused=!paused}>Ⅱ</button></div><p class="arcade-hint">{t("game.snakeHint")}</p>
  {:else if program.startsWith('wordle')}
    <div class="arcade-bar"><strong>WORDLE · {language.toUpperCase()}</strong><span>{date} · {t("game.streak",{count:streak})}</span><button class="outline-button" onclick={onexit}>{t("game.exit")}</button></div>
    <div class="wordle-grid" role="img" aria-label={t('game.guesses',{count:guesses.length,status:won?t('game.solved'):''})}>
      {#each Array(6) as _, row}<div class="wordle-row">{#each Array(5) as _,col}<span class={row<guesses.length?evaluateGuess(guesses[row],answer)[col]:''}>{row<guesses.length?guesses[row][col]:row===guesses.length?current[col]||'':''}</span>{/each}</div>{/each}
    </div>
    <p class="arcade-message" aria-live="polite">{message || (won?t('game.tomorrow'):finished?t('game.answer',{word:answer.toUpperCase()}):'')}</p>
    <div class="wordle-keyboard">{#each 'qwertyuiopasdfghjklzxcvbnm'.split('') as key}<button class={keys[key]||''} aria-label={`${key.toUpperCase()}${keys[key]?`, ${t(`game.${keys[key]}`)}`:''}`} disabled={finished} onclick={()=>guessKey(key)}>{key.toUpperCase()}</button>{/each}<button disabled={finished} onclick={()=>guessKey('Backspace')} aria-label={t("game.delete")}>⌫</button><button disabled={finished} onclick={()=>guessKey('Enter')}>{t("game.enter")}</button></div><p class="arcade-hint">{t("game.wordleHint")}</p>
  {:else if program === 'matrix'}
    <div class="arcade-bar"><strong>MATRIX</strong><button class="outline-button" onclick={onexit}>{t("game.exit")}</button></div><pre class="matrix-board" aria-label={t("game.rain")}>{matrix}</pre><p class="arcade-hint">{t("game.matrixHint")}</p>
  {:else if program === 'sl'}
    <div style="overflow:hidden;width:100%"><pre class="train">{'      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|\n   /     |  |   H  |  |     |   |         ||_| |_||\n  |      |  |   H  |__--------------------| [___] |\n  | ________|___H__/__|_____/[][]~\\_______|       |\n  |/ |   |-----------I_____I [][] []  D   |=======|\n__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|\n |/-=|___|=    ||    ||    ||    |_____/~\\___/\n  \\_/      \\_O=====O=====O=====O_/      \\_/'} </pre></div><p>{t("game.trainHint")}</p><button class="outline-button" onclick={onexit}>{t("game.back")}</button>
  {/if}
</section>
