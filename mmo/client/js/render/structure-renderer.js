import {drawSourceSprite,getAlphaBounds} from './sprite-atlas.js';

const locations='assets/buildings/village-locations-20-asset-set.png';
const fences='assets/buildings/village-fence-asset-set.png';
const defs={
  'adventurer-house':{src:'assets/buildings/adventurer-guild-topdown.png'},
  'villager-house':{src:'assets/buildings/villager-house-topdown.png'},
  blacksmith:{src:'assets/buildings/blacksmith-shop-topdown.png'},
  'general-store':{src:'assets/buildings/general-store-topdown.png'},
  well:{asset:null},
  farm:{composite:true},
  fence:{compositeFence:true},
  'fence-gate':{compositeGate:true},
  bridge:{asset:'bridge',grid:[5,4]},
  'forest-entrance':{asset:'forestEntrance',grid:[5,4]},
  decoration:{asset:'villageDecor',grid:[5,5]},
  spawn:{source:{x:732,y:776,w:296,h:240}},
  quest:{source:{x:1444,y:780,w:280,h:236}},
  inn:{source:{x:420,y:36,w:320,h:308}},
  market:{source:{x:20,y:428,w:692,h:228}},
  stable:{source:{x:728,y:408,w:328,h:268}},
  shrine:{source:{x:364,y:776,w:332,h:224}},
  fountain:{source:{x:732,y:776,w:296,h:240}}
};
const imageCache=new Map();
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const img=new Image();img.src=src;imageCache.set(src,img);return img}
function drawStandalone(ctx,img,s){return drawSourceSprite(ctx,img,getAlphaBounds(img),{w:s.w,h:s.h})}
function drawWellFallback(ctx,s){const r=Math.min(s.w,s.h)*.34;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#5b5b58';ctx.beginPath();ctx.ellipse(0,r*.25,r*1.12,r*.62,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8f8f8a';ctx.strokeStyle='#3a3a37';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,r,r*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#2c3a44';ctx.beginPath();ctx.ellipse(0,0,r*.68,r*.4,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawFallback(ctx,s){ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#6b442d';ctx.strokeStyle='#2b211b';ctx.lineWidth=5;ctx.fillRect(-s.w/2,-s.h*.24,s.w,s.h*.56);ctx.strokeRect(-s.w/2,-s.h*.24,s.w,s.h*.56);ctx.restore()}
function drawFarm(ctx,state,s){const img=state.assets?.villageLocations;if(!img?.complete||!img.naturalWidth)return false;const src={x:1080,y:736,w:292,h:308};const tileW=s.w/2,tileH=s.h/2;for(let row=0;row<2;row++)for(let col=0;col<2;col++){ctx.save();ctx.translate(-s.w/2+tileW/2+col*tileW,-s.h/2+tileH/2+row*tileH);drawSourceSprite(ctx,img,src,{w:tileW+1,h:tileH+1});ctx.restore()}return true}
function drawFencePiece(ctx,state,s){const img=getImage(fences);if(!img.complete||!img.naturalWidth)return false;const src=s.fenceKind==='vertical'?{x:60,y:364,w:392,h:204}:{x:60,y:364,w:392,h:204};return drawSourceSprite(ctx,img,src,{w:s.w,h:s.h},s.fenceKind==='vertical'?Math.PI/2:0)}
function drawGate(ctx,state,s){const img=getImage(fences);if(!img.complete||!img.naturalWidth)return false;const src={x:84,y:608,w:460,h:336};return drawSourceSprite(ctx,img,src,{w:s.w,h:s.h})}
function drawOne(ctx,state,s){const d=defs[s.type]||defs[s.id];if(!d)return;const x=s.x-state.cam.x,y=s.y-state.cam.y;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;let drawn=false;
  if(d.src){const img=getImage(d.src);drawn=drawStandalone(ctx,img,s)}
  else if(d.source){drawn=drawSourceSprite(ctx,state.assets?.villageLocations||getImage(locations),d.source,{w:s.w,h:s.h})}
  else if(d.composite)drawn=drawFarm(ctx,state,s);
  else if(d.compositeFence)drawn=drawFencePiece(ctx,state,s);
  else if(d.compositeGate)drawn=drawGate(ctx,state,s);
  else if(d.asset){const img=state.assets?.[d.asset];if(img?.complete&&img.naturalWidth)drawn=drawGridSpriteSafe(ctx,img,s.assetIndex||0,d.grid,s)}
  if(!drawn){if(s.type==='well')drawWellFallback(ctx,s);else drawFallback(ctx,s)}ctx.restore()}
function drawGridSpriteSafe(ctx,img,index,grid,s){const cols=grid[0],rows=grid[1],cw=img.naturalWidth/cols,ch=img.naturalHeight/rows,c=index%(cols*rows),sx=(c%cols)*cw,sy=Math.floor(c/cols)*ch;return drawSourceSprite(ctx,img,{x:sx,y:sy,w:cw,h:ch},{w:s.w,h:s.h})}
export function drawStructures(ctx,state){const list=[...(state.zone?.structures||[])].sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2));for(const s of list){if(s.x+s.w/2<state.cam.x-300||s.x-s.w/2>state.cam.x+ctx.canvas.width+300||s.y+s.h/2<state.cam.y-300||s.y-s.h/2>state.cam.y+ctx.canvas.height+300)continue;drawOne(ctx,state,s)}}
