const ROAD_SRC={x:65,y:76,w:220,h:143};
const ROAD_CAP_LEFT={x:25,y:76,w:58,h:143};
const ROAD_CAP_RIGHT={x:267,y:76,w:58,h:143};
const ROAD_T={x:1287,y:24,w:291,h:242};
const ROAD_CROSS={x:651,y:23,w:297,h:243};

function drawImageStrip(ctx,img,src,x,y,w,h,angle=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(img,src.x,src.y,src.w,src.h,0,-h/2,w,h);ctx.restore();
}

function drawRepeatedSegment(ctx,img,a,b,width){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<1)return;
  const angle=Math.atan2(dy,dx),tileLength=width*(ROAD_SRC.w/ROAD_SRC.h);
  const ux=dx/length,uy=dy/length;
  let covered=0;
  while(covered<length){
    const take=Math.min(tileLength,length-covered),sx=ROAD_SRC.x+ROAD_SRC.w*(take/tileLength),px=a[0]+ux*covered,py=a[1]+uy*covered;
    drawImageStrip(ctx,img,{x:ROAD_SRC.x,y:ROAD_SRC.y,w:sx-ROAD_SRC.x,h:ROAD_SRC.h},px,py,take,width,angle);covered+=take;
  }
}

function endpointKey(p){return `${Math.round(p[0])}:${Math.round(p[1])}`}
function pointNearSegment(p,a,b,tolerance){const dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2)),x=a[0]+dx*t,y=a[1]+dy*t;return Math.hypot(p[0]-x,p[1]-y)<=tolerance}
function endpointConnected(p,ownerIndex,roads){for(let i=0;i<roads.length;i++){if(i===ownerIndex)continue;const pts=roads[i].points||[];for(let j=0;j<pts.length-1;j++)if(pointNearSegment(p,pts[j],pts[j+1],Math.max(10,Math.min(22,(roads[i].width||82)*.18))))return true}return false}

function drawCap(ctx,img,p,width,angle,side){
  const h=width,w=width*(ROAD_CAP_LEFT.w/ROAD_CAP_LEFT.h),src=side==='left'?ROAD_CAP_LEFT:ROAD_CAP_RIGHT;
  ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle+(side==='left'?Math.PI:0));ctx.imageSmoothingEnabled=false;ctx.drawImage(img,src.x,src.y,src.w,src.h,-w,-h/2,w,h);ctx.restore();
}

function drawJunction(ctx,img,p,width,kind,angle){
  const src=kind==='cross'?ROAD_CROSS:ROAD_T,scale=width/143,dw=src.w*scale,dh=src.h*scale;
  ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle||0);ctx.imageSmoothingEnabled=false;ctx.drawImage(img,src.x,src.y,src.w,src.h,-dw/2,-dh/2,dw,dh);ctx.restore();
}

function collectJunctions(roads){
  const nodes=new Map();
  roads.forEach((r,ri)=>{
    const pts=r.points||[];for(const p of [pts[0],pts[pts.length-1]]){
      if(!p)continue;const k=endpointKey(p),entry=nodes.get(k)||{p:[p[0],p[1]],roads:[]};if(!entry.roads.includes(ri))entry.roads.push(ri);nodes.set(k,entry);
    }
  });
  roads.forEach((r,ri)=>{for(const p of [r.points?.[0],r.points?.at(-1)])for(let oi=0;oi<roads.length;oi++)if(oi!==ri&&p&&!nodes.has(endpointKey(p))&&endpointConnected(p,ri,roads)){nodes.set(endpointKey(p),{p:[p[0],p[1]],roads:[ri,oi]});}});
  return [...nodes.values()];
}

export function drawRoadOverlay(ctx,state){
  const img=state.assets?.roadTiles,z=state.zone;if(!img?.complete||!img.naturalWidth||!z)return;
  const roads=z.roads||[];ctx.save();ctx.globalAlpha=1;
  for(const r of roads){
    const pts=r.points||[];for(let i=0;i<pts.length-1;i++){
      const a=[pts[i][0]-state.cam.x,pts[i][1]-state.cam.y],b=[pts[i+1][0]-state.cam.x,pts[i+1][1]-state.cam.y];drawRepeatedSegment(ctx,img,a,b,r.width||110)
    }
  }
  const junctions=collectJunctions(roads);
  for(const j of junctions){
    const p=[j.p[0]-state.cam.x,j.p[1]-state.cam.y];
    if(p[0]<-300||p[1]<-300||p[0]>ctx.canvas.width+300||p[1]>ctx.canvas.height+300)continue;
    const widths=j.roads.map(i=>roads[i]?.width||110),width=Math.max(...widths);let kind=j.roads.length>=3?'cross':'t';
    let angle=0;
    if(kind==='t'){
      const r=roads[j.roads[0]],first=r?.points?.[0],last=r?.points?.at(-1),other=first&&Math.hypot(first[0]-j.p[0],first[1]-j.p[1])<2?(r.points?.[1]||j.p):(r.points?.at(-2)||j.p);
      angle=Math.atan2(j.p[1]-other[1],j.p[0]-other[0])-Math.PI/2;
    }
    drawJunction(ctx,img,p,width,kind,angle);
  }
  for(let ri=0;ri<roads.length;ri++){
    const r=roads[ri],pts=r.points||[];if(pts.length<2)continue;
    const a=[pts[0][0]-state.cam.x,pts[0][1]-state.cam.y],b=[pts.at(-1)[0]-state.cam.x,pts.at(-1)[1]-state.cam.y];
    const aa=Math.atan2(pts[1][1]-pts[0][1],pts[1][0]-pts[0][0]),bb=Math.atan2(pts.at(-1)[1]-pts.at(-2)[1],pts.at(-1)[0]-pts.at(-2)[0]);
    if(!endpointConnected(pts[0],ri,roads))drawCap(ctx,img,a,r.width||110,aa,'left');
    if(!endpointConnected(pts.at(-1),ri,roads))drawCap(ctx,img,b,r.width||110,bb,'right');
  }
  ctx.restore();
}