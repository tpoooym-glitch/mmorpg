import {clamp} from '../core/utils.js';
import {drawGridSprite} from './sprite-atlas.js';

function hash2(x,y,seed=1){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296}
function smooth(t){return t*t*(3-2*t)}
function valueNoise(x,y,cell,seed){const gx=x/cell,gy=y/cell,x0=Math.floor(gx),y0=Math.floor(gy),x1=x0+1,y1=y0+1,sx=smooth(gx-x0),sy=smooth(gy-y0);const n00=hash2(x0,y0,seed),n10=hash2(x1,y0,seed),n01=hash2(x0,y1,seed),n11=hash2(x1,y1,seed);const nx0=n00+(n10-n00)*sx,nx1=n01+(n11-n01)*sx;return nx0+(nx1-nx0)*sy}
function regionAt(z,x,y){for(let i=(z.terrain?.regions||[]).length-1;i>=0;i--){const r=z.terrain.regions[i];if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return r.type}return z.terrain?.base||'grass'}

// ---- real tile crops from terrain-tileset-20-village.png (5x4 sheet) ----
const GRASS_SRC=[{x:27,y:27,w:314,h:316},{x:376,y:27,w:314,h:316},{x:723,y:27,w:315,h:316}];
const DIRT_SRC=[{x:1071,y:27,w:314,h:316},{x:1420,y:27,w:314,h:316}];

function drawGround(ctx,state,assets){
  const img=assets.terrainVillage;
  if(!img?.complete||!img.naturalWidth){ctx.fillStyle='#5a8a45';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);return}
  const size=32,camX=Math.round(state.cam.x),camY=Math.round(state.cam.y);
  const startX=Math.floor(camX/size)*size-size,startY=Math.floor(camY/size)*size-size,endX=camX+ctx.canvas.width+size,endY=camY+ctx.canvas.height+size;
  ctx.save();ctx.imageSmoothingEnabled=true;
  for(let wy=startY;wy<endY;wy+=size)for(let wx=startX;wx<endX;wx+=size){
    const region=regionAt(state.zone,wx+16,wy+16),dirt=region==='dirt';
    const set=dirt?DIRT_SRC:GRASS_SRC;
    const n=valueNoise(wx,wy,dirt?150:220,dirt?51:19);
    const idx=Math.min(set.length-1,Math.floor(n*set.length));
    const s=set[idx],flip=hash2(Math.floor(wx/size),Math.floor(wy/size),909)<.5;
    const sx=wx-camX,sy=wy-camY;
    if(flip){ctx.save();ctx.translate(Math.round(sx+size),Math.round(sy));ctx.scale(-1,1);ctx.drawImage(img,s.x,s.y,s.w,s.h,0,0,size+1,size+1);ctx.restore()}
    else ctx.drawImage(img,s.x,s.y,s.w,s.h,Math.round(sx),Math.round(sy),size+1,size+1)
  }
  ctx.restore()
}

const patternCache=new WeakMap();
function getPattern(ctx,img,src,tileSize){
  if(!img?.complete||!img.naturalWidth)return null;
  let m=patternCache.get(ctx);if(!m){m=new Map();patternCache.set(ctx,m)}
  const key=[img.src,src.x,src.y,src.w,src.h,tileSize].join(':');
  if(m.has(key))return m.get(key);
  const c=document.createElement('canvas');c.width=tileSize;c.height=tileSize;
  const t=c.getContext('2d');t.imageSmoothingEnabled=true;
  t.drawImage(img,src.x,src.y,src.w,src.h,0,0,tileSize,tileSize);
  const p=ctx.createPattern(c,'repeat');m.set(key,p);return p
}
function strokePath(ctx,pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}

