import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve('dist');
async function walk(dir){const results=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())results.push(...await walk(p));else results.push(p);}return results;}
const files=await walk(root), htmlFiles=files.filter(f=>f.endsWith('.html'));
const home=await readFile(path.join(root,'index.html'),'utf8');
const canonical=home.match(/rel="canonical" href="([^"]+)"/)?.[1];
assert.ok(canonical,'Homepage canonical URL is missing');
const base=new URL(canonical).pathname.replace(/\/$/,'');
const errors=[];
async function exists(p){try{return(await stat(p)).isFile();}catch{return false;}}
for(const file of htmlFiles){
  const text=await readFile(file,'utf8');
  assert.ok(!/codem8/i.test(text),`Old branding found in ${file}`);
  const visibleMarkup=text.replace(/<script\b[\s\S]*?<\/script>/g,'');
  assert.ok(!/mlii0151/i.test(visibleMarkup),`Previous site name found in ${file}`);
  const toc = text.match(/<nav\b[^>]*data-article-toc[\s\S]*?<\/nav>/)?.[0];
  const article = text.match(/<article\b[^>]*id="article-content"[\s\S]*?<\/article>/)?.[0]??'';
  const headingIds = [...article.matchAll(/<h[23]\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
  if(headingIds.length) assert.ok(toc,`Article headings need a table of contents in ${file}`);
  if(toc){
    const targets = [...toc.matchAll(/href="#([^"]+)"/g)].map(m=>decodeURIComponent(m[1]));
    assert.deepEqual(targets,headingIds,`Table of contents must link to every H2/H3 heading in ${file}`);
    assert.equal(new Set(targets).size,targets.length,`Duplicate table of contents anchors in ${file}`);
  }
  const route='/'+path.relative(root,file).replaceAll('\\','/').replace(/index\.html$/,'');
  for(const m of text.matchAll(/(?:href|src|component-url|renderer-url|data-source)="([^"#]+)"/g)){
    const value=m[1].replaceAll('&amp;','&');
    if(/^(https?:|data:|mailto:|tel:|javascript:)/.test(value))continue;
    let url;
    try{url=new URL(value,'https://test.invalid'+base+route);}catch{continue;}
    if(base&&!url.pathname.startsWith(base+'/')){errors.push(`${file}: URL escapes base: ${value}`);continue;}
    const pathname=decodeURIComponent(url.pathname.slice(base.length));
    const target=path.join(root,pathname.replace(/^\//,''));
    if(!await exists(target)&&!await exists(path.join(target,'index.html')))errors.push(`${file}: missing ${value}`);
  }
}
// Fonts in stylesheets must work on project Pages, too.
for(const file of files.filter(f=>f.endsWith('.css'))){
  const text=await readFile(file,'utf8');
  for(const m of text.matchAll(/url\(["']?(\/[^)"']+)["']?\)/g)){
    if(base&&!m[1].startsWith(base+'/'))errors.push(`CSS URL escapes base: ${m[1]}`);
    const target=path.join(root,m[1].slice(base.length).replace(/^\//,''));
    if(!await exists(target))errors.push(`Missing CSS asset: ${m[1]}`);
  }
}
const search=JSON.parse(await readFile(path.join(root,'search-index.json'),'utf8'));
const reference=await readFile(path.join(root,'blog/l/authoring-reference/index.html'),'utf8');
const tabs=reference.match(/<site-tabs[\s\S]*?<\/site-tabs>/)?.[0]??'';
const wizard=reference.match(/<code-wizard[\s\S]*?<\/code-wizard>/)?.[0]??'';
assert.equal((tabs.match(/data-label=/g)??[]).length,2,'MDX tabs must retain both nested panels');
assert.equal((wizard.match(/data-step-caption=/g)??[]).length,3,'Code walkthrough must retain all three steps');
assert.ok((await readFile(path.join(root,'raw/blog/t/hello.md'),'utf8')).includes('## Hello, world'),'Raw Markdown endpoint missing');
assert.ok(search.some(e=>e.type==='post')&&search.some(e=>e.type==='project'),'Search index missing content');
assert.ok(await exists(path.join(root,'rss.xml')),'RSS feed missing');
assert.ok(await exists(path.join(root,'sitemap-index.xml')),'Sitemap missing');
assert.ok(await exists(path.join(root,'404.html')),'404 page missing');
const chineseHome=await readFile(path.join(root,'zh/index.html'),'utf8');
assert.match(chineseHome,/<html[^>]*lang="zh-CN"/);
assert.match(chineseHome,/最新文章/);
assert.match(home,/hreflang="zh-CN"/);
assert.match(chineseHome,/hreflang="en"/);
assert.match(chineseHome,/hreflang="x-default"/);
const chineseSearch=JSON.parse(await readFile(path.join(root,'zh/search-index.json'),'utf8'));
assert.ok(chineseSearch.every(entry=>entry.url.startsWith(`${base}/zh/`)),'Localized search links must retain locale and base');
assert.ok(chineseSearch.some(entry=>entry.title==='写作参考'),'Translated content missing from search');
assert.ok(await exists(path.join(root,'zh/rss.xml')),'Chinese RSS missing');
assert.match(await readFile(path.join(root,'zh/raw/blog/t/hello.md'),'utf8'),/你好，世界/);
for(const file of htmlFiles.filter(file=>file.includes(`${path.sep}zh${path.sep}`)&&/[\\/](blog|portfolio)[\\/]/.test(file))){
  const englishPath=file.replace(`${path.sep}zh${path.sep}`,path.sep);
  if(!await exists(englishPath))continue;
  const headings=text=>[...text.matchAll(/<h[2-6]\b[^>]*\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(headings(await readFile(file,'utf8')),headings(await readFile(englishPath,'utf8')),`Language switch must preserve section anchors: ${file}`);
}
assert.equal(errors.length,0,errors.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages, table of contents anchors, all local links and CSS assets, nested MDX widgets, raw Markdown, search, RSS, sitemap, and 404 (base: ${base||'/'}).`);
