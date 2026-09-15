const names={iron:'แร่เหล็ก', 'iron-ore':'แร่เหล็ก','slime-gel':'เจล Slime','healing-herb':'สมุนไพร','wheat':'ข้าวสาลี'};
function itemName(id){return names[id]||id}
export function initCraftingUI(state){
  const root=document.getElementById('craft-panel');if(!root)return;
  const list=document.getElementById('craft-list'),close=document.getElementById('craft-close'),title=document.getElementById('craft-title');
  const render=()=>{const recipes=state.crafting?.available('blacksmith')||[];list.innerHTML=recipes.length?recipes.map(r=>{const mats=(r.ingredients||[]).map(i=>`${itemName(i.id)} ${state.player.inventory?.[i.id]||0}/${i.qty}`).join(' · ');return `<article class="craft-card"><b>${r.name}</b><div>${mats}</div><small>ผลลัพธ์: ${itemName(r.output.id)} ×${r.output.qty}</small><button data-craft="${r.id}" ${r.canCraft?'':'disabled'}>${r.canCraft?'คราฟต์':'วัตถุดิบไม่พอ'}</button></article>`}).join(''):'<div class="quest-empty">ยังไม่มีสูตรคราฟต์</div>'};
  const open=()=>{root.hidden=false;title.textContent='โรงตีเหล็ก · Crafting';render()};const hide=()=>{root.hidden=true};close?.addEventListener('click',hide);root.addEventListener('click',e=>{const b=e.target.closest('[data-craft]');if(!b)return;if(state.crafting?.craft(b.dataset.craft))render()});state.craftingUI={open,hide,render,isOpen:()=>!root.hidden};
}
