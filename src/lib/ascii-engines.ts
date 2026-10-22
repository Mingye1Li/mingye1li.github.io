import { noise3 } from './ascii/noise';
import { gradient, rampIndex, type AsciiEngine, type EngineContext } from './ascii/types';
export const asciiEngines=[
  {id:'flow-field',label:'flow field'},{id:'plasma',label:'plasma'},
  {id:'game-of-life',label:'game of life'},{id:'reaction-diffusion',label:'reaction-diffusion'},
  {id:'flocking',label:'flocking'},{id:'wave-interference',label:'wave interference'},
  {id:'contour',label:'contour terrain'},{id:'attractor',label:'strange attractor'},
] as const;
export type AsciiEngineId=(typeof asciiEngines)[number]['id'];
/** Grid simulations matching the reference parameters, independent of Canvas/Svelte. */
export function createAsciiEngine(id:AsciiEngineId,context:EngineContext,random=Math.random):AsciiEngine{
  const {grid,letters,ramp}=context,{cols,rows,glyph,alpha}=grid,count=cols*rows;
  let pointerX=-1,pointerY=-1,pointerActive=false;
  const pointer=(x:number,y:number,active:boolean)=>{pointerX=x;pointerY=y;pointerActive=active;};
  const weight=(i:number)=>letters.mask[i]*(1-letters.disturb[i]);
  const pixel=(value:number)=>ramp.charCodeAt(rampIndex(value,ramp.length));
  const wrap=(x:number,y:number)=>((y%rows+rows)%rows)*cols+(x%cols+cols)%cols;
  if(id==='flow-field'){
    const particles=Math.max(200,Math.floor(count/2.2)),x=new Float32Array(particles),y=new Float32Array(particles),trails=new Float32Array(count),directions=new Uint16Array(count);
    let seed=2654435769;
    const rng=()=>{seed=(seed^seed<<13)>>>0;seed=(seed^seed>>>17)>>>0;seed=(seed^seed<<5)>>>0;return seed/4294967295;};
    for(let i=0;i<particles;i++){x[i]=rng()*cols;y[i]=rng()*rows;}
    return{pointer,step(time){
      for(let i=0;i<count;i++)trails[i]*=.93;
      for(let i=0;i<particles;i++){
        let px=x[i],py=y[i];const angle=noise3(px*.055,py*.055,time*.12)*Math.PI*2;let vx=Math.cos(angle),vy=Math.sin(angle);
        if(pointerActive){const dx=px-pointerX,dy=py-pointerY,d2=dx*dx+dy*dy;if(d2<144){const force=(1-Math.sqrt(d2)/12)*2.2;vx+=dx/(Math.sqrt(d2)+.001)*force;vy+=dy/(Math.sqrt(d2)+.001)*force;}}
        const cx=px|0,cy=py|0,index=cy*cols+cx,distance=letters.dist[index],attraction=(distance>0?Math.max(0,1-distance/16):1)*(1-letters.disturb[index]);
        if(attraction>0){const[gx,gy]=gradient(letters.dist,cols,rows,cx,cy),length=Math.hypot(gx,gy)||1;vx-=gx/length*attraction*1.3;vy-=gy/length*attraction*1.3;}
        px+=vx*.7;py+=vy*.7;if(rng()<.02){px=rng()*cols;py=rng()*rows;}
        if(px<0)px+=cols;else if(px>=cols)px-=cols;if(py<0)py+=rows;else if(py>=rows)py-=rows;
        x[i]=px;y[i]=py;const next=(py|0)*cols+(px|0);trails[next]=Math.min(1,trails[next]+.85+.7*weight(next));
        directions[next]='-\\|/-\\|/'.charCodeAt((Math.round(angle/(Math.PI*2)*8)%8+8)%8);
      }
      for(let i=0;i<count;i++){alpha[i]=trails[i];glyph[i]=trails[i]>.04?directions[i]||46:0;}
    }};
  }
  if(id==='plasma')return{pointer,step(time){
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      let value=noise3(x*.09,y*.09,time*.25);value+=.5*Math.sin(x*.09*2+time*.7);value+=.5*Math.sin(y*.09*2-time*.5);value*=.55;
      if(pointerActive){const dx=x-pointerX,dy=y-pointerY,distance=Math.sqrt(dx*dx+dy*dy);value+=Math.max(0,1-distance/14)*Math.sin(distance*.6-time*4);}
      value=Math.max(-1,Math.min(1,value));const i=y*cols+x,letter=weight(i);glyph[i]=pixel(Math.min(1,value+1.3*letter));alpha[i]=Math.min(1,.2+.8*((value+1)*.5)+.5*letter);
    }
  }};
  if(id==='game-of-life'){
    let alive=new Uint8Array(count),next=new Uint8Array(count),last=-Infinity;const age=new Float32Array(count);
    const seed=()=>{for(let i=0;i<count;i++){alive[i]=+(random()<.28);age[i]=alive[i];}};seed();
    return{pointer,step(time){
      if(time-last>=.11){last=time;let population=0;
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
          let neighbours=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)neighbours+=alive[wrap(x+dx,y+dy)];
          const i=y*cols+x,living=!!(alive[i]&&neighbours===2||neighbours===3);next[i]=+living;
          if(living){population++;age[i]=alive[i]?Math.min(age[i]+1,8):1;}else age[i]=0;
        }
        [alive,next]=[next,alive];for(let i=0;i<count;i++)if(letters.mask[i]>.5&&letters.disturb[i]<.4&&!alive[i]){alive[i]=1;age[i]=1;}
        if(population<count*.02)seed();
      }
      if(pointerActive)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=pointerX+dx,y=pointerY+dy;if(x>=0&&x<cols&&y>=0&&y<rows){const i=y*cols+x;alive[i]=1;if(age[i]===0)age[i]=1;}}
      for(let i=0;i<count;i++){glyph[i]=alive[i]?'@%#*'.charCodeAt(Math.min(3,(age[i]-1)/2|0)):0;alpha[i]=alive[i]?(age[i]<=1?1:.5+.5/age[i]):0;}
    }};
  }
  if(id==='reaction-diffusion'){
    let u=new Float32Array(count),v=new Float32Array(count),nextU=new Float32Array(count),nextV=new Float32Array(count);
    const seed=()=>{u.fill(1);v.fill(0);let filled=0;for(let i=0;i<count;i++)if(letters.mask[i]>.5){v[i]=.6;filled++;}if(filled<8)for(let i=0;i<16;i++)for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)v[wrap(i*71%cols+dx,i*37%rows+dy)]=1;};
    const laplace=(field:Float32Array,index:number,x:number,y:number)=>field[wrap(x-1,y)]*.2+field[wrap(x+1,y)]*.2+field[wrap(x,y-1)]*.2+field[wrap(x,y+1)]*.2+field[wrap(x-1,y-1)]*.05+field[wrap(x+1,y-1)]*.05+field[wrap(x-1,y+1)]*.05+field[wrap(x+1,y+1)]*.05-field[index];seed();
    return{pointer,step(){
      for(let pass=0;pass<8;pass++){
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x,a=u[i],b=v[i],reaction=a*b*b;nextU[i]=Math.max(0,Math.min(1,a+(laplace(u,i,x,y)-reaction+.039*(1-a))));nextV[i]=Math.max(0,Math.min(1,b+(.5*laplace(v,i,x,y)+reaction-.1015*b)));}
        [u,nextU]=[nextU,u];[v,nextV]=[nextV,v];
      }
      if(pointerActive)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=pointerX+dx,y=pointerY+dy;if(x>=0&&x<cols&&y>=0&&y<rows)v[y*cols+x]=.5;}
      let total=0;for(let i=0;i<count;i++){if(weight(i)>.5)v[i]=Math.max(v[i],.45);total+=v[i];const value=Math.min(1,v[i]*3.2);alpha[i]=value<.06?0:.25+.75*value;glyph[i]=value<.06?0:pixel(value*2-1);}if(total<count*.004)seed();
    }};
  }
  if(id==='flocking'){
    const birds=Math.max(40,Math.min(140,Math.floor(count/40))),x=new Float32Array(birds),y=new Float32Array(birds),vx=new Float32Array(birds),vy=new Float32Array(birds),trails=new Float32Array(count),directions=new Uint16Array(count);
    for(let i=0;i<birds;i++){x[i]=i*89%cols;y[i]=i*41%rows;vx[i]=Math.cos(i*2.399963)*.5;vy[i]=Math.sin(i*2.399963)*.5;}
    return{pointer,step(){
      for(let i=0;i<count;i++)trails[i]*=.82;
      for(let i=0;i<birds;i++){
        let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,neighbours=0;
        for(let j=0;j<birds;j++){if(i===j)continue;const dx=x[j]-x[i],dy=y[j]-y[i],d2=dx*dx+dy*dy;if(d2>36||d2===0)continue;neighbours++;ax+=vx[j];ay+=vy[j];cx+=x[j];cy+=y[j];if(d2<6){sx-=dx/d2;sy-=dy/d2;}}
        let fx=sx*1.5,fy=sy*1.5;if(neighbours>0){fx+=ax/neighbours*.3+(cx/neighbours-x[i])*.01;fy+=ay/neighbours*.3+(cy/neighbours-y[i])*.01;}
        if(pointerActive){const dx=x[i]-pointerX,dy=y[i]-pointerY,d2=dx*dx+dy*dy;if(d2<100&&d2>0){fx+=dx*(3/d2);fy+=dy*(3/d2);}}
        const gx=x[i]|0,gy=y[i]|0,index=gy*cols+gx,distance=letters.dist[index],attraction=(distance>0?Math.max(0,1-distance/16):1)*(1-letters.disturb[index]);
        if(attraction>0){const[dx,dy]=gradient(letters.dist,cols,rows,gx,gy),length=Math.hypot(dx,dy)||1;fx-=dx/length*attraction*.42;fy-=dy/length*attraction*.42;}
        vx[i]+=fx;vy[i]+=fy;const speed=Math.hypot(vx[i],vy[i])||1;if(speed>.75){vx[i]=vx[i]/speed*.75;vy[i]=vy[i]/speed*.75;}
        x[i]=(x[i]+vx[i]+cols)%cols;y[i]=(y[i]+vy[i]+rows)%rows;const next=(y[i]|0)*cols+(x[i]|0);trails[next]=1;
        const direction=(Math.round(Math.atan2(vy[i],vx[i])/(Math.PI*2)*8)%8+8)%8;directions[next]='v/>\\^\\<'.charCodeAt(direction%7);
      }
      for(let i=0;i<count;i++){alpha[i]=trails[i];glyph[i]=trails[i]>.05?directions[i]||46:0;}
    }};
  }
  if(id==='wave-interference'){
    const x=new Float32Array(4),y=new Float32Array(4),frequency=new Float32Array(4);for(let i=0;i<4;i++)frequency[i]=.28+i*.05;
    return{pointer,step(time){const aspect=grid.cellW/grid.cellH;
      for(let i=0;i<4;i++){x[i]=cols*(.5+.35*Math.sin(time*.11+i*1.7));y[i]=rows*(.5+.35*Math.cos(time*.09+i*2.3));}
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        let value=0;for(let i=0;i<4;i++){const dx=(col-x[i])*aspect,dy=row-y[i];value+=Math.sin(Math.sqrt(dx*dx+dy*dy)*frequency[i]-time*2);}
        if(pointerActive){const dx=(col-pointerX)*aspect,dy=row-pointerY;value+=1.6*Math.sin(Math.sqrt(dx*dx+dy*dy)*.4-time*3.5);}
        value/=4;const i=row*cols+col,letter=weight(i),height=Math.max(-1,Math.min(1,value+letter*1.4*Math.sin(time*2.5)));glyph[i]=pixel(height);alpha[i]=Math.min(1,.2+.8*((height+1)*.5)+.35*letter);
      }
    }};
  }
  if(id==='contour'){
    const levels=new Int16Array(count);return{pointer,step(time){
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        let height=noise3(x*.032,y*.032,time*.05);height+=.28*noise3(x*.032*2.1,y*.032*2.1,time*.07);height/=1.28;
        const i=y*cols+x;height+=1.6*weight(i);if(pointerActive){const dx=x-pointerX,dy=y-pointerY;height+=Math.max(0,1-Math.sqrt(dx*dx+dy*dy)/16);}levels[i]=Math.max(0,Math.min(6,Math.floor((height+1)*.5*7)));
      }
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const i=y*cols+x,level=levels[i],left=x>0?levels[i-1]:level,above=y>0?levels[i-cols]:level;
        if(level!==left||level!==above){glyph[i]='=~-'.charCodeAt(level%3);alpha[i]=.7+.3*(level/6);}else{glyph[i]=ramp.charCodeAt(Math.floor(level/6*(ramp.length-1)*.5));alpha[i]=.14+.24*(level/6);}
      }
    }};
  }
  const points=2600,x=new Float32Array(points),y=new Float32Array(points),z=new Float32Array(points);
  let px=.1,py=0,pz=0,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(let i=0;i<points;i++){
    const dx=10*(py-px),dy=px*(28-pz)-py,dz=px*py-(8/3)*pz;px+=dx*.006;py+=dy*.006;pz+=dz*.006;x[i]=px;y[i]=py;z[i]=pz;
    minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);minZ=Math.min(minZ,pz);maxZ=Math.max(maxZ,pz);
  }
  const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2,centerZ=(minZ+maxZ)/2,span=Math.max(maxX-minX,maxY-minY,maxZ-minZ);
  return{pointer,step(time){
    glyph.fill(0);alpha.fill(0);
    const speed=pointerActive?.15+(cols>1?pointerX/(cols-1):.5)*.9:.35,tilt=pointerActive?-.6+(rows>1?pointerY/(rows-1):.5)*1.2:.5;
    const angle=time*speed,cos=Math.cos(angle),sin=Math.sin(angle),tiltCos=Math.cos(tilt),tiltSin=Math.sin(tilt),aspect=grid.cellW/grid.cellH,scale=Math.min(cols*aspect,rows)/span*.42;
    for(let i=0;i<points;i++){
      const dx=x[i]-centerX,dy=y[i]-centerY,dz=z[i]-centerZ,rotatedX=dx*cos+dz*sin;let depth=-dx*sin+dz*cos;const rotatedY=dy*tiltCos-depth*tiltSin;depth=dy*tiltSin+depth*tiltCos;
      const col=Math.floor(cols/2+rotatedX*scale/aspect),row=Math.floor(rows/2-rotatedY*scale);if(col<0||col>=cols||row<0||row>=rows)continue;
      const shade=depth/span*.5+.5,index=row*cols+col,letter=weight(index),opacity=.1+.28*shade+letter*(.65+.35*shade);
      if(opacity>alpha[index]){alpha[index]=opacity;glyph[index]='.:*oO#@'.charCodeAt(Math.min(6,Math.floor((shade*.5+letter*.5)*7)));}
    }
  }};
}
