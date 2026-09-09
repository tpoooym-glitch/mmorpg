import {clamp} from '../core/utils.js';

// ---- deterministic pseudo-random noise (no external deps, stable per world coord) ----
function hash2(ix,iy,seed){let h=Math.imul(ix,374761393)^Math.imul(iy,668265263)^Math.imul(seed,2147483647);h=Math.imul(h^(h>>>15),2246822519);h=Math.imul(h^(h>>>13),3266489917);h^=h>>>16;return((h>>>0)%100000)/100000}
function smooth(t){return t*t*(3-2*t)}
function valueNoise(x,y,cell,seed){const gx=x/cell,gy=y/cell;const x0=Math.floor(gx),y0=Math.floor(gy),x1=x0+1,y1=y0+1;const sx=smooth(gx-x0),sy=smooth(gy-y0);const n00=hash2(x0,y0,seed),n10=hash2(x1,y0,seed),n01=hash2(x0,y1,seed),n11=hash2(x1,y1,seed);const nx0=n00+(n10-n00)*sx,nx1=n01+(n11-n01)*sx;return nx0+(nx1-nx0)*sy}

function regionAt(z,x,y){const regions=z.terrain?.regions||[];for(let i=regions.length-1;i>=0;i--){const r=regions[i];if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return r.type}return z.terrain?.base||'grass'}

// Grass tile row in ground-tileset.svg: 0=mid green(base),1=bright/sunlit,2=dark moss,3=dark moss(textured)
function tileIndexAt(wx,wy,region){const nL=valueNoise(wx,wy,224,101),nS=valueNoise(wx,wy,72,307);const v=nL*.7+nS*.3;let darkT=.30,brightT=.84;if(region==='forest'){darkT=.55;brightT=.95}else if(region==='swamp'){darkT=.62;brightT=.97}if(v<darkT)return nS<.5?2:3;if(v>=brightT)return 1;return 0}

const patternCache=new WeakMap();
function pattern(ctx,image,sx,sy){if(!image?.complete||!image.naturalWidth)return null;let m=patternCache.get(ctx);if(!m){m=new Map();patternCache.set(ctx,m)}const k=[image,sx,sy].join(':');if(m.has(k))return m.get(k);const c=document.createElement('canvas');c.width=32;c.height=32;const t=c.getContext('2d');t.imageSmoothingEnabled=true;t.drawImage(image,sx,sy,32,32,0,0,32,32);const p=ctx.createPattern(c,'repeat');m.set(k,p);return p}
function line(ctx,points,width,stroke){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}

function drawGround(ctx,state,assets){
  const z=state.zone,img=assets.terrain,size=32;
  ctx.fillStyle='#4f7f3a';
  ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  if(!img?.complete||!img.naturalWidth)return;
  const startX=Math.floor(state.cam.x/size)*size-size,startY=Math.floor(state.cam.y/size)*size-size;
  const endX=state.cam.x+ctx.canvas.width+size,endY=state.cam.y+ctx.canvas.height+size;
  for(let wy=startY;wy<endY;wy+=size){
    for(let wx=startX;wx<endX;wx+=size){
      const region=regionAt(z,wx+16,wy+16);
      const idx=tileIndexAt(wx,wy,region);
      const sx=wx-state.cam.x,sy=wy-state.cam.y;
      const flip=hash2(Math.floor(wx/size),Math.floor(wy/size),909)<.5;
      if(flip){ctx.save();ctx.translate(sx+size,sy);ctx.scale(-1,1);ctx.drawImage(img,idx*32,0,32,32,0,0,size,size);ctx.restore()}
      else ctx.drawImage(img,idx*32,0,32,32,sx,sy,size,size)
    }
  }
}

