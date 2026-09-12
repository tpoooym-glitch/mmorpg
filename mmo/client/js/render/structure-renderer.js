import {drawIndexedSprite,drawGridSprite,getSpriteRegions} from './sprite-atlas.js';
const defs={
  'adventurer-house':{src:'assets/buildings/adventurer-guild-topdown.png'},
  'villager-house':{src:'assets/buildings/villager-house-topdown.png'},
  blacksmith:{src:'assets/buildings/blacksmith-shop-topdown.png'},
  'general-store':{src:'assets/buildings/general-store-topdown.png'},
  well:{asset:null},
  farm:{asset:'farm',grid:[5,4]},
  fence:{asset:'fence',grid:[4,4]},
  'fence-gate':{asset:'fence',grid:[4,4]},
  bridge:{asset:'bridge',grid:[5,4]},
  'forest-entrance':{asset:'forestEntrance',grid:[5,4]},
  decoration:{asset:'villageDecor',grid:[5,5]},
  location:{asset:'villageLocations',grid:[5,4]},
  quest:{asset:'questAssets',grid:[5,4]},
  spawn:{asset:'spawnAssets',grid:[5,4]}
};
const imageCache=new Map();
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const img=new Image();img.src=src;imageCache.set(src,img);return img}
function drawWellFallback(ctx,s){const r=Math.min(s.w,s.h)*.34;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#5b5b58';ctx.beginPath();ctx.ellipse(0,r*.25,r*1.12,r*.62,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8f8f8a';ctx.strokeStyle='#3a3a37';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,r,r*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#2c3a44';ctx.beginPath();ctx.ellipse(0,0,r*.68,r*.4,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawFallback(ctx,s){ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#6b442d';ctx.strokeStyle='#2b211b';ctx.lineWidth=5;ctx.fillRect(-s.w/2,-s.h*.24,s.w,s.h*.56);ctx.strokeRect(-s.w/2,-s.h*.24,s.w,s.h*.56);ctx.fillStyle='#9b6338';ctx.beginPath();ctx.moveTo(-s.w*.5,-s.h*.24);ctx.lineTo(0,-s.h*.56);ctx.lineTo(s.w*.5,-s.h*.24);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
function drawLargest(ctx,img,target){if(!img?.complete||!img.naturalWidth)return false;const regs=getSpriteRegions(img);if(!regs.length)return false;let bestIndex=0,bestArea=0;for(let i=0;i<regs.length;i++){const area=regs[i].w*regs[i].h;if(area>bestArea){bestArea=area;bestIndex=i}}return drawIndexedSprite(ctx,img,bestIndex,target)}
function drawOne(ctx,state,s){const d=defs[s.type];if(!d)return;const x=s.x-state.cam.x,y=s.y-state.cam.y;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;let drawn=false;if(d.src){drawn=drawLargest(ctx,getImage(d.src),{w:s.w,h:s.h})}else if(d.asset){const img=state.assets?.[d.asset];if(img?.complete&&img.naturalWidth){if(d.grid)drawn=drawGridSprite(ctx,img,s.assetIndex||0,d.grid[0],d.grid[1],{w:s.w,h:s.h});else drawn=drawIndexedSprite(ctx,img,s.assetIndex||0,{w:s.w,h:s.h})}}if(!drawn){if(s.type==='well')drawWellFallback(ctx,s);else drawFallback(ctx,s)}ctx.restore()}
export function drawStructures(ctx,state){for(const s of state.zone?.structures||[]){if(s.x+s.w/2<state.cam.x-250||s.x-s.w/2>state.cam.x+ctx.canvas.width+250||s.y+s.h/2<state.cam.y-250||s.y-s.h/2>state.cam.y+ctx.canvas.height+250)continue;drawOne(ctx,state,s)}}
