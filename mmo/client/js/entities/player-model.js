export const PLAYER_STATES=['idle','walk','attack','cast','hurt','dead'];
export function createPlayerModel(data={}){return{...data,class:data.class??'Warrior',direction:'down',state:'idle',frame:0,inventory:[],equipment:{weapon:null,armor:null,accessory:null},skills:[],quests:[]}}
