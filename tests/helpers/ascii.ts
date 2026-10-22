import {distanceTransform} from '../../src/lib/ascii/letters';
import type {EngineContext,AsciiEngine} from '../../src/lib/ascii/types';
export const seededRandom=()=>{let state=123456;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};};
export function fixtureContext(cols=80,rows=24):EngineContext{
  const count=cols*rows;
  const mask=Float32Array.from({length:count},(_,i)=>{const x=i%cols,y=Math.floor(i/cols);return y>=5&&y<19&&((x>=18&&x<24)||(x>=36&&x<42)||(y>=16&&x>=18&&x<42))?1:0;});
  const binary=Uint8Array.from(mask),inside=distanceTransform(binary,cols,rows,0),outside=distanceTransform(binary,cols,rows,1),dist=Float32Array.from(mask,(v,i)=>v?-inside[i]:outside[i]);
  return{grid:{cols,rows,cellW:8.4,cellH:16.1,glyph:new Uint16Array(count),alpha:new Float32Array(count)},letters:{mask,dist,disturb:new Float32Array(count)},ramp:' .:-=+*#%@'};
}
export function pointerFrame(engine:AsciiEngine,context:EngineContext,frame:number){
  if(frame===20){
    engine.pointer(30,12,true);
    for(let i=0;i<context.letters.disturb.length;i++)context.letters.disturb[i]=Math.max(0,1-Math.hypot(i%80-30,Math.floor(i/80)-12)/5);
  }
  if(frame===40)engine.pointer(-1,-1,false);
}
