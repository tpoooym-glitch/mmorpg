import {dist,inRect,nearLine} from '../core/utils.js';
function pointInEllipse(x,y,w){const cx=w.x+w.w/2,cy=w.y+w.h/2,rx=Math.max(1,w.w/2),ry=Math.max(1,w.h/2);const dx=(x-cx)/rx,dy=(y-cy)/ry;return dx*dx+dy*dy<=1}
function circleRectCollision(cx,cy,r,rect){const nx=Math.max(rect.x,Math.min(cx,rect.x+rect.w)),ny=Math.max(rect.y,Math.min(cy,rect.y+rect.h));return dist(cx,cy,nx,ny)<r}
function decorRect(o){
  if(o.treeFootprint){
    return{x:o.x-o.w/2+o.w*.35,y:o.y-o.h+o.h*.75,w:o.w*.30,h:o.h*.25}
  }
  const w=o.collisionWidth||0,h=o.collisionHeight||0;if(!w||!h)return null;const ox=o.collisionOffsetX||0,oy=o.collisionOffsetY||0;return{x:o.x+ox-w/2,y:o.y+oy-h,w,h}
}
export function terrainAt(state,x,y){const z=state.zone;if(!z)return'grass';if((z.bridges||[]).some(b=>inRect(x,y,b)))return'bridge';if((z.water||[]).some(w=>w.type==='pond'&&pointInEllipse(x,y,w)))return'water';if((z.water||[]).some(w=>w.type==='river'&&nearLine(x,y,w.points,46)))return'water';if((z.roads||[]).some(r=>nearLine(x,y,r.points,34)))return'road';for(let i=(z.terrain?.regions||[]).length-1;i>=0;i--){const r=z.terrain.regions[i];if(inRect(x,y,r))return r.type}return z.terrain?.base||'grass'}
export function blocked(state,x,y){const z=state.zone,p=state.player,h=p.hitbox||{radius:p.r||8,offsetX:0,offsetY:12},cx=x+(h.offsetX||0),cy=y+(h.offsetY||0),r=h.radius||p.r||8;if(!z||cx<r||cy<r||cx>z.width-r||cy>z.height-r)return true;if((z.bridges||[]).some(b=>inRect(cx,cy,b)))return false;if((z.structures||[]).some(s=>circleRectCollision(cx,cy,r,{x:s.x-16,y:s.y-16,w:s.w+32,h:s.h+32})))return true;return state.decor.some(o=>{if(!o.blocked)return false;const rect=decorRect(o);return rect?circleRectCollision(cx,cy,r,rect):false})}
export function speed(state){const t=terrainAt(state,state.player.x,state.player.y);return state.player.speed*(state.zone?.movement?.[t+'Multiplier']??1)}
