import test from 'node:test';
import assert from 'node:assert/strict';
import { Shell } from '../src/lib/terminal/shell';
import { Adventure } from '../src/lib/terminal/adventure';
import { readStored } from '../src/lib/storage';
import { keyboardStates, wordleStreak } from '../src/lib/terminal/games';
import { asciiEngines, createAsciiEngine } from '../src/lib/ascii-engines';
import {fixtureContext,seededRandom} from './helpers/ascii';
import type { SearchEntry } from '../src/lib/search';

test('font commands accept the original body and terminal forms',()=>{
  const shell=new Shell([]);
  assert.match(shell.run('font').output,/body.*inter, system/);
  assert.deepEqual(shell.run('font system').action,{type:'body-font',value:'system'});
  assert.deepEqual(shell.run('font term hack').action,{type:'font',value:'hack'});
  assert.deepEqual(shell.run('font body inter').action,{type:'body-font',value:'inter'});
  assert.equal(shell.run('font unknown').error,true);
  assert.equal(shell.run('font __proto__').error,true);
});
test('empty-argument tab completion lists the working directory',()=>{
  const shell=new Shell([]);shell.run('touch example.txt');shell.run('mkdir notes');
  assert.ok(shell.complete('cat ').includes('example.txt'));
  assert.ok(shell.complete('cd ').includes('notes/'));
  assert.deepEqual(shell.complete('cat ex'),['example.txt']);
});
test('renaming preserves terminal files and preferences without rewriting user content',()=>{
  const map=new Map<string,string>([
    ['mlii0151-theme','nord'],
    ['mlii0151-shell',JSON.stringify({fs:{'/':null,'/home':null,'/home/mlii0151':null,'/home/mlii0151/note':'mlii0151 is mentioned in my note'},cwd:'/home/mlii0151',user:'mlii0151',env:{HOME:'/home/mlii0151',USER:'mlii0151',SHELL:'mlii0151-sh'},history:['cat note']})],
  ]);
  const store={getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);}};
  assert.equal(readStored('theme',store),'nord');
  assert.equal(map.get('mlii01-theme'),'nord');
  const shell=new Shell([],readStored('shell',store));
  assert.equal(shell.state.cwd,'/home/mlii01');
  assert.equal(shell.run('whoami').output,'mlii01');
  assert.equal(shell.run('cat note').output,'mlii0151 is mentioned in my note');
  map.set('mlii01-theme','light');assert.equal(readStored('theme',store),'light');
  assert.equal(readStored('theme',{getItem:key=>key==='mlii0151-theme'?'nord':null,setItem:()=>{throw Error('full');}}),'nord');
});
test('dungeon exploration collects projects and opens the corresponding real page',()=>{
  const entries:SearchEntry[]=[{title:'A project',description:'A working project.',url:'/mlii/portfolio/example/',type:'project',tags:[]}];
  const game=new Adventure(entries);
  assert.equal(game.run('escape').exit,undefined);
  game.run('go w');game.run('go 1');
  assert.equal(game.run('open').url,entries[0].url);
  game.run('take');game.run('take');assert.equal(game.inventory.size,1);
  assert.equal(game.run('escape').exit,undefined);
  game.run('back');game.run('east');assert.equal(game.run('escape').exit,true);
});
test('Wordle keyboard retains the best letter result and streaks cross month boundaries',()=>{
  assert.equal(keyboardStates(['apple','allee'],'apple').e,'correct');
  assert.equal(wordleStreak(['2024-02-28','2024-02-29','2024-03-01'],'2024-03-02'),3);
  assert.equal(wordleStreak(['2024-03-01'],'2024-03-03'),0);
});
test('every ASCII engine produces finite bounded cells across animation and resize',()=>{
  for(const engine of asciiEngines)for(const [width,height] of [[40,16],[12,8]]) {
    const context=fixtureContext(width,height);
    const simulation=createAsciiEngine(engine.id,context,seededRandom());
    for(const time of [0,.2,1,3]) {
      simulation.pointer(Math.floor(width/2),Math.floor(height/2),time===1);
      simulation.step(time);
      assert.equal(context.grid.alpha.length,width*height);
      // Attractor depth intentionally exceeds 1 before the renderer clamps opacity.
      assert.ok(context.grid.alpha.every(value=>Number.isFinite(value)&&value>=0&&value<=2),engine.id);
      assert.ok(context.grid.glyph.every(value=>Number.isFinite(value)),engine.id);
    }
  }
});
