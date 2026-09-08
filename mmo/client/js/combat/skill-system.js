export function canUseSkill(player,skill,now=Date.now()){const ready=(player.skillCooldowns?.[skill.id]??0)<=now;return ready&&(player.mp??0)>=(skill.mpCost??0)}
export function useSkill(player,skill,now=Date.now()){if(!canUseSkill(player,skill,now))return false;player.mp-=skill.mpCost??0;player.skillCooldowns??={};player.skillCooldowns[skill.id]=now+(skill.cooldownMs??0);return true}
