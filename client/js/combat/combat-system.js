import {dist} from '../core/utils.js';

const HIT_COOLDOWN=.35;
const PLAYER_IFRAME=.45;
const ATTACK_FRAMES=8;
const ATTACK_FPS=12;
const COMBO_HIT_FRAMES=[2,6];

function rewardPlayer(state,mob){
  const gold=Math.floor(mob.gold[0]+Math.random()*(mob.gold[1]-mob.gold[0]+1));
  state.player.xp+=mob.exp;
  state.player.gold+=gold;
  while(state.player.xp>=100){
    state.player.xp-=100;
    state.player.level++;
    state.player.maxHp+=10;
    state.player.maxMp+=5;
    state.player.hp=state.player.maxHp;
    state.player.mp=state.player.maxMp;
  }
}

function findAttackTarget(state,range=null){
  const p=state.player;
  let target=null,best=Infinity;
  const attackRange=range??p.attackRange;
  for(const m of state.mobs){
    if(!m.alive||m.hp<=0)continue;
    const d=dist(m.x,m.y,p.x,p.y);
    if(d<=attackRange+m.r&&d<best){best=d;target=m}
  }
  return target;
}

function applyDamage(state,target,damage){
  if(!target||!target.alive||target.hp<=0)return false;
  target.hp=Math.max(0,target.hp-Math.max(1,Math.floor(damage)-(target.defense||0)));
  if(target.hp<=0){
    target.alive=false;
    target.respawnAt=performance.now()+target.respawnMs;
    rewardPlayer(state,target);
  }
  return true;
}

function applyAttackHit(state,target){
  return applyDamage(state,target,state.player.attackDamage);
}

export function attack(state){
  const p=state.player;
  if(p.attackCooldown>0||p.attackAnimating)return false;
  p.attackCooldown=HIT_COOLDOWN;
  p.attackAnimating=true;
  p.attackFrame=0;
  p.attackElapsed=0;
  p.attackHitCount=0;
  p.attackTarget=findAttackTarget(state);
  return true;
}

export function useSkill(state,id,skill){
  const p=state.player;
  if(!skill||!p.skills||!p.skillCooldowns)return false;
  if(!p.skills.includes(id)||p.skillCooldowns[id]>0)return false;
  if(p.mp<skill.mpCost)return false;
  if(p.attackAnimating)return false;

  p.mp-=skill.mpCost;
  p.skillCooldowns[id]=skill.cooldownMs/1000;

  if(id==='guard'){
    p.guardTimer=3;
    p.guardReduction=.5;
    return true;
  }

  if(id==='slash'){
    const target=findAttackTarget(state,(p.attackRange||78)+10);
    if(target)applyDamage(state,target,p.attackDamage+skill.power);
    p.skillFlash=0.18;
    return true;
  }

  return false;
}

export function updateCombat(state,dt){
  const p=state.player;
  p.attackCooldown=Math.max(0,p.attackCooldown-dt);
  if(p.iframes>0)p.iframes=Math.max(0,p.iframes-dt);
  if(p.guardTimer>0){p.guardTimer=Math.max(0,p.guardTimer-dt);if(p.guardTimer===0)p.guardReduction=0}
  if(p.skillFlash>0)p.skillFlash=Math.max(0,p.skillFlash-dt);
  if(p.skillCooldowns)for(const id of Object.keys(p.skillCooldowns))p.skillCooldowns[id]=Math.max(0,p.skillCooldowns[id]-dt);

  if(p.attackAnimating){
    p.attackElapsed+=dt;
    while(p.attackElapsed>=1/ATTACK_FPS){
      p.attackElapsed-=1/ATTACK_FPS;
      p.attackFrame++;
      if(COMBO_HIT_FRAMES.includes(p.attackFrame)&&p.attackHitCount<2){
        if(p.attackHitCount===0)p.attackTarget=findAttackTarget(state);
        applyAttackHit(state,p.attackTarget);
        p.attackHitCount++;
      }
      if(p.attackFrame>=ATTACK_FRAMES){p.attackFrame=0;p.attackAnimating=false;p.attackTarget=null;p.attackHitCount=0;break}
    }
  }else if(p.moving){
    p.animElapsed+=dt;
    while(p.animElapsed>=1/10){p.animElapsed-=1/10;p.animFrame=(p.animFrame+1)%4}
  }else{p.animFrame=0;p.animElapsed=0}

  const now=performance.now();
  for(const m of state.mobs){
    if(!m.alive){if(now>=m.respawnAt){m.alive=true;m.hp=m.maxHp;m.x=m.spawnX;m.y=m.spawnY;m.attackCooldown=0}continue}
    const d=dist(m.x,m.y,p.x,p.y);
    if(d<=m.aggroRange&&d>m.attackRange){
      const dx=p.x-m.x,dy=p.y-m.y,len=Math.max(1,Math.hypot(dx,dy));
      const step=Math.min(m.speed*dt,d-m.attackRange*.75);
      m.x+=dx/len*step;m.y+=dy/len*step;
    }
    if(d<=m.attackRange&&m.attackCooldown<=0&&p.iframes<=0){
      const reduction=p.guardTimer>0?(p.guardReduction||0):0;
      p.hp=Math.max(0,p.hp-Math.max(1,Math.floor(m.attack*(1-reduction))));
      p.iframes=PLAYER_IFRAME;
      m.attackCooldown=.9;
    }
  }
}
