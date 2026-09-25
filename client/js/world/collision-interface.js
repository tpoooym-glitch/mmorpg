export function canMoveTo(state,x,y){return !state.zone||!state.collision||state.collision.isBlocked?.(x,y)??true}
export function createCollisionInterface(zone){return{isBlocked(x,y){return false},zone}}
