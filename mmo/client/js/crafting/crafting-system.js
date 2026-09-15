function ensureInventory(player){player.inventory=player.inventory&&typeof player.inventory==='object'?player.inventory:{};return player.inventory}
function hasIngredients(inv,ingredients){return (ingredients||[]).every(i=>(inv[i.id]||0)>=i.qty)}
function consume(inv,ingredients){for(const i of ingredients)inv[i.id]-=i.qty}
export function createCraftingSystem(state,recipes=[]){
  const system={recipes:Array.isArray(recipes)?recipes:[],selected:null,
    setRecipes(list){this.recipes=Array.isArray(list)?list:[];return this.recipes},
    available(station='blacksmith'){const inv=ensureInventory(state.player);return this.recipes.filter(r=>!r.station||r.station===station).map(r=>({...r,canCraft:hasIngredients(inv,r.ingredients)}))},
    canCraft(id){const r=this.recipes.find(x=>x.id===id);return !!r&&hasIngredients(ensureInventory(state.player),r.ingredients)},
    craft(id){const r=this.recipes.find(x=>x.id===id);if(!r||!this.canCraft(id))return false;const inv=ensureInventory(state.player);consume(inv,r.ingredients);inv[r.output.id]=(inv[r.output.id]||0)+r.output.qty;state.questManager?.progress('craft',r.output.id,r.output.qty);state.ui={...(state.ui||{}),message:`คราฟต์ ${r.name} สำเร็จ`};return true}
  };state.crafting=system;return system
}
