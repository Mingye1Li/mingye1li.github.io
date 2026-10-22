export type LetterState = 'correct' | 'present' | 'absent';
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(5).fill('absent');
  const remaining = answer.split('');
  for (let i=0;i<5;i++) if(guess[i]===answer[i]) { result[i]='correct'; remaining[i]=''; }
  for (let i=0;i<5;i++) if(result[i]!=='correct') { const at=remaining.indexOf(guess[i]); if(at>=0) {result[i]='present';remaining[at]='';} }
  return result;
}
const english=['astro','build','scope','array','stack','pixel','cloud','debug','query','state','frame','route','token','cache','local','async','shell','input','logic','write','share','craft','green','light','world','plant','dream','stone','house','ocean','bread'];
const dutch=['appel','fiets','groen','plant','water','brood','licht','stoel','beeld','vloer','droom','klank','kamer','vogel','steen','storm','poort','kaart','brief','blauw','groot','klein','lopen','spoor','akker'];
export function dailyWord(date:string,language='en') { const words=language==='nl'?dutch:english; let hash=0; for(const c of date) hash=(hash*31+c.charCodeAt(0))>>>0; return words[hash%words.length]; }

export function keyboardStates(guesses:string[],answer:string):Record<string,LetterState> {
  const result:Record<string,LetterState>={}, rank={absent:0,present:1,correct:2};
  for(const guess of guesses) evaluateGuess(guess,answer).forEach((state,i)=>{if(!(guess[i] in result)||rank[state]>rank[result[guess[i]]])result[guess[i]]=state;});
  return result;
}
export function wordleStreak(wins:string[],date:string):number {
  const days=new Set(wins), day=86400000;
  let stamp=Date.parse(`${date}T00:00:00Z`), streak=0;
  if(!Number.isFinite(stamp)) return 0;
  if(!days.has(date)) stamp-=day;
  while(days.has(new Date(stamp).toISOString().slice(0,10))) { streak++;stamp-=day; }
  return streak;
}
