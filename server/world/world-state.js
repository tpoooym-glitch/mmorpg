export function createWorldState(){return{zones:new Map(),players:new Map(),monsters:new Map(),npcs:new Map(),startedAt:Date.now()}}
export function addZone(world,zone){world.zones.set(zone.id??zone.name,zone)}
