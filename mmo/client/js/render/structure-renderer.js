const defs={
  'adventurer-house':{asset:'assets/buildings/adventurer-guild-topdown.png',tone:'#8f5b37'},
  'villager-house':{asset:'assets/buildings/villager-house-topdown.png',tone:'#a66a3d'},
  blacksmith:{asset:'assets/buildings/blacksmith-shop-topdown.png',tone:'#70452f'},
  'general-store':{asset:'assets/buildings/general-store-topdown.png',tone:'#9b6338'}
};
const imageCache=new Map();
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const img=new Image();img.src=src;imageCache.set(src,img);return img}
function drawFallback(ctx,s){
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
    const scale=Math.min(s.w/img.naturalWidth,s.h/img.naturalHeight);
    const dw=Math.round(img.naturalWidth*scale),dh=Math.round(img.naturalHeight*scale);
    ctx.drawImage(img,Math.round(-dw/2),Math.round(-dh/2),dw,dh);
  }else drawFallback(ctx,s);
  ctx.restore();
}
export function drawStructures(ctx,state){for(const s of state.zone?.structures||[]){if(s.x+s.w/2<state.cam.x-200||s.x-s.w/2>state.cam.x+ctx.canvas.width+200||s.y+s.h/2<state.cam.y-200||s.y-s.h/2>state.cam.y+ctx.canvas.height+200)continue;drawOne(ctx,state,s)}}
