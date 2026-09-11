import {dist} from '../core/utils.js';

const HIT_COOLDOWN=.35;
const PLAYER_IFRAME=.45;
const ATTACK_FRAMES=8;
const ATTACK_FPS=12;
const COMBO_HIT_FRAMES=[2,6];
const RESPAWN_DELAY=2;

function rewardPlayer(state,mob){
  const gold=Math.floor(mob.gold[0]+Math.random()*(mob.gold[1]-mob.gold[0]+1));
  state.player.xp+=mob.exp;state.player.gold+=gold;
  while(state.player.xp>=100){state.player.xp-=100;state.player.level++;state.player.maxHp+=10;state.player.maxMp+=5;state.player.hp=state.player.maxHp;state.player.mp=state.player.maxMp}
}
function findAttackTarget(state,range=state.player.attackRange){const p=state.player;let target=null,best=Infinity;for(const m of state.mobs){if(!m.alive||m.hp<=0)continue;const d=dist(m.x,m.y,p.x,p.y);if(d<=range+m.r&&d<best){best=d;target=m}}return target}
function applyDamage(state,target,rawDamage){if(!target||!target.alive||target.hp<=0)return false;const damage=Math.max(1,Math.floor(rawDamage)-(target.defense||0));target.hp=Math.max(0,target.hp-damage);if(target.hp===0){target.alive=false;target.respawnAt=performance.now()+target.respawnMs;rewardPlayer(state,target)}return true}
function applyAttackHit(state,target){return applyDamage(state,target,state.player.attackDamage)}

export function attack(state){const p=state.player;if(p.dead||p.attackCooldown>0||p.attackAnimating)return false;p.attackCooldown=HIT_COOLDOWN;p.attackAnimating=true;p.attackFrame=0;p.attackElapsed=0;p.attackHitCount=0;p.attackTarget=findAttackTarget(state);return true}

export function useSkill(state,id){
  const p=state.player,skill=p.skillsData?.[id];
  if(p.dead||!skill||!p.skills.includes(id)||p.skillCooldowns[id]>0||p.mp<skill.mpCost||p.attackAnimating)return false;
  p.mp-=skill.mpCost;p.skillCooldowns[id]=skill.cooldownMs/1000;
  if(id==='slash'){const target=findAttackTarget(state,p.attackRange+10);if(target)applyDamage(state,target,p.attackDamage+skill.power);p.skillFlash=.18;return true}
  if(id==='guard'){p.guardTimer=(skill.durationMs||3000)/1000;p.guardReduction=skill.damageReduction??.5;return true}
  return false;
}

function respawnPlayer(state){const p=state.player;p.dead=false;p.deathTimer=0;p.hp=p.maxHp;p.mp=p.maxMp;p.iframes=.5;p.guardTimer=0;p.guardReduction=0;p.attackAnimating=false;p.attackTarget=null;p.x=p.spawnX;p.y=p.spawnY}

export function updateCombat(state,dt){
  const p=state.player;
  if(p.dead){p.deathTimer-=dt;if(p.deathTimer<=0)respawnPlayer(state);return}
  p.attackCooldown=Math.max(0,p.attackCooldown-dt);if(p.iframes>0)p.iframes=Math.max(0,p.iframes-dt);
  if(p.guardTimer>0){p.guardTimer=Math.max(0,p.guardTimer-dt);if(p.guardTimer===0)p.guardReduction=0}
  if(p.skillFlash>0)p.skillFlash=Math.max(0,p.skillFlash-dt);
  for(const id of Object.keys(p.skillCooldowns||{}))p.skillCooldowns[id]=Math.max(0,p.skillCooldowns[id]-dt);
  if(p.attackAnimating){p.attackElapsed+=dt;while(p.attackElapsed>=1/ATTACK_FPS){p.attackElapsed-=1/ATTACK_FPS;p.attackFrame++;if(COMBO_HIT_FRAMES.includes(p.attackFrame)&&p.attackHitCount<2){if(p.attackHitCount===0)p.attackTarget=findAttackTarget(state);applyAttackHit(state,p.attackTarget);p.attackHitCount++}if(p.attackFrame>=ATTACK_FRAMES){p.attackFrame=0;p.attackAnimating=false;p.attackTarget=null;p.attackHitCount=0;break}}}
  else if(p.moving){p.animElapsed+=dt;while(p.animElapsed>=1/10){p.animElapsed-=1/10;p.animFrame=(p.animFrame+1)%4}}
  else{p.animFrame=0;p.animElapsed=0}
  const now=performance.now();
  for(const m of state.mobs){
    if(!m.alive){if(now>=m.respawnAt){m.alive=true;m.hp=m.maxHp;m.x=m.spawnX;m.y=m.spawnY;m.attackCooldown=0}continue}
    const d=dist(m.x,m.y,p.x,p.y);
    if(d<=m.aggroRange&&d>m.attackRange){const dx=p.x-m.x,dy=p.y-m.y,len=Math.max(1,Math.hypot(dx,dy)),step=Math.min(m.speed*dt,d-m.attackRange*.75);m.x+=dx/len*step;m.y+=dy/len*step}
    if(d<=m.attackRange&&m.attackCooldown<=0&&p.iframes<=0){const reduction=p.guardTimer>0?(p.guardReduction||0):0;p.hp=Math.max(0,p.hp-Math.max(1,Math.floor(m.attack*(1-reduction))));p.iframes=PLAYER_IFRAME;m.attackCooldown=.9;if(p.hp<=0){p.hp=0;p.dead=true;p.deathTimer=RESPAWN_DELAY;p.moving=false;p.attackAnimating=false;p.attackTarget=null;break}}
  }
}
