export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
export const inRect=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
export function nearLine(x,y,p,r){for(let i=1;i<p.length;i++){const[a,b]=p[i-1],[c,d]=p[i],abx=c-a,aby=d-b,t=clamp(((x-a)*abx+(y-b)*aby)/(abx*abx+aby*aby||1),0,1);if(dist(x,y,a+t*abx,b+t*aby)<=r)return true}return false}