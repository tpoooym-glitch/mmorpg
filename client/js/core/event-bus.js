const listeners=new Map();
export function on(event,handler){if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event).add(handler);return()=>listeners.get(event)?.delete(handler)}
export function emit(event,payload){for(const handler of listeners.get(event)||[])handler(payload)}
export function clearEvents(){listeners.clear()}
