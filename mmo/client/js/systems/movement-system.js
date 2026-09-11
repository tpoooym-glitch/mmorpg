import {speed,blocked} from '../world/terrain.js';

function tryAxis(state,axis,distance){if(!distance)return;const p=state.player,steps=Math.max(1,Math.ceil(Math.abs(distance)/Math.max(3,(p.hitbox?.radius||8)*.5))),step=distance/steps;for(let i=0;i<steps;i++){const x=axis==='x'?p.x+step:p.x,y=axis==='y'?p.y+step:p.y;if(blocked(state,x,y))break;p[axis]=axis==='x'?x:y}}

export function move(state,keys,dt){
  const p=state.player;
  if(p.dead||p.attackAnimating){p.moving=false;return}
  let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  const moving=!!(x||y);p.moving=moving;if(!moving)return;
  if(x&&y){x*=.70710678;y*=.70710678}
  if(x>0)p.facing=y<0?5:y>0?7:6;else if(x<0)p.facing=y<0?3:y>0?1:2;else if(y<0)p.facing=4;else if(y>0)p.facing=0;
  const distance=speed(state)*dt;tryAxis(state,'x',x*distance);tryAxis(state,'y',y*distance);
}
