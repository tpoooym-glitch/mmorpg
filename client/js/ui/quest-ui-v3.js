const typeLabel={hunt:'ล่า',collect:'เก็บของ',delivery:'ส่งของ',craft:'คราฟต์',boss:'บอส',kill:'ล่า'};
const npcNames={'elder-mira':'Mira','merchant-lina':'Lina','blacksmith-oren':'Oren','innkeeper-aria':'Aria','guild-master-ryan':'Ryan'};
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function objectiveText(o){const label=typeLabel[o.type]||o.type||'ภารกิจ';return `${label}: ${esc(o.target)}`}
function rewardText(r){const out=[];if(r?.exp)out.push(`EXP ${r.exp}`);if(r?.gold)out.push(`Gold ${r.gold}`);if(r?.items?.length)out.push(`Item ${(r.items||[]).map(i=>typeof i==='string'?i:`${i.id} x${i.qty||1}`).join(', ')}`);return out.join(' · ')||'ไม่มีรางวัล'}
export function initQuestUI(state){
  const root=document.getElementById('quest-panel');if(!root)return;
  const list=document.getElementById('quest-list');const catalog=document.getElementById('quest-catalog');const title=document.getElementById('quest-npc-title');const close=document.getElementById('quest-close');
  let activeNpc=null;
  const render=()=>{
    const qm=state.questManager;const active=qm?.active||[];const quests=state.questCatalog||[];
    list.innerHTML=active.length?active.map(q=>{const done=q.status==='complete';const objs=(q.objectives||[]).map(o=>`<div class="quest-objective">${objectiveText(o)} <b>${o.current||0}/${o.required}</b></div>`).join('');const canTurn=done&&activeNpc&&q.giverNpc===activeNpc;return `<article class="quest-card ${done?'done':''}"><div class="quest-card-title">${esc(q.title)}</div><div class="quest-giver">ส่งคืน: ${esc(npcNames[q.giverNpc]||q.giverNpc)}</div>${objs}<div class="quest-reward">${esc(rewardText(q.rewards))}</div>${canTurn?`<button data-turnin="${esc(q.id)}">ส่งเควสต์</button>`:done?'<div class="quest-giver">กลับไปหา NPC เดิมเพื่อส่งเควสต์</div>':''}</article>`}).join(''):'<div class="quest-empty">ยังไม่มีเควสต์ที่รับอยู่</div>';
    const available=quests.filter(q=>q.giverNpc===activeNpc&&!active.some(a=>a.id===q.id));
    catalog.innerHTML=activeNpc?(available.length?available.map(q=>{const full=active.length>=5;return `<article class="quest-card available"><div class="quest-card-title">${esc(q.title)}</div><div class="quest-giver">NPC: ${esc(npcNames[q.giverNpc]||q.giverNpc)}</div><div class="quest-description">${esc(q.description||'')}</div>${(q.objectives||[]).map(objectiveText).join('<br>')}<div class="quest-reward">${esc(rewardText(q.rewards))}</div><button data-accept="${esc(q.id)}" ${full?'disabled':''}>${full?'ครบ 5 เควสต์':'รับเควสต์'}</button></article>`}).join(''):'<div class="quest-empty">NPC นี้ไม่มีเควสต์ใหม่</div>'):'<div class="quest-empty">เข้าใกล้ NPC แล้วกด E เพื่อดูเควสต์</div>';
    title.textContent=`${npcNames[activeNpc]||activeNpc||'Quest'} · Quest NPC`;
  };
  const openForNpc=npcId=>{activeNpc=npcId||null;state.ui={...(state.ui||{}),activeNpc};root.hidden=false;render()};
  const open=()=>openForNpc(state.ui?.activeNpc||null);const hide=()=>{root.hidden=true};
  close?.addEventListener('click',hide);
  root.addEventListener('click',e=>{const accept=e.target.closest('[data-accept]');if(accept){const q=state.questCatalog.find(x=>x.id===accept.dataset.accept);if(q&&q.giverNpc===activeNpc&&state.questManager?.accept(q))render()}const turn=e.target.closest('[data-turnin]');if(turn){const q=state.questManager?.turnIn(turn.dataset.turnin,activeNpc);if(q)render()}});
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='q'&&!e.repeat){root.hidden?open():hide()}});
  state.questUI={open,openForNpc,hide,render,isOpen:()=>!root.hidden};
  render();
}
