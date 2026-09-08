import {dist} from '../core/utils.js';
export function findNearbyNpc(state,npcs,range=72){return npcs.filter(n=>dist(n.x,n.y,state.player.x,state.player.y)<=range)[0]??null}
export function interactNpc(state,npc){if(!npc)return false;state.ui={...state.ui,activeNpc:npc.id};return true}
