function clone(value){return JSON.parse(JSON.stringify(value))}
function normalizeQuest(template){const q=clone(template);for(const o of q.objectives||[]){o.current=Number.isFinite(o.current)?o.current:0;o.required=Math.max(1,o.required||1)}q.status='active';return q}
function objectiveMatches(o,type,target){if(o.type!==type)return false;return o.target==null||o.target===target}
function applyXp(player,amount){player.xp=Math.max(0,(player.xp||0)+Math.max(0,amount||0));while(player.xp>=100){player.xp-=100;player.level=Math.max(1,(player.level||1)+1)}}
export function createQuestManager(state,catalog=[]){
  const max=Math.max(1,state?.player?.questsMax||5);
  const manager={
    active:Array.isArray(state.player.quests)?state.player.quests:[],
    catalog:Array.isArray(catalog)?catalog:[],
    max,
    setCatalog(list){this.catalog=Array.isArray(list)?list:[];return this.catalog},
    availableForNpc(npcId){return this.catalog.filter(q=>q.giverNpc===npcId&&!this.active.some(a=>a.id===q.id))},
    find(id){return this.active.find(q=>q.id===id)||null},
    accept(quest){if(!quest||this.active.length>=this.max||this.active.some(q=>q.id===quest.id))return false;this.active.push(normalizeQuest(quest));state.player.quests=this.active;return true},
    update(objectiveId,amount=1){let changed=false;for(const q of this.active)for(const o of q.objectives||[])if(o.id===objectiveId){const before=o.current;o.current=Math.min(o.required,o.current+Math.max(0,amount));changed=changed||o.current!==before;this._refresh(q)}return changed},
    progress(type,target,amount=1){let changed=false;for(const q of this.active)for(const o of q.objectives||[])if(objectiveMatches(o,type,target)){const before=o.current;o.current=Math.min(o.required,o.current+Math.max(0,amount));changed=changed||o.current!==before;this._refresh(q)}return changed},
    _refresh(q){q.status=(q.objectives||[]).every(o=>o.current>=o.required)?'complete':'active'},
    isComplete(id){const q=this.find(id);return !!q&&q.status==='complete'},
    canTurnIn(id,npcId){const q=this.find(id);return !!q&&q.status==='complete'&&q.giverNpc===npcId},
    turnIn(id,npcId){
      const index=this.active.findIndex(q=>q.id===id&&q.status==='complete'&&q.giverNpc===npcId);if(index<0)return null;
      const q=this.active.splice(index,1)[0],rewards=q.rewards||{};state.player.quests=this.active;
      state.player.gold=Math.max(0,(state.player.gold||0)+(rewards.gold||0));applyXp(state.player,rewards.exp||0);
      state.player.pendingQuestRewards=Array.isArray(state.player.pendingQuestRewards)?state.player.pendingQuestRewards:[];
      for(const item of rewards.items||[])if(item?.id&&item.qty>0)state.player.pendingQuestRewards.push({...item,sourceQuest:q.id});
      return clone(q)
    },
    abandon(id){const index=this.active.findIndex(q=>q.id===id);if(index<0)return false;this.active.splice(index,1);state.player.quests=this.active;return true},
    snapshot(){return clone(this.active)}
  };
  state.player.quests=manager.active;
  state.questManager=manager;
  return manager
}
