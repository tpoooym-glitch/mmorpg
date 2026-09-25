import {dist} from '../core/utils.js';

const INTERACT_RANGE=95;

export function createDeliveryInteraction(state){
  return {
    current:null,
    update(){
      const active=state.questManager?.active||[];
      const delivery=active.find(q=>q.status==='active'&&(q.objectives||[]).some(o=>o.type==='delivery'&&o.target==='village-warehouse'&&o.current<o.required));
      if(!delivery){this.current=null;state.deliveryInteraction=null;return null}
      let best=null,bestD=Infinity;
      for(const s of state.zone?.structures||[]){
        if(s.type!=='warehouse')continue;
        const d=dist(s.x,s.y,state.player.x,state.player.y);
        if(d<bestD){best=s;bestD=d}
      }
      this.current=best&&bestD<=INTERACT_RANGE?{structure:best,distance:bestD,quest:delivery}:null;
      state.deliveryInteraction=this.current;
      return this.current;
    },
    interact(){
      const near=this.update();
      if(!near)return false;
      const objective=(near.quest.objectives||[]).find(o=>o.type==='delivery'&&o.target==='village-warehouse');
      if(!objective)return false;
      state.questManager?.update(objective.id,objective.required-objective.current);
      state.ui={...(state.ui||{}),message:'ส่งพัสดุที่คลังหมู่บ้านแล้ว'};
      return true;
    }
  };
}