function drawBridges(ctx,state,assets){
  const img=assets.bridge;
  for(const b of state.zone.bridges||[]){
    const x=b.x-state.cam.x,y=b.y-state.cam.y;
    if(img?.complete&&img.naturalWidth){
      const src={x:46,y:76,w:565,h:285};
      const vertical=b.h>b.w;
      ctx.save();ctx.translate(Math.round(x+b.w/2),Math.round(y+b.h/2));ctx.imageSmoothingEnabled=true;
      if(vertical)ctx.rotate(Math.PI/2);
      const dw=vertical?b.h:b.w,dh=vertical?b.w:b.h;
      ctx.drawImage(img,src.x,src.y,src.w,src.h,Math.round(-dw/2),Math.round(-dh/2),dw,dh);
      ctx.restore()
    }else{ctx.fillStyle='#8d6045';ctx.fillRect(x,y,b.w,b.h)}
  }
}
function drawRoads(ctx,state,assets){
  const img=assets.roadTiles,pat=img?getPattern(ctx,img,{x:26,y:77,w:298,h:142},64):null;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const r of state.zone.roads||[]){
    const pts=r.points.map(p=>[p[0]-state.cam.x,p[1]-state.cam.y]),w=r.width||82;
    ctx.strokeStyle='rgba(58,38,24,.35)';ctx.lineWidth=w+10;strokePath(ctx,pts);
    ctx.strokeStyle=pat||'#a9794b';ctx.lineWidth=w;strokePath(ctx,pts);
  }
  ctx.restore();
  drawBridges(ctx,state,assets);
}
function drawWater(ctx,state,assets){
  const img=assets.riverShore||assets.riverTiles,pat=img?getPattern(ctx,img,{x:46,y:57,w:272,h:273},56):null;
  const bankImg=assets.terrainVillage,bankPat=bankImg?getPattern(ctx,bankImg,{x:1420,y:27,w:314,h:316},64):null;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const w of state.zone.water||[]){
    if(w.type==='river'&&w.points?.length>1){
      const pts=w.points.map(p=>[p[0]-state.cam.x,p[1]-state.cam.y]),width=w.width||170;
      ctx.strokeStyle=bankPat||'#c9a86a';ctx.lineWidth=width+40;strokePath(ctx,pts);
      ctx.strokeStyle=pat||'#4f9ee8';ctx.lineWidth=width;strokePath(ctx,pts);
    }else if(w.type==='pond'){
      const cx=w.x+w.w/2-state.cam.x,cy=w.y+w.h/2-state.cam.y;
      ctx.fillStyle=bankPat||'#c9a86a';ctx.beginPath();ctx.ellipse(cx,cy,w.w/2+18,w.h/2+18,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=pat||'#4f9ee8';ctx.beginPath();ctx.ellipse(cx,cy,w.w/2,w.h/2,0,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore()
}
function drawNature(ctx,state,assets){for(const o of state.decor||[]){const x=o.x-state.cam.x,y=o.y-state.cam.y;if(x<-o.w-80||y<-o.h-80||x>ctx.canvas.width+o.w+80||y>ctx.canvas.height+o.h+80)continue;if(o.type?.startsWith('grass')&&assets.grassDecor?.complete){const n=Math.max(0,Math.min(11,Number(o.type.slice(5))-1)),sx=(n%6)*48,sy=Math.floor(n/6)*48;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(assets.grassDecor,sx,sy,48,48,x-o.w/2,y-o.h,o.w,o.h);ctx.restore();continue}if(['oakLarge','oakMedium','pineLarge','pineMedium'].includes(o.type)){const img=assets[{oakLarge:'oakLarge',oakMedium:'oakMedium',pineLarge:'pineLarge',pineMedium:'pineMedium'}[o.type]];if(img?.complete)ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,x-o.w/2,y-o.h,o.w,o.h)}}}
function drawPlayer(ctx,state,assets){const p=state.player,x=p.x-state.cam.x,y=p.y-state.cam.y,walk=assets.warriorWalk,atk=assets.warriorAttack,frame=48;ctx.save();ctx.imageSmoothingEnabled=false;let drawn=false;if(p.attackAnimating&&atk?.complete){drawn=drawGridSprite(ctx,atk,Math.max(0,Math.min(63,p.attackFrame+Math.max(0,Math.min(7,p.facing))*8)),8,8,{w:96,h:96})}else if(walk?.complete){drawn=drawGridSprite(ctx,walk,Math.max(0,Math.min(31,Math.floor(p.animFrame)%4+Math.max(0,Math.min(7,p.facing))*4)),4,8,{w:96,h:96})}if(drawn){ctx.translate(Math.round(x),Math.round(y+10));ctx.restore();return}ctx.fillStyle='#2b3b46';ctx.beginPath();ctx.ellipse(x,y+9,15,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3b5f8a';ctx.fillRect(x-11,y-19,22,24);ctx.fillStyle='#d7dee8';ctx.beginPath();ctx.arc(x,y-25,9,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawMobs(ctx,state){for(const m of state.mobs||[]){if(m.hp<=0)continue;const x=m.x-state.cam.x,y=m.y-state.cam.y;ctx.save();ctx.fillStyle=m.kind==='boar'?'#8e694c':'#77d66a';ctx.beginPath();ctx.arc(x,y,m.r||18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#2d432d';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#f3e0bf';ctx.fillRect(x-16,y-(m.r||18)-10,32,4);ctx.fillStyle='#e84b55';ctx.fillRect(x-16,y-(m.r||18)-10,32*Math.max(0,m.hp/m.maxHp),4);ctx.restore()}}
function drawDebugHitboxes(ctx,state){if(!state.debug?.hitboxes)return;ctx.save();ctx.strokeStyle='rgba(255,80,80,.9)';ctx.lineWidth=2;for(const o of state.zone?.structures||[]){if(!o.blocked)continue;ctx.strokeRect(o.x-o.w/2-state.cam.x,o.y-o.h/2-state.cam.y,o.w,o.h)}const p=state.player,h=p.hitbox||{radius:p.r||8,offsetX:0,offsetY:12};ctx.strokeStyle='rgba(255,220,80,.95)';ctx.beginPath();ctx.arc(p.x+h.offsetX-state.cam.x,p.y+h.offsetY-state.cam.y,h.radius,0,Math.PI*2);ctx.stroke();ctx.restore()}

export function drawScene(ctx,state,assets){
  const z=state.zone,p=state.player;if(!z)return;
  state.cam.x=clamp(p.x-ctx.canvas.width/2,0,Math.max(0,z.width-ctx.canvas.width));
  state.cam.y=clamp(p.y-ctx.canvas.height/2,0,Math.max(0,z.height-ctx.canvas.height));
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  drawGround(ctx,state,assets);
  drawWater(ctx,state,assets);
  drawRoads(ctx,state,assets);
  drawNature(ctx,state,assets);
  drawMobs(ctx,state);
  drawPlayer(ctx,state,assets);
  drawDebugHitboxes(ctx,state);
  ctx.fillStyle='#fff';ctx.font='bold 18px system-ui';ctx.fillText(z.name||'Emerald Vales',18,28);
  if(state.error){ctx.font='12px system-ui';ctx.fillText(state.error,18,48)}
}
