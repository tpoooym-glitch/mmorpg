const defs={
  'adventurer-house':{asset:'assets/buildings/adventurer-guild.png'},
  'villager-house':{asset:'assets/buildings/villager-house.png'},
  blacksmith:{asset:'assets/buildings/blacksmith-shop.png'},
  'general-store':{asset:'assets/buildings/general-store.png'}
};
const imageCache=new Map();
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const img=new Image();img.src=src;imageCache.set(src,img);return img}
function drawFallback(ctx,s){const w=s.w,h=s.h;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#7b4f32';ctx.strokeStyle='#2b211b';ctx.lineWidth=6;ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);ctx.fillStyle=s.type==='blacksmith'?'#8b5a3c':'#a8663c';ctx.beginPath();ctx.moveTo(-w*.55,-h*.5);ctx.lineTo(0,-h*.78);ctx.lineTo(w*.55,-h*.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#3a2418';ctx.fillRect(-28,h/2-72,56,72);ctx.restore()}
function drawOne(ctx,state,s){const d=defs[s.type];if(!d)return;const x=s.x-state.cam.x,y=s.y-state.cam.y,img=getImage(d.asset);ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;if(img.complete&&img.naturalWidth)ctx.drawImage(img,-s.w/2,-s.h/2,s.w,s.h);else drawFallback(ctx,s);ctx.restore()}
export function drawStructures(ctx,state){for(const s of state.zone?.structures||[]){if(s.x+s.w/2<state.cam.x-200||s.x-s.w/2>state.cam.x+ctx.canvas.width+200||s.y+s.h/2<state.cam.y-200||s.y-s.h/2>state.cam.y+ctx.canvas.height+200)continue;drawOne(ctx,state,s)}}
