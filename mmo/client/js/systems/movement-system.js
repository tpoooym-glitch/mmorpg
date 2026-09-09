import {speed,blocked} from '../world/terrain.js';

function axisStep(state,x,y,maxStep){
  const dx=x-state.player.x,dy=y-state.player.y,dist=Math.hypot(dx,dy);if(dist<=maxStep){return blocked(state,x,y)?null:{x,y}}
  const n=Math.ceil(dist/maxStep),sx=dx/n,sy=dy/n;let px=state.player.x,py=state.player.y;
  for(let i=0;i<n;i++){const tx=px+sx,ty=py+sy;if(blocked(state,tx,py))return{x:px,y:py};if(blocked(state,px,ty))return{x:px,y:py};px=tx;py=ty}
  return{x:px,y:py};
}

export function move(state,keys,dt){
  let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  if(!x&&!y)return;
  if(x&&y){x*=.707;y*=.707}
  const s=speed(state),distance=s*dt,maxStep=Math.max(4,state.player.r*.5);
  const nx=state.player.x+x*distance,ny=state.player.y+y*distance;
  const result=axisStep(state,nx,ny,maxStep);
  if(result){state.player.x=result.x;state.player.y=result.y}
}
