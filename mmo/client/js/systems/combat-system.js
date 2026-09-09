import {dist} from '../core/utils.js';

const HIT_COOLDOWN=.35;
const PLAYER_IFRAME=.45;

function rewardPlayer(state,mob){const gold=Math.floor(mob.gold[0]+Math.random()*(mob.gold[1]-mob.gold[0]+1));state.player.xp+=mob.exp;state.player.gold+=gold;while(state.player.xp>=100){state.player.xp-=100;state.player.level++;state.player.maxHp+=10;state.player.maxMp+=5;state.player.hp=state.player.maxHp;state.player.mp=state.player.maxMp}}

export function attack(state){if(state.player.attackCooldown>0)return false;state.player.attackCooldown=HIT_COOLDOWN;let target=null,best=Infinity;for(const m of state.mobs){if(!m.alive||m.hp<=0)continue;const d=dist(m.x,m.y,state.player.x,state.player.y);if(d<=state.player.attackRange+m.r&&d<best){best=d;target=m}}if(!target)return false;const damage=Math.max(1,state.player.attackDamage-target.defense);target.hp-=damage;if(target.hp<=0){target.hp=0;target.alive=false;target.respawnAt=performance.now()+target.respawnMs;rewardPlayer(state,target)}return true}

export function updateCombat(state,dt){state.player.attackCooldown=Math.max(0,state.player.attackCooldown-dt);if(state.player.iframes>0)state.player.iframes=Math.max(0,state.player.iframes-dt);const now=performance.now();for(const m of state.mobs){if(!m.alive){if(now>=m.respawnAt){m.alive=true;m.hp=m.maxHp;m.x=m.spawnX;m.y=m.spawnY;m.attackCooldown=0}continue}const d=dist(m.x,m.y,state.player.x,state.player.y);if(d<=m.aggroRange&&d>m.attackRange){const dx=state.player.x-m.x,dy=state.player.y-m.y,len=Math.max(1,Math.hypot(dx,dy));const step=Math.min(m.speed*dt,d-m.attackRange*.75);m.x+=dx/len*step;m.y+=dy/len*step}if(d<=m.attackRange&&m.attackCooldown<=0&&state.player.iframes<=0){state.player.hp=Math.max(0,state.player.hp-m.attack);state.player.iframes=PLAYER_IFRAME;m.attackCooldown=.9}}
}
