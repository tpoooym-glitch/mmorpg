const ROAD_BODY={x:60,y:68,w:160,h:108};
const ROAD_CAP_START={x:22,y:68,w:38,h:108};
const ROAD_CAP_END={x:220,y:68,w:38,h:108};
const ROAD_T={x:1287,y:24,w:291,h:242};
const ROAD_CROSS={x:651,y:23,w:297,h:243};

function drawRepeatedSegment(ctx,img,a,b,width){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<1)return;
  const angle=Math.atan2(dy,dx),tileLength=120;
  ctx.save();ctx.translate(a[0],a[1]);ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
  ctx.beginPath();ctx.rect(0,-width/2,length,width);ctx.clip();
  for(let x=0;x<length;x+=tileLength)ctx.drawImage(img,ROAD_BODY.x,ROAD_BODY.y,ROAD_BODY.w,ROAD_BODY.h,x,-width/2,tileLength+1,width);
  ctx.restore();
}

function segmentAngle(a,b){return Math.atan2(b[1]-a[1],b[0]-a[0])}
function endpointTouches(p,owner,roads){for(let i=0;i<roads.length;i++){if(i===owner)continue;const pts=roads[i].points||[];for(const q of [pts[0],pts[pts.length-1]])if(q&&Math.hypot(p[0]-q[0],p[1]-q[1])<8)return true}return false}
function drawCap(ctx,img,p,width,angle,source,reverse=false){
  const capW=width*(source.w/source.h);
  ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle+(reverse?Math.PI:0));ctx.imageSmoothingEnabled=false;
  ctx.drawImage(img,source.x,source.y,source.w,source.h,-capW,-width/2,capW,width);ctx.restore();
}
function drawJunction(ctx,img,p,width,kind,angle){
  const src=kind==='cross'?ROAD_CROSS:ROAD_T,scale=width/src.h,dw=src.w*scale,dh=src.h*scale;
  ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle||0);ctx.imageSmoothingEnabled=false;ctx.drawImage(img,src.x,src.y,src.w,src.h,-dw/2,-dh/2,dw,dh);ctx.restore();
}
function collectJunctions(roads){
  const out=[];
  roads.forEach((r,ri)=>{const pts=r.points||[];for(const p of [pts[0],pts[pts.length-1]]){if(!p)continue;const hit=[];roads.forEach((o,oi)=>{if(oi===ri)return;const q=o.points||[];for(const e of [q[0],q[q.length-1]])if(e&&Math.hypot(p[0]-e[0],p[1]-e[1])<8)hit.push(oi)});if(hit.length)out.push({p,roads:[ri,...hit]})}});
  return out.filter((n,i,a)=>a.findIndex(x=>Math.hypot(x.p[0]-n.p[0],x.p[1]-n.p[1])<8)===i)
}
export function drawRoadOverlay(ctx,state){
  const img=state.assets?.roadTiles,z=state.zone;if(!img?.complete||!img.naturalWidth||!z)return;
  const roads=z.roads||[];ctx.save();
  for(const r of roads){const pts=r.points||[];if(pts.length<2)continue;const width=r.width||110;for(let i=0;i<pts.length-1;i++){const a=[pts[i][0]-state.cam.x,pts[i][1]-state.cam.y],b=[pts[i+1][0]-state.cam.x,pts[i+1][1]-state.cam.y];drawRepeatedSegment(ctx,img,a,b,width)}}
  for(const j of collectJunctions(roads)){const p=[j.p[0]-state.cam.x,j.p[1]-state.cam.y],width=Math.max(...j.roads.map(i=>roads[i]?.width||110)),kind=j.roads.length>=3?'cross':'t';let angle=0;if(kind==='t'){const r=roads[j.roads[0]],pts=r?.points||[];const atStart=pts[0]&&Math.hypot(pts[0][0]-j.p[0],pts[0][1]-j.p[1])<8;const other=atStart?pts[1]:pts[pts.length-2];if(other)angle=segmentAngle(other,j.p)-Math.PI/2}drawJunction(ctx,img,p,width,kind,angle)}
  for(let ri=0;ri<roads.length;ri++){const r=roads[ri],pts=r.points||[];if(pts.length<2)continue;const width=r.width||110,sa=segmentAngle(pts[0],pts[1]),ea=segmentAngle(pts[pts.length-2],pts[pts.length-1]);if(!endpointTouches(pts[0],ri,roads))drawCap(ctx,img,[pts[0][0]-state.cam.x,pts[0][1]-state.cam.y],width,sa,ROAD_CAP_START,true);if(!endpointTouches(pts[pts.length-1],ri,roads))drawCap(ctx,img,[pts[pts.length-1][0]-state.cam.x,pts[pts.length-1][1]-state.cam.y],width,ea,ROAD_CAP_END,false)}
  ctx.restore();
}
