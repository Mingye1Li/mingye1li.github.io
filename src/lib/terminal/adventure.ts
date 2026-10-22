import type { SearchEntry } from '../search';
import {localizedPath,defaultLocale,type Locale} from '../../i18n';

type Room = { title: string; description: string; url: string; exits: Record<string,string>; artifact?: string };
export class Adventure {
  room = 'entrance';
  moves = 0;
  inventory = new Set<string>();
  visited = new Set(['entrance']);
  private previous: string[] = [];
  readonly rooms: Record<string,Room>;
  readonly total: number;
  constructor(entries: SearchEntry[],locale:Locale=defaultLocale) {
    const withBase=(path:string)=>localizedPath(path,locale);
    this.rooms = {
      entrance: {title:'The Entrance Hall',description:'A cursor blinks in the dark. Four doors lead into this site. Collect the project blueprints and return here to escape.',url:withBase('/'),exits:{north:'study',east:'archive',south:'library',west:'workshop'}},
      study: {title:'The Study',description:'A notebook describes the person behind this site. Open this room to visit About.',url:withBase('/about/'),exits:{south:'entrance'}},
      archive: {title:'The Archive',description:'Articles line the shelves. Enter a numbered passage to read one.',url:withBase('/blog/'),exits:{west:'entrance'}},
      library: {title:'The Library',description:'A desk holds the resume. Open this room to see its latest version.',url:withBase('/resume/'),exits:{north:'entrance'}},
      workshop: {title:'The Workshop',description:'Project rooms hold blueprints. Explore the numbered passages and take each artifact.',url:withBase('/portfolio/'),exits:{east:'entrance'}},
    };
    let posts=0, projects=0;
    for(const entry of entries) {
      if(entry.type==='page') continue;
      const project=entry.type==='project', index=project?++projects:++posts;
      const parent=project?'workshop':'archive', id=`${project?'project':'post'}-${index}`;
      this.rooms[parent].exits[String(index)] = id;
      this.rooms[id] = {title:entry.title,description:entry.description,url:entry.url,exits:{back:parent},...(project?{artifact:`${entry.title} blueprint`}:{})};
    }
    this.total=projects;
  }
  look() {
    const room=this.rooms[this.room];
    const item=room.artifact&&!this.inventory.has(room.artifact)?`\nYou see: ${room.artifact}. Type take to collect it.`:'';
    return `— ${room.title} —\n${room.description}${item}\nExits: ${Object.entries(room.exits).map(([direction,id])=>`${direction} (${this.rooms[id].title})`).join(', ')}.`;
  }
  run(input: string): {output:string; url?:string; exit?:boolean} {
    const [command,...args]=input.trim().toLowerCase().split(/\s+/);
    const noun=args.join(' '), current=this.rooms[this.room];
    if(['quit','q'].includes(command)) return {output:`Left the dungeon after ${this.moves} moves.`,exit:true};
    if(['help','?'].includes(command)) return {output:'look (l) — describe the room\ngo <exit> / north (n), east (e), south (s), west (w), back — move\ntake [item] — collect a blueprint\ninspect (x) [item] — examine it\ninventory (i) — show collected artifacts\nopen [room] — visit the real page\nmap — show discovered rooms\nescape — return to the entrance with every artifact\nquit (q) — leave the dungeon'};
    if(['look','l'].includes(command)) return {output:this.look()};
    if(['inventory','i'].includes(command)) return {output:`Artifacts: ${this.inventory.size}/${this.total}\n${[...this.inventory].join('\n')||'Your bag is empty.'}`};
    if(command==='map') return {output:[...this.visited].map(id=>`${id===this.room?'>':' '} ${id}: ${this.rooms[id].title}`).join('\n')};
    if(command==='take') {
      const item=current.artifact;
      if(!item || (noun && !['artifact','blueprint',item.toLowerCase()].includes(noun))) return {output:'There is no such item here.'};
      if(this.inventory.has(item)) return {output:'You already have this blueprint.'};
      this.inventory.add(item); return {output:`Collected ${item}. Artifacts: ${this.inventory.size}/${this.total}.`};
    }
    if(['inspect','x'].includes(command)) {
      const item=[current.artifact,...this.inventory].find(item=>item&&(!noun||item.toLowerCase()===noun||['artifact','blueprint'].includes(noun)));
      return {output:item?`${item}: a record of an experiment. Bring it to the entrance, or open the room to explore the real project.`:'Nothing by that name is here.'};
    }
    if(command==='open') {
      const room=noun?Object.entries(this.rooms).find(([id,room])=>this.visited.has(id)&&(id===noun||room.title.toLowerCase()===noun))?.[1]:current;
      return room?{output:`Opening ${room.title}…`,url:room.url}:{output:'Visit that room first, or use open to visit the current page.'};
    }
    if(command==='escape') return this.room!=='entrance'?{output:'Return to the entrance first.'}:this.inventory.size<this.total?{output:`You still need ${this.total-this.inventory.size} blueprint(s). Explore the workshop.`}:{output:`You escaped with all ${this.total} artifacts after ${this.moves} moves.`,exit:true};
    const aliases:Record<string,string>={n:'north',e:'east',s:'south',w:'west'};
    const requested=command==='go'?noun:command;
    const direction=aliases[requested]||requested;
    const target=direction==='back'?(this.previous.pop()||current.exits.back):current.exits[direction];
    if(!target) return {output:'That passage is not available. Type look or help.'};
    if(direction!=='back') this.previous.push(this.room);
    this.room=target; this.visited.add(target); this.moves++; return {output:this.look()};
  }
}