const tintCache=new WeakMap();
function getRegionTint(z){
  if(tintCache.has(z))return tintCache.get(z);
  const scale=.25,w=Math.max(1,Math.round(z.width*scale)),h=Math.max(1,Math.round(z.height*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const t=c.getContext('2d');
  if('filter'in t)t.filter='blur(9px)';
  for(const r of z.terrain?.regions||[]){
    if(r.type==='forest')t.fillStyle='rgba(18,64,32,.30)';
    else if(r.type==='swamp')t.fillStyle='rgba(96,86,42,.32)';
    else continue;
    t.fillRect(r.x*scale-9,r.y*scale-9,r.w*scale+18,r.h*scale+18)
  }
  const entry={canvas:c,scale};
  tintCache.set(z,entry);
  return entry
}
function drawRegionTint(ctx,state){
  const {canvas:c,scale}=getRegionTint(state.zone);
  ctx.save();ctx.imageSmoothingEnabled=true;
  ctx.drawImage(c,state.cam.x*scale,state.cam.y*scale,ctx.canvas.width*scale,ctx.canvas.height*scale,0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.restore()
}

function drawWater(ctx,state,assets){
  const water=pattern(ctx,assets.water,0,0)||pattern(ctx,assets.water,32,32);
  for(const w of state.zone.water||[]){
    if(w.type==='river'){
      const pts=w.points.map(q=>[q[0]-state.cam.x,q[1]-state.cam.y]);
      line(ctx,pts,124,'rgba(196,178,132,.55)'); // soft sandy bank
      line(ctx,pts,96,'#3d92bb');
      if(water){ctx.save();ctx.globalAlpha=.82;ctx.strokeStyle=water;ctx.lineWidth=88;ctx.lineCap='round';ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore()}
    }else{
      const cx=w.x+w.w/2-state.cam.x,cy=w.y+w.h/2-state.cam.y;
      ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,w.w/2+14,w.h/2+14,0,0,Math.PI*2);ctx.fillStyle='rgba(196,178,132,.55)';ctx.fill();ctx.restore();
      ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,w.w/2,w.h/2,0,0,Math.PI*2);ctx.clip();ctx.fillStyle=water||'#4d9fc1';ctx.fillRect(w.x-state.cam.x,w.y-state.cam.y,w.w,w.h);ctx.restore()
    }
  }
}
function drawRoads(ctx,state,assets){const dirt=pattern(ctx,assets.terrain,0,32)||'#b88755';for(const r of state.zone.roads||[])line(ctx,r.points.map(p=>[p[0]-state.cam.x,p[1]-state.cam.y]),58,dirt);for(const b of state.zone.bridges||[]){ctx.fillStyle='#785947';ctx.fillRect(b.x-state.cam.x,b.y-state.cam.y,b.w,b.h);ctx.strokeStyle='#a17a5d';ctx.strokeRect(b.x-state.cam.x,b.y-state.cam.y,b.w,b.h)}}

const source={oakSmall:[35,45,155,175],oakMedium:[205,35,200,210],oakLarge:[420,20,270,265],pineSmall:[700,30,175,190],pineMedium:[885,35,195,230],pineLarge:[1090,10,285,290],bushSmall:[35,260,155,165],bushMedium:[205,255,200,190],bushFlower:[720,450,155,160],bushDark:[1050,445,145,165],bushLight:[1190,445,185,170]};
function drawDecor(ctx,state,assets){const sheet=assets.nature;const sorted=[...state.decor].sort((a,b)=>a.y-b.y);for(const o of sorted){const x=o.x-state.cam.x,y=o.y-state.cam.y;if(x<-o.w||y<-o.h||x>ctx.canvas.width+o.w||y>ctx.canvas.height+o.h)continue;if(o.type==='rock'){const i=assets.rock;if(i?.complete&&i.naturalWidth)ctx.drawImage(i,x-o.w/2,y-o.h,o.w,o.h);continue}const s=source[o.type];if(!sheet||!s)continue;ctx.drawImage(sheet,s[0],s[1],s[2],s[3],x-o.w/2,y-o.h,o.w,o.h)}}

export function drawScene(ctx,state,assets){
  const z=state.zone,p=state.player;
  state.cam.x=clamp(p.x-ctx.canvas.width/2,0,Math.max(0,z.width-ctx.canvas.width));
  state.cam.y=clamp(p.y-ctx.canvas.height/2,0,Math.max(0,z.height-ctx.canvas.height));
  drawGround(ctx,state,assets);
  drawRegionTint(ctx,state);
  drawWater(ctx,state,assets);
  drawRoads(ctx,state,assets);
  drawDecor(ctx,state,assets);
  for(const m of state.mobs){if(m.hp<=0)continue;const x=m.x-state.cam.x,y=m.y-state.cam.y;ctx.fillStyle='#86b84d';ctx.beginPath();ctx.arc(x,y,m.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ef4444';ctx.fillRect(x-15,y-25,30*m.hp/m.maxHp,4)}
  const px=p.x-state.cam.x,py=p.y-state.cam.y;
  ctx.fillStyle='#f4c2a1';ctx.beginPath();ctx.arc(px,py,p.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='12px system-ui';ctx.fillText(p.name,px-35,py-24);
  ctx.font='bold 18px system-ui';ctx.fillText(z.name,18,28);
  if(state.error){ctx.font='12px system-ui';ctx.fillText(state.error,18,48)}
}
