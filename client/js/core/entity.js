export function createEntity(data={}){return{id:data.id??crypto.randomUUID(),type:data.type??'entity',x:data.x??0,y:data.y??0,r:data.r??16,hp:data.hp??1,maxHp:data.maxHp??data.hp??1,alive:true,state:data.state??'idle',metadata:data.metadata??{}})}
export function isAlive(entity){return Boolean(entity?.alive&&entity.hp>0)}
export function setDead(entity){entity.hp=0;entity.alive=false;entity.state='dead';return entity}
