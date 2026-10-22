import test from 'node:test';
import assert from 'node:assert/strict';
import { withBase, stripBase, categorySlug } from '../src/lib/paths';
import { searchEntries, type SearchEntry } from '../src/lib/search';
import { Shell, normalizePath, tokenize } from '../src/lib/terminal/shell';
import { evaluateGuess, dailyWord } from '../src/lib/terminal/games';

const entries:SearchEntry[]=[
  {title:'Blog',description:'All posts',url:'/mlii/blog/',type:'page',tags:[]},
  {title:'Astro notes',description:'Build a static site',url:'/mlii/blog/t/hello/',type:'post',tags:['astro'],body:'Hello world\nA small site\n'},
  {title:'Queue',description:'Astro worker example',url:'/mlii/portfolio/queue/',type:'project',tags:['redis']},
];
test('project Pages paths keep the repository prefix exactly once',()=>{
  assert.equal(withBase('/blog/t/hello/','/mlii/'),'/mlii/blog/t/hello/');
  assert.equal(withBase('/','/'),'/');
  assert.equal(stripBase('/mlii/blog/','/mlii/'),'/blog/');
  assert.equal(stripBase('/mlii-other/blog/','/mlii/'),'/mlii-other/blog/');
  assert.equal(categorySlug('Meta/Getting Started'),'meta/getting-started');
});
test('search handles multiple terms, missing matches, and relevance',()=>{
  assert.equal(searchEntries(entries,'astro')[0].title,'Astro notes');
  assert.deepEqual(searchEntries(entries,'astro static').map(e=>e.title),['Astro notes']);
  assert.equal(searchEntries(entries,'missing').length,0);
  assert.equal(searchEntries(entries,'').length,3);
});
test('virtual paths cannot traverse above root',()=>{
  assert.equal(normalizePath('../../../etc','/home/mlii01'),'/etc');
  assert.equal(normalizePath('~/notes/../hello'),'/home/mlii01/hello');
});
test('quotes preserve spaces and operators',()=>{
  assert.deepEqual(tokenize('echo "hello world" > note.txt'),['echo','hello world','>','note.txt']);
  assert.throws(()=>tokenize('echo "unterminated'));
  const shell=new Shell(entries);
  assert.equal(shell.run('echo "|"').output,'|\n');
  assert.equal(shell.run('echo ">"').output,'>\n');
});
test('virtual files support redirects, append, pipes, and directory operations',()=>{
  const shell=new Shell(entries);
  assert.equal(shell.run('echo "two words" > note.txt').error,undefined);
  shell.run('echo "one" >> note.txt');
  assert.equal(shell.run('cat note.txt | grep two | wc -w').output,'2');
  assert.equal(shell.run('mkdir -p notes/deep').error,undefined);
  shell.run('cp note.txt notes/deep/copy.txt');
  shell.run('mv notes/deep/copy.txt notes/moved.txt');
  assert.equal(shell.run('cat notes/moved.txt').output,'two words\none\n');
  assert.equal(shell.run('cp notes notes/child').error,true);
  shell.run('rm -r notes');
  assert.equal(shell.run('cat notes/moved.txt').error,true);
  assert.equal(shell.run('rm -r /').error,true);
});
test('commands open the correct nested content route',()=>{
  const shell=new Shell(entries);
  assert.equal(shell.run('cat /blog/t/hello.md').output,entries[1].body);
  assert.equal(shell.run('open /blog/t/hello.md').action?.value,entries[1].url);
  assert.equal(shell.run('goto /blog').action?.value,'/mlii/blog/');
  assert.equal(shell.run('goto /unknown').error,true);
});
test('sessions survive serialisation and corrupted storage is recoverable',()=>{
  const shell=new Shell(entries);shell.run('echo persisted > note');shell.run('alias hi="echo hello"');
  const next=new Shell(entries,shell.serialize());
  assert.equal(next.run('cat note').output,'persisted\n');
  assert.equal(next.run('hi').output,'hello\n');
  assert.equal(new Shell(entries,'not json').run('pwd').output,'/home/mlii01');
  next.run('reset'); assert.equal(next.run('cat note').error,true);
});
test('Wordle scores repeated letters once and rotates deterministically',()=>{
  assert.deepEqual(evaluateGuess('allee','apple'),['correct','present','absent','absent','correct']);
  assert.equal(dailyWord('2026-10-22'),dailyWord('2026-10-22'));
  assert.equal(dailyWord('2026-10-22','nl').length,5);
});
