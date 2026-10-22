import test from 'node:test';
import assert from 'node:assert/strict';
import {translator,localizedPath,unlocalizePath,localeFromPath,languages} from '../src/i18n';
import {remarkWidgets} from '../src/plugins/markdown.mjs';
import {Shell} from '../src/lib/terminal/shell';
test('language routing adds the Pages base exactly once and preserves the page',()=>{
  for(const base of ['/','/mlii/']){
    const prefix=base==='/'?'':'/mlii';
    assert.equal(localizedPath('/blog/l/authoring-reference/','zh',base),`${prefix}/zh/blog/l/authoring-reference/`);
    assert.equal(localizedPath(`${prefix}/zh/blog/l/authoring-reference/`,'en',base),`${prefix}/blog/l/authoring-reference/`);
    assert.equal(localizedPath(`${prefix}/zh/`,'zh',base),`${prefix}/zh/`);
    assert.equal(localeFromPath(`${prefix}/zh/about/`,base),'zh');
    assert.equal(unlocalizePath(`${prefix}/zh/about/`,base),'/about/');
    assert.equal(localizedPath('/404.html','zh',base),`${prefix}/zh/404/`);
    assert.equal(localizedPath('/zh/404/','en',base),`${prefix}/404.html`);
  }
});
test('translations handle plural forms and do not leak language between renderers',()=>{
  const en=translator('en'),zh=translator('zh');
  assert.equal(en('list.posts',{count:1}),'1 post');
  assert.equal(en('list.posts',{count:2}),'2 posts');
  assert.match(zh('list.posts',{count:2}),/2/);
  assert.notEqual(zh('nav.about'),en('nav.about'));
  assert.equal(en('nav.about'),'About');
  const flatten=(value:object,prefix=''):string[]=>Object.entries(value).flatMap(([key,item])=>typeof item==='string'?[`${prefix}${key}`]:flatten(item,`${prefix}${key}.`));
  for(const key of flatten(languages.en.messages).filter(key=>!key.endsWith('_one')))assert.ok(!zh(key).startsWith(key),`Missing Chinese translation: ${key}`);
  // An untranslated key uses the English resource without changing other locales.
  assert.equal(zh('list.posts_one',{count:1}),'1 post');
});
test('translated headings retain explicit, language-independent IDs',()=>{
  const heading={type:'heading',depth:2,children:[{type:'text',value:'分步代码 {#code-walkthroughs}'}],data:{} as {hProperties?:{id:string}}};
  remarkWidgets()({type:'root',children:[heading]},undefined);
  assert.equal(heading.children[0].value,'分步代码');assert.equal(heading.data.hProperties?.id,'code-walkthroughs');
});
test('terminal navigation uses translated search URLs, including a project base',()=>{
  const shell=new Shell([{type:'page',title:'关于',description:'',tags:[],url:'/mlii/zh/about/'}]);
  assert.deepEqual(shell.run('goto /about').action,{type:'navigate',value:'/mlii/zh/about/'});
});
