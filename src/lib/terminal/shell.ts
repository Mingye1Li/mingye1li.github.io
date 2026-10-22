import type { SearchEntry } from '../search';
import { searchEntries } from '../search';
import { themes, terminalFonts, bodyFonts } from '../preferences';

type FileSystem = Record<string, string | null>;
export interface ShellState { fs: FileSystem; cwd: string; history: string[]; aliases: Record<string,string>; env: Record<string,string>; user: string }
export interface ShellResult { output: string; error?: boolean; action?: { type: string; value?: string }; links?: {label:string;url:string}[] }
const HOME = '/home/mlii01';
export const commandNames = ['about','adventure','alias','cat','cd','clear','cowsay','cp','echo','env','export','font','goto','grep','head','help','history','ls','map','matrix','mkdir','mv','nano','neofetch','open','pwd','reset','rm','search','sl','snake','sort','sudo','tail','theme','touch','unalias','wc','whoami','wordle'];
const help = `site
  about                     who runs this site
  goto <route>              navigate to a page
  map                       browse the sitemap
  neofetch                  system info, terminal style
  open <file|route>          open a page in the browser
  search <term>             search posts and projects
  sudo su [name]            switch the virtual user
  whoami                    print the current user

appearance
  font [term|body] <id>      change body or terminal font
  theme [id]                list or switch site themes

files — stored only in this browser
  cat <file>...             print file contents
  cd [path]                 change directory
  cp <source> <destination> copy a file or directory
  ls [-la] [path]           list directory contents
  mkdir [-p] <path>         create a directory
  mv <source> <destination> move or rename
  nano <file>               edit a file (Ctrl+S to save)
  pwd                       print working directory
  rm [-r] <path>...         remove virtual files
  touch <file>              create an empty file

text & pipes
  echo [text...]            print text; supports > and >>
  grep [-in] <pattern>      filter lines (literal text)
  head / tail [-n N]        first / last lines
  sort [-r]                 sort lines
  wc [-lwc]                 count lines, words, bytes
  example: cat /README.md | grep site | wc -l

shell
  alias [name='command']    define or list aliases
  clear                     clear the screen
  env / export NAME=value  inspect or set variables
  help [command]            show help
  history                   command history
  reset                     reset this virtual session
  unalias <name>            remove an alias

fun
  adventure                 explore a tiny text dungeon
  cowsay <text>             a cow says things
  matrix                    follow the white rabbit
  sl                        a passing steam train
  snake                     the terminal arcade classic
  wordle [en|nl]            daily word puzzle`;

