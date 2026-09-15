import {dist} from '../core/utils.js';
const RANGE=125;
export function createCraftingInteraction(state){
  return {current:null,update(){let best=null,bestD=Infinity;for(const s of state.zone?.structures||[]){if(s.type!=='blacksmith')continue;const d=dist(s.x,s.y,state.player.x,state.player.y);if(d<bestD){best=s;bestD=d}}this.current=best&&bestD<=RANGE?{structure:best,distance:bestD}:null;state.craftingInteraction=this.current;return this.current},interact(){const near=this.update();if(!near)return false;state.craftingUI?.open();return true}};
}
