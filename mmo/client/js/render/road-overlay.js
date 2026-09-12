function roadPath(ctx,points){ctx.beginPath();for(let i=0;i<points.length;i++){const p=points[i];if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1])}}
function drawBridge(ctx,b,cam){const x=b.x-cam.x,y=b.y-cam.y;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#6f4b31';ctx.fillRect(x,y,b.w,b.h);const plank=Math.max(14,Math.round(b.w/8));for(let px=x;px<x+b.w;px+=plank){ctx.fillStyle='#a36d47';ctx.fillRect(px+1,y+3,plank-3,b.h-6)}ctx.strokeStyle='#3d291e';ctx.lineWidth=4;ctx.strokeRect(x,y,b.w,b.h);ctx.restore()}
export function drawRoadOverlay(ctx,state){const z=state.zone;if(!z)return;const roads=(z.roads||[]).map(r=>({r,points:r.points.map(p=>[p[0]-state.cam.x,p[1]-state.cam.y]),width:r.width||96}));ctx.save();ctx.imageSmoothingEnabled=false;ctx.lineCap='round';ctx.lineJoin='round';
  for(const {points,width} of roads){ctx.strokeStyle='#6d482f';ctx.lineWidth=width+8;roadPath(ctx,points);ctx.stroke()}
  for(const {points,width} of roads){ctx.strokeStyle='#a87449';ctx.lineWidth=width;roadPath(ctx,points);ctx.stroke()}
  for(const {points,width} of roads){ctx.strokeStyle='rgba(215,166,108,.4)';ctx.lineWidth=Math.max(2,width*.035);roadPath(ctx,points);ctx.stroke()}
  for(const b of z.bridges||[])drawBridge(ctx,b,state.cam);ctx.restore()}
