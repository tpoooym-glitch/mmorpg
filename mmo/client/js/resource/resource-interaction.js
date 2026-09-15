import {dist} from '../core/utils.js';

const INTERACT_RANGE=70;
const NODES=[
  {id:'herb-1',type:'herb',x:760,y:980},
  {id:'herb-2',type:'herb',x:980,y:760},
  {id:'herb-3',type:'herb',x:1260,y:1040},
  {id:'herb-4',type:'herb',x:1540,y:880},
  {id:'herb-5',type:'herb',x:1880,y:980},
  {id:'herb-6',type:'herb',x:2220,y:760},
  {id:'ore-1',type:'ore',x:2700,y:980},
  {id:'ore-2',type:'ore',x:3100,y:1080},
  {id:'ore-3',type:'ore',x:3500,y:900},
  {id:'ore-4',type:'ore',x:4000,y:1040},
  {id:'ore-5',type:'ore',x:4500,y:920}
];

function nearest(state){
  let best=null,bestD=Infinity;
  for(const node of state.resources||[]){
    if(node.collected)continue;
    const d=dist(node.x,node.y,state.player.x,state.player.y);
    if(d<bestD){best=node;bestD=d}
  }
  return best&&bestD<=INTERACT_RANGE?{node:best,distance:bestD}:null;
}

function addItem(player,id,qty=1){
  player.inventory=player.inventory&&typeof player.inventory==='object'?player.inventory:{};
  player.inventory[id]=(player.inventory[id]||0)+qty;
}

export function createResourceInteraction(state){
  state.resources=NODES.map(n=>({...n,collected:false}));
  return {
    current:null,
    update(){this.current=nearest(state);state.resourceInteraction=this.current;return this.current},
    interact(){
      const near=this.update();
      if(!near)return false;
      const node=near.node;
      node.collected=true;
      addItem(state.player,node.type,1);
      state.questManager?.progress('collect',node.type,1);
      state.ui={...(state.ui||{}),message:`เก็บ ${node.type} +1`};
      return true;
    }
  };
}
