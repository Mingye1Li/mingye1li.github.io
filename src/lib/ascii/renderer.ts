import { asciiEngines, createAsciiEngine } from '../ascii-engines';
import { readStored, writeStored } from '../storage';
import { createLetters } from './letters';
import { noise3 } from './noise';
import type { AsciiEngine, AsciiGrid, LetterField } from './types';

export function mountAscii(stage:HTMLElement,canvas:HTMLCanvasElement,word:string,onEngine:(label:string)=>void) {
  const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const requested=asciiEngines.find(engine=>engine.id===new URLSearchParams(location.search).get('asciiEngine'));
  const previous=Number.parseInt(readStored('ascii-index')??'-1',10);
  const index=(Number.isSafeInteger(previous)?previous:-1)+1;
  const selected=requested??asciiEngines[(index%asciiEngines.length+asciiEngines.length)%asciiEngines.length];
  if(!requested)try{writeStored('ascii-index',String(asciiEngines.indexOf(selected)));}catch{}
  onEngine(selected.label);
  let disposed=false,visible=true,running=false,frame=0,start=0;
  let width=0,height=0,dpr=1,cellW=8.4,cellH=14*1.15,font='monospace';
  let atlasW=1,atlasH=1,centerX=0,centerY=0,radiusX=1,radiusY=1;
  let pointerX=-1,pointerY=-1,pointerActive=false;
  let grid:AsciiGrid,letters:LetterField,engine:AsciiEngine;
  const layer=document.createElement('canvas'),atlas=document.createElement('canvas');
  const layerCtx=layer.getContext('2d')!,atlasCtx=atlas.getContext('2d')!;
  let colors=['#22d3ee','#a78bfa','#f472b6'],opposites=['#f59e0b','#34d399','#fb7185'];
  let background:CanvasGradient,foreground:CanvasGradient;
  const gradient=(palette:string[])=>{
    const result=layerCtx.createLinearGradient(0,0,layer.width,layer.height);
    result.addColorStop(0,palette[0]);result.addColorStop(.5,palette[1]);result.addColorStop(1,palette[2]);return result;
  };
  const complementary=(color:string)=>{
    const match=color.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/i);
    return match?`oklch(${match[1]} ${match[2]} ${(parseFloat(match[3])+180)%360})`:color;
  };
  const palette=()=>{
    const style=getComputedStyle(document.documentElement);
    colors=['primary','secondary','accent'].map((key,i)=>style.getPropertyValue(`--color-${key}`).trim()||colors[i]);
    opposites=colors.map(complementary);font=style.getPropertyValue('--ui-font-mono').trim()||'monospace';
    background=gradient(colors);foreground=gradient(opposites);
  };
  const makeAtlas=()=>{
    atlasW=Math.max(1,Math.round(cellW*dpr));atlasH=Math.max(1,Math.round(cellH*dpr));
    atlas.width=16*atlasW;atlas.height=6*atlasH;
    atlasCtx.clearRect(0,0,atlas.width,atlas.height);atlasCtx.fillStyle='#fff';atlasCtx.textBaseline='top';atlasCtx.font=`${14*dpr}px ${font}`;
    for(let i=0;i<95;i++)atlasCtx.fillText(String.fromCharCode(32+i),(i%16)*atlasW,(i/16|0)*atlasH);
  };
  const resize=()=>{
    const bounds=stage.getBoundingClientRect();width=bounds.width;height=bounds.height;if(!width||!height)return;
    dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);layer.width=canvas.width;layer.height=canvas.height;
    ctx.font=`14px ${font}`;ctx.textBaseline='top';cellW=Math.max(1,ctx.measureText('M').width);cellH=14*1.15;makeAtlas();
    const cols=Math.max(1,Math.floor(width/cellW)),rows=Math.max(1,Math.floor(height/cellH));
    grid={cols,rows,cellW,cellH,glyph:new Uint16Array(cols*rows),alpha:new Float32Array(cols*rows)};
    letters=createLetters(word,grid,font);centerX=(cols-1)/2;centerY=(rows-1)/2;
    let extentX=0,extentY=0;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(letters.mask[y*cols+x]>.5){extentX=Math.max(extentX,Math.abs((x-centerX)*cellW));extentY=Math.max(extentY,Math.abs((y-centerY)*cellH));}
    const minimum=(1-.12)*(1-.05);
    radiusX=Math.max(width*.44,extentX*1.18/minimum+.14*width*.5);
    radiusY=Math.max(height*.42,extentY*1.4/minimum+.14*height*.5);
    background=gradient(colors);foreground=gradient(opposites);
    engine=createAsciiEngine(selected.id,{grid,letters,ramp:' .:-=+*#%@'});
    if(!running||reduced.matches)render(0);
  };
  const disturb=()=>{
    for(let i=0;i<letters.disturb.length;i++)letters.disturb[i]*=.9;
    if(!pointerActive||pointerX<0)return;
    for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
      const x=pointerX+dx,y=pointerY+dy;if(x<0||x>=grid.cols||y<0||y>=grid.rows)continue;
      const distance=Math.hypot(dx,dy);if(distance>5)continue;
      const index=y*grid.cols+x;letters.disturb[index]=Math.max(letters.disturb[index],1-distance/5);
    }
  };
  const legibility=()=>{
    for(let i=0;i<grid.glyph.length;i++){
      const letter=Math.min(1,letters.mask[i]*(1-Math.min(1,letters.disturb[i]))),blend=letter*letter*(3-2*letter);
      grid.alpha[i]*=.4+.6*blend;
      if(letter>.2){grid.alpha[i]=Math.max(grid.alpha[i],.85*letter);if(grid.glyph[i]===0)grid.glyph[i]=35;}
    }
  };
  const boundary=(time:number)=>{
    const breathing=1+.05*Math.sin(time*.7),rx=radiusX*breathing,ry=radiusY*breathing;
    for(let y=0;y<grid.rows;y++)for(let x=0;x<grid.cols;x++){
      const index=y*grid.cols+x;if(!grid.glyph[index]||grid.alpha[index]<=0)continue;
      const px=(x-centerX)*cellW,py=(y-centerY)*cellH,distance=Math.sqrt(px*px+py*py)||1;
      const nx=px/rx,ny=py/ry,radial=Math.sqrt(nx*nx+ny*ny),edge=1+.12*noise3(px/distance*1.7,py/distance*1.7,time*.16);
      let fade=1;if(radial>=edge+.14)fade=0;else if(radial>edge-.14){const weight=(edge+.14-radial)/.28;fade=weight*weight*(3-2*weight);}
      grid.alpha[index]*=Math.max(fade,letters.mask[index]*(1-Math.min(1,letters.disturb[index])));
    }
  };
  const drawLayer=(isLetter:boolean,color:CanvasGradient)=>{
    const offsetX=(width-grid.cols*cellW)/2,offsetY=(height-grid.rows*cellH)/2;
    layerCtx.setTransform(1,0,0,1,0,0);layerCtx.globalCompositeOperation='source-over';layerCtx.clearRect(0,0,layer.width,layer.height);
    for(let y=0;y<grid.rows;y++)for(let x=0;x<grid.cols;x++){
      const index=y*grid.cols+x,code=grid.glyph[index],opacity=grid.alpha[index];
      if(!code||opacity<=.03||(letters.mask[index]*(1-Math.min(1,letters.disturb[index]))>.35)!==isLetter)continue;
      const char=code-32;if(char<0||char>=95)continue;
      layerCtx.globalAlpha=Math.min(1,opacity);
      layerCtx.drawImage(atlas,(char%16)*atlasW,(char/16|0)*atlasH,atlasW,atlasH,Math.round((offsetX+x*cellW)*dpr),Math.round((offsetY+y*cellH)*dpr),atlasW,atlasH);
    }
    layerCtx.globalAlpha=1;layerCtx.globalCompositeOperation='source-in';layerCtx.fillStyle=color;layerCtx.fillRect(0,0,layer.width,layer.height);layerCtx.globalCompositeOperation='source-over';
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(layer,0,0);ctx.restore();
  };
  const render=(time:number)=>{
    if(!grid||!engine)return;
    disturb();engine.step(time);legibility();boundary(time);
    ctx.clearRect(0,0,width,height);drawLayer(false,background);drawLayer(true,foreground);
  };
  const animate=()=>{if(!running||disposed)return;frame=requestAnimationFrame(animate);render((performance.now()-start)/1000);};
  const pause=()=>{running=false;cancelAnimationFrame(frame);};
  const play=()=>{
    if(disposed||!visible||document.hidden||!engine)return;
    if(reduced.matches){render(0);return;}if(running)return;
    running=true;start=performance.now();frame=requestAnimationFrame(animate);
  };
  const leave=()=>{pointerActive=false;engine?.pointer(-1,-1,false);};
  const move=(event:PointerEvent)=>{
    if(!engine||event.pointerType==='touch'||reduced.matches)return;
    const bounds=stage.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom){leave();return;}
    pointerX=Math.floor((event.clientX-bounds.left-(width-grid.cols*cellW)/2)/cellW);
    pointerY=Math.floor((event.clientY-bounds.top-(height-grid.rows*cellH)/2)/cellH);
    pointerActive=true;engine.pointer(pointerX,pointerY,true);
  };
  const preferences=()=>{const oldFont=font;palette();if(font!==oldFont)resize();else if(!running)render(0);};
  const visibility=()=>{if(document.hidden){pause();leave();}else play();};
  const motion=()=>{pause();leave();letters?.disturb.fill(0);play();};
  palette();resize();
  const sizeObserver=new ResizeObserver(()=>{resize();play();});sizeObserver.observe(stage);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)play();else pause();},{threshold:0});intersection.observe(stage);
  const themeObserver=new MutationObserver(preferences);themeObserver.observe(document.documentElement,{attributeFilter:['data-theme']});
  document.fonts.ready.then(()=>{if(!disposed)resize();});
  document.fonts.addEventListener('loadingdone',resize);document.addEventListener('site:preferences',preferences);document.addEventListener('visibilitychange',visibility);
  window.addEventListener('pointermove',move,{passive:true});stage.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);reduced.addEventListener('change',motion);
  play();
  return()=>{
    disposed=true;pause();sizeObserver.disconnect();intersection.disconnect();themeObserver.disconnect();
    document.fonts.removeEventListener('loadingdone',resize);document.removeEventListener('site:preferences',preferences);document.removeEventListener('visibilitychange',visibility);
    window.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);reduced.removeEventListener('change',motion);
  };
}
