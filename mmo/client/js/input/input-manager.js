export function createInput(onAttack,onSkill){
  const keys={};
  const down=e=>{
    const key=e.key.toLowerCase();
    keys[key]=true;
    if(e.key===' '){e.preventDefault();onAttack?.()}
    else if(e.key==='1'){e.preventDefault();onSkill?.('slash')}
    else if(e.key==='2'){e.preventDefault();onSkill?.('guard')}
  };
  const up=e=>{keys[e.key.toLowerCase()]=false};
  addEventListener('keydown',down);addEventListener('keyup',up);
  return{keys,destroy(){removeEventListener('keydown',down);removeEventListener('keyup',up)}}
}
