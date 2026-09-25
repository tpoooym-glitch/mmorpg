export const UI_PANELS=['inventory','equipment','quests','shop','dialogue','character','skills'];
export function createUiState(){return{activePanel:null,activeNpc:null,message:'',notifications:[],visible:true}}
export function openPanel(ui,panel){if(!UI_PANELS.includes(panel))return false;ui.activePanel=panel;return true}
export function closePanel(ui){ui.activePanel=null;ui.activeNpc=null}
