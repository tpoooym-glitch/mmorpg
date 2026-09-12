const defs={
  'adventurer-house':{asset:'assets/buildings/adventurer-guild-topdown.png',tone:'#8f5b37',box:[456,219,1461,1076]},
  'villager-house':{asset:'assets/buildings/villager-house-topdown.png',tone:'#a66a3d',box:[315,223,1605,1085]},
  blacksmith:{asset:'assets/buildings/blacksmith-shop-topdown.png',tone:'#70452f',box:[269,57,1381,1421]},
  'general-store':{asset:'assets/buildings/general-store-topdown.png',tone:'#9b6338',box:[417,243,1531,1085]},
  well:{asset:'assets/buildings/well-topdown.png',tone:'#8a8a86'}
};
const imageCache=new Map();
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const img=new Image();img.src=src;imageCache.set(src,img);return img}
function drawWellFallback(ctx,s){
  const r=Math.min(s.w,s.h)*.34;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#5b5b58';ctx.beginPath();ctx.ellipse(0,r*.25,r*1.12,r*.62,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8f8f8a';ctx.strokeStyle='#3a3a37';ctx.lineWidth=4;
  ctx.beginPath();ctx.ellipse(0,0,r,r*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#2c3a44';ctx.beginPath();ctx.ellipse(0,0,r*.68,r*.4,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#6b4a30';ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(-r*1.05,-r*.55);ctx.lineTo(-r*1.05,-r*1.9);ctx.moveTo(r*1.05,-r*.55);ctx.lineTo(r*1.05,-r*1.9);ctx.stroke();
  ctx.fillStyle='#7a4a2c';ctx.beginPath();ctx.moveTo(-r*1.35,-r*1.85);ctx.lineTo(0,-r*2.55);ctx.lineTo(r*1.35,-r*1.85);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}
function drawFallback(ctx,s){
  if(s.type==='well'){drawWellFallback(ctx,s);return}
  const w=Math.min(s.w,360),h=Math.min(s.h,300);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#6b442d';ctx.strokeStyle='#2b211b';ctx.lineWidth=5;
  ctx.fillRect(-w/2,-h*.18,w,h*.55);ctx.strokeRect(-w/2,-h*.18,w,h*.55);
  ctx.fillStyle=defs[s.type]?.tone||'#8f5b37';
  ctx.beginPath();ctx.moveTo(-w*.56,-h*.18);ctx.lineTo(0,-h*.56);ctx.lineTo(w*.56,-h*.18);ctx.closePath();ctx.fill();ctx.stroke();
  if(s.type==='blacksmith'){ctx.fillStyle='#777';ctx.fillRect(w*.30,-h*.05,w*.24,h*.32);ctx.strokeRect(w*.30,-h*.05,w*.24,h*.32);ctx.fillStyle='#ff9b22';ctx.fillRect(w*.36,h*.05,w*.12,h*.14)}
  if(s.type==='general-store'){ctx.fillStyle='#d6a24a';ctx.fillRect(-w*.28,h*.02,w*.56,h*.12);ctx.strokeRect(-w*.28,h*.02,w*.56,h*.12)}
  ctx.fillStyle='#3a2418';ctx.fillRect(-24,h*.12,48,h*.25);ctx.strokeRect(-24,h*.12,48,h*.25);
  ctx.restore();
}
function drawOne(ctx,state,s){
  const d=defs[s.type];if(!d)return;
  const x=s.x-state.cam.x,y=s.y-state.cam.y,img=getImage(d.asset);
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;
  if(img.complete&&img.naturalWidth){
    const box=d.box,[bx,by,bx2,by2]=box||[0,0,img.naturalWidth,img.naturalHeight],bw=bx2-bx,bh=by2-by;
    const scale=Math.min(s.w/bw,s.h/bh);
    const dw=Math.round(bw*scale),dh=Math.round(bh*scale);
    ctx.drawImage(img,bx,by,bw,bh,Math.round(-dw/2),Math.round(-dh/2),dw,dh);
  }else drawFallback(ctx,s);
  ctx.restore();
}
export function drawStructures(ctx,state){for(const s of state.zone?.structures||[]){if(s.x+s.w/2<state.cam.x-200||s.x-s.w/2>state.cam.x+ctx.canvas.width+200||s.y+s.h/2<state.cam.y-200||s.y-s.h/2>state.cam.y+ctx.canvas.height+200)continue;drawOne(ctx,state,s)}}
