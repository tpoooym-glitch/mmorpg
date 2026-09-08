const KEY='arelia-online-save-v1';
export function saveGame(state){const data={player:structuredClone(state.player),zoneId:state.zone?.id??state.zone?.name??'emerald-vales',timestamp:Date.now()};localStorage.setItem(KEY,JSON.stringify(data));return data}
export function loadGame(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
export function clearSave(){localStorage.removeItem(KEY)}
