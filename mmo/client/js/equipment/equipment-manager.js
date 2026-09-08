export const EQUIPMENT_SLOTS=['weapon','armor','accessory'];
export function equip(state,item){if(!item?.slot||!EQUIPMENT_SLOTS.includes(item.slot))return false;state.player.equipment??={};state.player.equipment[item.slot]=item.id;return true}
export function unequip(state,slot){if(!EQUIPMENT_SLOTS.includes(slot))return false;state.player.equipment[slot]=null;return true}