/** A small, isolated interpreter. It never invokes an operating-system shell. */
function lex(line: string): { value: string; operator?: boolean }[] {
  const tokens: { value: string; operator?: boolean }[] = [];
  let current = '', quote = '', started = false;
  for (let i=0;i<line.length;i++) {
    const ch = line[i];
    if (ch === '\\' && quote !== "'") { if (i+1<line.length) { current += line[++i]; started=true; } else current+='\\'; continue; }
    if (quote) { if (ch === quote) quote=''; else current+=ch; started=true; continue; }
    if (ch === '"' || ch === "'") { quote=ch; started=true; continue; }
    if (ch === '|' || ch === '>') { if (started) tokens.push({value:current}); current=''; started=false; if (ch === '>' && line[i+1] === '>') { tokens.push({value:'>>',operator:true}); i++; } else tokens.push({value:ch,operator:true}); continue; }
    if (/\s/.test(ch)) { if (started) { tokens.push({value:current}); current=''; started=false; } } else { current+=ch; started=true; }
  }
  if (quote) throw new Error('Unclosed quote');
  if (started) tokens.push({value:current});
  return tokens;
}
export const tokenize = (line: string) => lex(line).map(token => token.value);
export function normalizePath(path: string, cwd = HOME): string {
  const absolute = path === '~' ? HOME : path.startsWith('~/') ? HOME+path.slice(1) : path.startsWith('/') ? path : `${cwd}/${path}`;
  const parts: string[]=[];
  for (const part of absolute.split('/')) { if (part==='..') parts.pop(); else if (part && part!=='.') parts.push(part); }
  return '/'+parts.join('/');
}
export class Shell {
  state: ShellState;
  entries: SearchEntry[];
  readonly initial: FileSystem;
  constructor(entries: SearchEntry[], saved?: string | null) {
    this.entries=entries;
    this.initial={'/':null,'/home':null,[HOME]:null,'/blog':null,'/portfolio':null,
      '/README.md':'# mlii01\n\nWelcome to my site.\n\nUse help to explore the terminal.\nThe filesystem is virtual and lives only in your browser.\nTry: cd /blog, ls, cat, nano, theme, snake, wordle.\n',
      '/about.md':'# mlii01\n\nDeveloper & maker.\nNotes on code, systems, and the occasional experiment.\nGitHub: https://github.com/Mingye1Li\n',
      '/resume.md':'# Resume\n\nComing soon.\n',[`${HOME}/welcome.txt`]:'Welcome, explorer.\nMake yourself at home.\n'};
    for (const entry of entries.filter(e=>e.type!=='page')) {
      const match = entry.url.match(/\/(blog|portfolio)\/(.*?)\/?$/);
      if (!match) continue;
      const path = `/${match[1]}/${match[2].replace(/\/$/,'')}.md`;
      this.parents(path,this.initial); this.initial[path] = entry.body || `# ${entry.title}\n\n${entry.description}`;
    }
    this.state=this.fresh();
    if (saved) {
      try {
        const data=JSON.parse(saved);
        if (data && typeof data==='object' && data.fs && typeof data.fs==='object' && !Array.isArray(data.fs) && JSON.stringify(data.fs).length<500000) {
          const fs:FileSystem={};
          for (const [key,value] of Object.entries(data.fs)) if (key.startsWith('/') && (typeof value==='string'||value===null)) fs[normalizePath(key)] = value as string|null;
          if (fs['/']===null && fs[HOME]===null) {
            this.state.fs=fs;
            this.state.cwd=fs[data.cwd]===null?data.cwd:HOME;
            this.state.history=Array.isArray(data.history)?data.history.filter((x:unknown)=>typeof x==='string').slice(-200):[];
            for (const field of ['aliases','env'] as const) if (data[field] && typeof data[field]==='object') this.state[field]=Object.fromEntries(Object.entries(data[field]).filter(([k,v])=>/^[a-zA-Z_][\w-]*$/.test(k)&&typeof v==='string')) as Record<string,string>;
            if (typeof data.user==='string' && /^[\w-]{1,30}$/.test(data.user)) this.state.user=data.user;
          }
        }
      } catch { /* Invalid or old storage falls back to a fresh virtual filesystem. */ }
    }
  }
  fresh():ShellState { return {fs:{...this.initial},cwd:HOME,history:[],aliases:{ll:'ls -la'},env:{HOME,USER:'mlii01',SHELL:'mlii01-sh',TERM:'xterm-256color'},user:'mlii01'}; }
  parents(path:string,fs=this.state.fs) { const parts=path.split('/'); parts.pop(); for(let i=2;i<=parts.length;i++) { const p=parts.slice(0,i).join('/'); if (!Object.hasOwn(fs,p)) fs[p]=null; else if(fs[p]!==null) throw new Error(`${p}: is not a directory`); } }
  get prompt() { return `${this.state.user}@mlii01 ${this.state.cwd.replace(HOME,'~')} $`; }
  serialize() { return JSON.stringify(this.state); }
  path(path:string) { return normalizePath(path,this.state.cwd); }
  exists(path:string) { return Object.hasOwn(this.state.fs,path); }
  read(path:string) { const p=this.path(path); if(!this.exists(p)) throw new Error(`${path}: no such file`); if(this.state.fs[p]===null) throw new Error(`${path}: is a directory`); return this.state.fs[p] as string; }
  write(path:string,text:string,append=false) { const p=this.path(path); if(this.state.fs[p]===null) throw new Error(`${path}: is a directory`); const parent=p.slice(0,p.lastIndexOf('/'))||'/'; if(this.state.fs[parent]!==null) throw new Error(`${parent}: no such directory`); if(text.length>100000) throw new Error('Virtual file size limit: 100 KB'); const next=(append?(this.state.fs[p]??''):'')+text; if(next.length>100000) throw new Error('Virtual file size limit: 100 KB'); this.state.fs[p]=next; }
  complete(line:string):string[] {
    const chunks=line.split(/\s+/), last=chunks.at(-1)||'';
    if(chunks.length===1) return commandNames.filter(n=>n.startsWith(last));
    const start=this.path(last||'.'); const directory=!last||last.endsWith('/'); const parent=directory?start:start.slice(0,start.lastIndexOf('/'))||'/';
    const partial=directory?'':start.split('/').at(-1)!;
    return Object.keys(this.state.fs).filter(p=>p!=='/'&&(p.slice(0,p.lastIndexOf('/'))||'/')===parent&&p.split('/').at(-1)!.startsWith(partial)).map(p=>(last.includes('/')?last.slice(0,last.lastIndexOf('/')+1):'')+p.split('/').at(-1)+(this.state.fs[p]===null?'/':''));
  }
  run(line:string):ShellResult {
    if (!line.trim()) return {output:''};
    this.state.history=[...this.state.history,line].slice(-200);
    try {
      let tokens=lex(line);
      if (!tokens.length) return {output:''};
      const alias=Object.hasOwn(this.state.aliases,tokens[0].value)?this.state.aliases[tokens[0].value]:undefined; if(alias) tokens=[...lex(alias),...tokens.slice(1)];
      tokens=tokens.map(t=>({...t,value:t.value.replace(/\$([A-Za-z_]\w*)/g,(_,key)=>this.state.env[key]??'')}));
      const redirect=tokens.findIndex(t=>t.operator&&(t.value==='>'||t.value==='>>'));
      let destination='',append=false;
      if(redirect>=0) { if(tokens.length!==redirect+2 || tokens[redirect+1].operator) throw new Error('Usage: command > file'); destination=tokens[redirect+1].value; append=tokens[redirect].value==='>>'; tokens=tokens.slice(0,redirect); }
      const groups:string[][]=[[]];
      for(const token of tokens) { if(token.operator&&token.value==='|') groups.push([]); else groups.at(-1)!.push(token.value); }
      if(groups.some(g=>g.length===0)) throw new Error('Empty command in pipeline');
      let result:ShellResult={output:''};
      for(let i=0;i<groups.length;i++) { if(result.action) throw new Error('Interactive commands cannot be piped'); result=this.execute(groups[i],i?result.output:undefined); if(result.error) return result; }
      if(destination) { if(result.action) throw new Error('Interactive commands cannot be redirected'); this.write(destination,result.output,append); return {output:''}; }
      return result;
    } catch(e) { return {output:e instanceof Error?e.message:String(e),error:true}; }
  }
  execute(tokens:string[],stdin?:string):ShellResult {
    const [cmd,...args]=tokens; const fs=this.state.fs;
    const out=(output:string):ShellResult=>({output});
    const need=(n:number,usage:string)=>{if(args.length<n) throw new Error(`Usage: ${usage}`);};
    const input=(files:string[])=>files.length?files.map(f=>this.read(f)).join('\n'):stdin??'';
    const action=(type:string,value?:string):ShellResult=>({output:'',action:{type,value}});
    switch(cmd) {
      case 'help': return out(args[0]?help.split('\n').filter(l=>l.trim().startsWith(args[0])).join('\n')||`No help for ${args[0]}. Type help.`:help);
      case 'pwd': return out(this.state.cwd);
      case 'whoami': return out(this.state.user);
      case 'about': return out(this.read('/about.md'));
      case 'clear': return action('clear');
      case 'echo': return out(args.join(' ')+'\n');
      case 'cat': return out(input(args));
      case 'cd': { const p=this.path(args[0]||'~'); if(fs[p]!==null) throw new Error(`${args[0]}: no such directory`); this.state.cwd=p; return out(''); }
      case 'ls': { const p=this.path(args.find(a=>!a.startsWith('-'))||'.'); if(!this.exists(p)) throw new Error(`${p}: no such file or directory`); if(fs[p]!==null) return out(p.split('/').at(-1)!); const list=Object.keys(fs).filter(f=>f!==p&&(f.slice(0,f.lastIndexOf('/'))||'/')===p).sort(); const long=args.some(a=>a.startsWith('-')&&a.includes('l')); return out(list.map(f=>`${long?(fs[f]===null?'drwxr-xr-x':'-rw-r--r--')+'  '+this.state.user+'  ':''}${f.split('/').at(-1)}${fs[f]===null?'/':''}`).join(long?'\n':'  ')); }
      case 'mkdir': { need(1,'mkdir [-p] path'); for(const arg of args.filter(a=>a!=='-p')) { const p=this.path(arg); if(this.exists(p)&&fs[p]!==null) throw new Error(`${arg}: file exists`); if(args.includes('-p')) this.parents(p); const parent=p.slice(0,p.lastIndexOf('/'))||'/'; if(fs[parent]!==null) throw new Error(`${parent}: no such directory`); fs[p]=null; } return out(''); }
      case 'touch': { need(1,'touch file'); for(const arg of args) if(!this.exists(this.path(arg))) this.write(arg,''); return out(''); }
      case 'nano': { need(1,'nano file'); const p=this.path(args[0]); if(!this.exists(p)) this.write(p,''); this.read(p); return action('nano',p); }
      case 'rm': { need(1,'rm [-r] path'); for(const arg of args.filter(a=>!a.startsWith('-'))) { const p=this.path(arg); if(['/','/home',HOME].includes(p)) throw new Error('Cannot remove the virtual home or root'); if(!this.exists(p)) throw new Error(`${arg}: no such file`); if(fs[p]===null&&!args.some(a=>a.startsWith('-')&&a.includes('r'))) throw new Error(`${arg}: is a directory (use -r)`); for(const f of Object.keys(fs)) if(f===p||f.startsWith(p+'/')) delete fs[f]; if(!this.exists(this.state.cwd)) this.state.cwd=HOME; } return out(''); }
      case 'cp': case 'mv': { const names=args.filter(a=>!a.startsWith('-')); if(names.length!==2) throw new Error(`Usage: ${cmd} source destination`); const source=this.path(names[0]); let dest=this.path(names[1]); if(!this.exists(source)) throw new Error(`${names[0]}: no such file`); if(['/','/home',HOME].includes(source)) throw new Error('Cannot move or copy virtual root/home'); if(fs[dest]===null) dest+='/'+source.split('/').at(-1); if(source===dest||dest.startsWith(source+'/')) throw new Error('Cannot copy a path into itself'); const parent=dest.slice(0,dest.lastIndexOf('/'))||'/'; if(fs[parent]!==null) throw new Error(`${parent}: no such directory`); if(fs[source]===null&&this.exists(dest)) throw new Error('Destination already exists'); for(const f of Object.keys(fs).filter(f=>f===source||f.startsWith(source+'/'))) { fs[dest+f.slice(source.length)]=fs[f]; if(cmd==='mv') delete fs[f]; } if(cmd==='mv'&&(this.state.cwd===source||this.state.cwd.startsWith(source+'/'))) this.state.cwd=dest+this.state.cwd.slice(source.length); return out(''); }
      case 'grep': { const flags=args.filter(a=>a.startsWith('-')).join(''); const rest=args.filter(a=>!a.startsWith('-')); if(!rest.length) throw new Error('Usage: grep [-in] pattern [file]'); const pattern=flags.includes('i')?rest[0].toLowerCase():rest[0]; return out(input(rest.slice(1)).split('\n').map((l,i)=>({l,i})).filter(x=>(flags.includes('i')?x.l.toLowerCase():x.l).includes(pattern)).map(x=>flags.includes('n')?`${x.i+1}:${x.l}`:x.l).join('\n')); }
      case 'head': case 'tail': { let count=10; const files=[]; for(let i=0;i<args.length;i++) { if(args[i]==='-n') { count=Number(args[++i]); if(!Number.isInteger(count)||count<0) throw new Error('Line count must be a non-negative integer'); } else files.push(args[i]); } const lines=input(files).replace(/\n$/,'').split('\n'); return out((count===0?[]:cmd==='head'?lines.slice(0,count):lines.slice(-count)).join('\n')); }
      case 'sort': { const lines=input(args.filter(a=>a!=='-r')).replace(/\n$/,'').split('\n').sort(); return out((args.includes('-r')?lines.reverse():lines).join('\n')); }
      case 'wc': { const flags=args.filter(a=>a.startsWith('-')).join(''); const text=input(args.filter(a=>!a.startsWith('-'))); const values={l:text?text.replace(/\n$/,'').split('\n').length:0,w:text.trim()?text.trim().split(/\s+/).length:0,c:new TextEncoder().encode(text).length}; return out((flags?Object.keys(values).filter(k=>flags.includes(k)):['l','w','c']).map(k=>values[k as keyof typeof values]).join('  ')); }
      case 'history': return out(this.state.history.map((h,i)=>`${String(i+1).padStart(3)}  ${h}`).join('\n'));
      case 'alias': { if(!args.length) return out(Object.entries(this.state.aliases).map(([k,v])=>`${k}='${v}'`).join('\n')); const match=args.join(' ').match(/^([a-zA-Z_]\w*)=(.+)$/); if(!match) throw new Error("Usage: alias name='command'"); this.state.aliases[match[1]]=match[2]; return out(''); }
      case 'unalias': need(1,'unalias name'); delete this.state.aliases[args[0]]; return out('');
      case 'env': return out(Object.entries({...this.state.env,PWD:this.state.cwd}).map(([k,v])=>`${k}=${v}`).join('\n'));
      case 'export': { const match=args.join(' ').match(/^([a-zA-Z_]\w*)=(.*)$/); if(!match) throw new Error('Usage: export NAME=value'); this.state.env[match[1]]=match[2]; return out(''); }
      case 'sudo': if(args[0]!=='su') throw new Error('Only the virtual command sudo su [name] is supported'); this.state.user=(args[1]||'root').replace(/[^\w-]/g,'').slice(0,30)||'root'; this.state.env.USER=this.state.user; return out(`Switched virtual user to ${this.state.user}.`);
      case 'reset': this.state=this.fresh(); return {...out('Virtual session reset.'),action:{type:'reset'}};
      case 'theme': if(!args[0]) return out(themes.join('  ')); if(!themes.includes(args[0])) throw new Error(`Unknown theme. Available: ${themes.join(', ')}`); return action('theme',args[0]);
      case 'font': {
        if(!args.length) return out(`body     : ${Object.keys(bodyFonts).join(', ')}\nterminal : ${Object.keys(terminalFonts).join(', ')}`);
        const explicit=args[0]==='term'||args[0]==='body';
        const id=explicit?args[1]:args[0];
        const type=args[0]==='body'||(!explicit&&id in bodyFonts)?'body-font':'font';
        const choices=type==='body-font'?bodyFonts:terminalFonts;
        if(!id) return out(Object.keys(choices).join('  '));
        if(!Object.hasOwn(choices,id)) throw new Error(`Choose one: ${Object.keys(choices).join(', ')}`);
        return action(type,id);
      }
      case 'map': return {...out('Site map — choose a path:'),links:this.entries.map(e=>({label:e.title,url:e.url}))};
      case 'search': { need(1,'search query'); const matches=searchEntries(this.entries,args.join(' ')); return {...out(matches.length?`${matches.length} results`:'No results found.'),links:matches.map(e=>({label:e.title,url:e.url}))}; }
      case 'open': case 'goto': { need(1,`${cmd} route`); let route=args[0]; if(route==='~') route='/'; if(route.endsWith('.md')) route=this.path(route).replace(/\.md$/,''); const entry=this.entries.find(e=>e.url.replace(/\/$/,'')===route.replace(/\/$/,'')||e.url.replace(/\/$/,'').endsWith(route.replace(/\/$/,''))||e.title.toLowerCase()===route.toLowerCase()); if(!entry) throw new Error(`Unknown route: ${route}. Try map.`); return action('navigate',entry.url); }
      case 'neofetch': return out(`     { >_ }       mlii01@web\n                  ─────────────\n   M L I I        OS:      Browser\n   0 1            Host:    GitHub Pages\n                  Stack:   Astro + Svelte\n                  Shell:   mlii01-sh\n                  Theme:   type theme to explore\n                  Source:  Markdown / MDX\n\n                  ■ ■ ■ ■ ■ ■ ■ ■`);
      case 'cowsay': { const text=(args.join(' ')||stdin||'Hello, mlii01!').slice(0,100); return out(` ${'_'.repeat(text.length+2)}\n< ${text} >\n ${'-'.repeat(text.length+2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`); }
      case 'snake': case 'matrix': case 'sl': case 'adventure': return action('program',cmd);
      case 'wordle': if(args[0]&&!['en','nl'].includes(args[0])) throw new Error('Usage: wordle [en|nl]'); return action('program',`wordle:${args[0]||'en'}`);
      default: throw new Error(`${cmd}: command not found. Type help.`);
    }
  }
}
