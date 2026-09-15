import {dist} from '../core/utils.js';
const INTERACT_RANGE=125;
function nearestQuestNpc(state){const p=state.player;let best=null,bestD=Infinity;for(const s of state.zone?.structures||[]){if(s.type!=='quest')continue;const d=dist(s.x,s.y,p.x,p.y);if(d<bestD){bestD=d;best=s}}return best?{structure:best,distance:bestD}:null}
export function createNpcInteraction(state){
  const api={
    current:null,
    update(){const near=nearestQuestNpc(state);this.current=near&&near.distance<=INTERACT_RANGE?near:null;state.npcInteraction=this.current;return this.current},
    interact(){const near=this.update();if(!near)return false;const npcId=near.structure.npcId||'mira';state.ui={...(state.ui||{}),activeNpc:npcId};state.questUI?.openForNpc?.(npcId);return true}
  };
  state.npcInteraction=null;return api;
}
