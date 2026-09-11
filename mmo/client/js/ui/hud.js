export function updateHud(state){
  const p=state.player;
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  set('hp',`${Math.ceil(p.hp)}/${p.maxHp}`);set('mp',`${Math.ceil(p.mp)}/${p.maxMp}`);set('gold',p.gold);set('xp',`${p.xp}/100`);set('level',`Lv.${p.level}`);
  const hp=document.getElementById('hpbar'),mp=document.getElementById('mpbar'),xp=document.getElementById('xpbar');
  if(hp)hp.style.width=`${Math.max(0,Math.min(100,100*p.hp/p.maxHp))}%`;
  if(mp)mp.style.width=`${Math.max(0,Math.min(100,100*p.mp/p.maxMp))}%`;
  if(xp)xp.style.width=`${Math.max(0,Math.min(100,100*p.xp/100))}%`;
  const character=document.getElementById('character');if(character)character.textContent=`${p.name} · ${p.class}`;
  for(const id of ['slash','guard']){
    const skill=p.skillsData?.[id],el=document.getElementById(`skill-${id}`),cool=p.skillCooldowns?.[id]||0;
    if(!el||!skill)continue;
    const time=document.getElementById(`cooldown-${id}`);if(time)time.textContent=cool>0?cool.toFixed(1):'READY';
    el.classList.toggle('cooling',cool>0);el.classList.toggle('disabled',p.mp<skill.mpCost||p.dead);
  }
  const death=document.getElementById('death-message');if(death)death.hidden=!p.dead;
}
