import {drawSourceSprite} from './sprite-atlas.js';
const locationSrc='assets/buildings/village-locations-20-asset-set.png';
const fenceSrc='assets/buildings/village-fence-asset-set.png';
const defs={
  'adventurer-house':{src:'assets/buildings/adventurer-guild-topdown.png'},
  'villager-house':{src:'assets/buildings/villager-house-topdown.png'},
  blacksmith:{src:'assets/buildings/blacksmith-shop-topdown.png'},
  'general-store':{src:'assets/buildings/general-store-topdown.png'},
  well:{well:true},
  farm:{compositeFarm:true},
  fence:{fence:true},
  'fence-gate':{gate:true},
  bridge:{asset:'bridge',grid:[5,4]},
  'forest-entrance':{asset:'forestEntrance',grid:[5,4]},
  inn:{source:{x:420,y:36,w:320,h:308}},
  market:{source:{x:20,y:428,w:692,h:228}},
  stable:{source:{x:728,y:408,w:328,h:268}},
  shrine:{source:{x:364,y:776,w:332,h:224}},
  fountain:{fountain:true,source:{x:732,y:776,w:296,h:240}},
  warehouse:{source:{x:20,y:772,w:324,h:240}},
  location:{source:{x:20,y:772,w:324,h:240}},
  quest:{source:{x:1444,y:780,w:280,h:236}},
  spawn:{spawn:true}
};
const cache=new Map();
function image(src){if(cache.has(src))return cache.get(src);const img=new Image();img.decoding='async';img.src=src;cache.set(src,img);return img}
function standalone(ctx,img,s){if(!img?.complete||!img.naturalWidth)return false;return drawSourceSprite(ctx,img,{x:0,y:0,w:img.naturalWidth,h:img.naturalHeight},{w:s.w,h:s.h})}
function grid(ctx,img,index,cols,rows,s){if(!img?.complete||!img.naturalWidth)return false;const cw=img.naturalWidth/cols,ch=img.naturalHeight/rows,c=index%(cols*rows),sx=(c%cols)*cw,sy=Math.floor(c/cols)*ch;return drawSourceSprite(ctx,img,{x:sx,y:sy,w:cw,h:ch},{w:s.w,h:s.h})}
function well(ctx,s){const rx=s.w*.34,ry=s.h*.22;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#5b4638';ctx.strokeStyle='#2f261f';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,ry*.35,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#4ca4c9';ctx.beginPath();ctx.ellipse(0,ry*.15,rx*.72,ry*.58,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#3c6070';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-rx*.85,-ry*.8);ctx.lineTo(-rx*.85,ry*.9);ctx.moveTo(rx*.85,-ry*.8);ctx.lineTo(rx*.85,ry*.9);ctx.stroke();ctx.strokeStyle='#6e5139';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-rx*.95,-ry*.9);ctx.lineTo(rx*.95,-ry*.9);ctx.stroke();ctx.restore();return true}
function fountainFallback(ctx,s){const rx=s.w*.34,ry=s.h*.18;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#6b7280';ctx.strokeStyle='#2d3748';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,ry*.55,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#57b8dd';ctx.beginPath();ctx.ellipse(0,ry*.35,rx*.72,ry*.60,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#8a949d';ctx.fillRect(-10,-s.h*.30,20,s.h*.45);ctx.fillRect(-5,-s.h*.46,10,s.h*.18);ctx.fillStyle='#75d5f4';ctx.beginPath();ctx.arc(0,-s.h*.48,7,0,Math.PI*2);ctx.fill();ctx.restore();return true}
function fountain(ctx,s,d){const img=image(locationSrc);if(img.complete&&img.naturalWidth){if(drawSourceSprite(ctx,img,d.source,{w:s.w,h:s.h}))return true}return fountainFallback(ctx,s)}
function farm(ctx,s){const img=image(locationSrc);if(!img.complete||!img.naturalWidth)return false;const src={x:1080,y:736,w:292,h:308},tw=s.w/2,th=s.h/2;for(let row=0;row<2;row++)for(let col=0;col<2;col++){ctx.save();ctx.translate(-s.w/2+tw/2+col*tw,-s.h/2+th/2+row*th);drawSourceSprite(ctx,img,src,{w:tw+3,h:th+3});ctx.restore()}return true}
function fence(ctx,s){const img=image(fenceSrc);if(!img.complete||!img.naturalWidth)return false;const src={x:60,y:364,w:392,h:204};if(s.fenceKind==='vertical')return drawSourceSprite(ctx,img,src,{w:s.h+10,h:s.w+4},Math.PI/2);return drawSourceSprite(ctx,img,src,{w:s.w+10,h:s.h+4})}
function gate(ctx,s){const img=image(fenceSrc);if(!img.complete||!img.naturalWidth)return false;const src={x:84,y:608,w:460,h:336};const vertical=s.h>s.w;const target=vertical?{w:s.h,h:s.w}:{w:s.w,h:s.h};return drawSourceSprite(ctx,img,src,target,vertical?Math.PI/2:0)}
function spawnMarker(ctx,s){const r=Math.min(s.w,s.h)*.38;ctx.save();ctx.fillStyle='rgba(245,206,77,.18)';ctx.strokeStyle='rgba(245,206,77,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.18,0,Math.PI*2);ctx.fill();ctx.restore();return true}
function fallback(ctx,s){ctx.save();ctx.fillStyle='#79543a';ctx.strokeStyle='#35271d';ctx.lineWidth=3;ctx.fillRect(-s.w/2,-s.h*.2,s.w,s.h*.5);ctx.strokeRect(-s.w/2,-s.h*.2,s.w,s.h*.5);ctx.restore()}
function drawOne(ctx,state,s){const d=defs[s.type];if(!d)return;const x=s.x-state.cam.x,y=s.y-state.cam.y;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;let ok=false;if(d.src)ok=standalone(ctx,image(d.src),s);else if(d.fountain)ok=fountain(ctx,s,d);else if(d.source){const img=image(locationSrc);ok=drawSourceSprite(ctx,img,d.source,{w:s.w,h:s.h})}else if(d.well)ok=well(ctx,s);else if(d.compositeFarm)ok=farm(ctx,s);else if(d.fence)ok=fence(ctx,s);else if(d.gate)ok=gate(ctx,s);else if(d.spawn)ok=spawnMarker(ctx,s);else if(d.asset)ok=grid(ctx,state.assets?.[d.asset],s.assetIndex||0,d.grid[0],d.grid[1],s);if(!ok&&!d.spawn&&!d.asset&&!d.source&&!d.well&&!d.fountain)fallback(ctx,s);ctx.restore()}
export function drawStructures(ctx,state){const list=[...(state.zone?.structures||[])].sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2));for(const s of list){if(s.x+s.w/2<state.cam.x-320||s.x-s.w/2>state.cam.x+ctx.canvas.width+320||s.y+s.h/2<state.cam.y-320||s.y-s.h/2>state.cam.y+ctx.canvas.height+320)continue;drawOne(ctx,state,s)}}