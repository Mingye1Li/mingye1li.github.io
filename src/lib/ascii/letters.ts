import type { AsciiGrid, LetterField } from './types';
export function distanceTransform(binary:Uint8Array,cols:number,rows:number,target:number){
  const distance=Float32Array.from(binary,value=>value===target?0:1e9),diagonal=Math.SQRT2;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const i=y*cols+x;let value=distance[i];
    if(y>0){value=Math.min(value,distance[i-cols]+1);if(x>0)value=Math.min(value,distance[i-cols-1]+diagonal);if(x<cols-1)value=Math.min(value,distance[i-cols+1]+diagonal);}
    if(x>0)value=Math.min(value,distance[i-1]+1);distance[i]=value;
  }
  for(let y=rows-1;y>=0;y--)for(let x=cols-1;x>=0;x--){
    const i=y*cols+x;let value=distance[i];
    if(y<rows-1){value=Math.min(value,distance[i+cols]+1);if(x<cols-1)value=Math.min(value,distance[i+cols+1]+diagonal);if(x>0)value=Math.min(value,distance[i+cols-1]+diagonal);}
    if(x<cols-1)value=Math.min(value,distance[i+1]+1);distance[i]=value;
  }
  return distance;
}
export function createLetters(word:string,grid:AsciiGrid,font:string):LetterField{
  const {cols,rows,cellW,cellH}=grid,mask=new Float32Array(cols*rows),dist=new Float32Array(cols*rows),disturb=new Float32Array(cols*rows);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(cols*cellW));canvas.height=Math.max(1,Math.round(rows*cellH));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return{mask,dist,disturb};
  ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
  let size=canvas.height*.62;ctx.font=`800 ${size}px ${font}`;size*=Math.min(1,canvas.width*.66/(ctx.measureText(word).width||1));
  ctx.font=`800 ${size}px ${font}`;ctx.fillText(word,canvas.width/2,canvas.height/2);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const top=Math.floor(y*cellH),bottom=Math.min(canvas.height,Math.floor((y+1)*cellH)),left=Math.floor(x*cellW),right=Math.min(canvas.width,Math.floor((x+1)*cellW));
    let total=0,count=0;for(let py=top;py<bottom;py++)for(let px=left;px<right;px++){total+=pixels[(py*canvas.width+px)*4];count++;}
    mask[y*cols+x]=count?total/(count*255):0;
  }
  const binary=Uint8Array.from(mask,value=>+(value>.4)),outside=distanceTransform(binary,cols,rows,1),inside=distanceTransform(binary,cols,rows,0);
  for(let i=0;i<dist.length;i++)dist[i]=binary[i]?-inside[i]:outside[i];
  return{mask,dist,disturb};
}
