import {dist,inRect,nearLine} from '../core/utils.js';
import {terrainAt} from './terrain.js';

const RIVER_SOURCES=[
  {name:'reedsSmall',index:0,blocked:false},{name:'reedsMedium',index:1,blocked:false},{name:'reedsDense',index:2,blocked:false},
  {name:'lilySmall',index:3,blocked:false},{name:'lilyCluster',index:4,blocked:false},{name:'aquaticPlant',index:5,blocked:false},
  {name:'wetGrass',index:6,blocked:false},{name:'flowerPlant',index:7,blocked:false},{name:'mudGrass',index:8,blocked:false},
  {name:'mudPatch',index:9,blocked:false},{name:'waterPlant',index:10,blocked:false},{name:'seaweed',index:11,blocked:false},
  {name:'branch',index:12,blocked:false},{name:'log',index:13,blocked:true},{name:'root',index:14,blocked:true},{name:'rootLarge',index:15,blocked:true}
];

const TREE_SIZES={
  oakSmall:[82,92,26],oakMedium:[105,110,32],oakLarge:[135,132,40],
  pineSmall:[82,90,25],pineMedium:[108,120,31],pineLarge:[138,140,40]
};

export function generateDecor(state){
  const z=state.zone,decor=[];let seed=8731;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const roadNear=(x,y)=>((z.roads||[]).some(q=>nearLine(x,y,q.points,55)));
  const bridgeNear=(x,y)=>((z.bridges||[]).some(b=>inRect(x,y,b)));
  const waterAt=(x,y)=>terrainAt(state,x,y)==='water';
  const canPlace=(x,y,minGap=70)=>!waterAt(x,y)&&!bridgeNear(x,y)&&dist(x,y,state.player.x,state.player.y)>120&&!roadNear(x,y)&&!decor.some(o=>dist(x,y,o.x,o.y)<minGap);
  const nearRiver=(x,y,radius)=>((z.water||[]).some(w=>w.type==='river'&&nearLine(x,y,w.points,radius)));
  const nearPond=(x,y,radius)=>((z.water||[]).some(w=>w.type==='pond'&&distToEllipse(x,y,w)<=radius));
  const nearWater=(x,y,radius)=>nearRiver(x,y,radius)||nearPond(x,y,radius);

  // Dense tree clusters in forest regions. Trees are solid obstacles; collision is handled at their base radius.
  const forests=(z.terrain?.regions||[]).filter(r=>r.type==='forest');
  for(const r of forests){
    const count=Math.max(28,Math.floor(r.w*r.h/24000));
    for(let n=0;n<count;n++)for(let tries=0;tries<40;tries++){
      const x=r.x+35+rand()*Math.max(1,r.w-70),y=r.y+45+rand()*Math.max(1,r.h-90);
      if(!canPlace(x,y,78))continue;
      const roll=rand();const type=roll<.18?'pineLarge':roll<.34?'pineMedium':roll<.46?'pineSmall':roll<.62?'oakLarge':roll<.76?'oakMedium':'oakSmall';
      const [w,h,radius]=TREE_SIZES[type];decor.push({x,y,type,blocked:true,r:radius,w,h});break;
    }
  }

  // Scattered meadow trees connect the forest clusters to open grassland without turning the whole meadow into a forest.
  const meadows=(z.terrain?.regions||[]).filter(r=>r.type==='grass');
  for(let n=0;n<58;n++)for(let tries=0;tries<45;tries++){
    const r=meadows[Math.floor(rand()*Math.max(1,meadows.length))];
    if(!r)break;
    const x=r.x+45+rand()*Math.max(1,r.w-90),y=r.y+55+rand()*Math.max(1,r.h-110);
    if(!canPlace(x,y,105))continue;
    const roll=rand();
    const type=roll<.16?'pineSmall':roll<.36?'oakSmall':roll<.72?'oakMedium':'oakLarge';
    const [w,h,radius]=TREE_SIZES[type];decor.push({x,y,type,blocked:true,r:radius,w,h});break;
  }

  // Small grass is visual-only and never blocks movement.
  const grassTypes=Array.from({length:12},(_,i)=>`grass${String(i+1).padStart(2,'0')}`);
  for(let n=0;n<145;n++)for(let tries=0;tries<35;tries++){
    const x=70+rand()*(z.width-140),y=70+rand()*(z.height-140);
    if(terrainAt(state,x,y)!=='grass'||!canPlace(x,y,34))continue;
    const type=grassTypes[Math.floor(rand()*grassTypes.length)],scale=.48+rand()*.22;
    decor.push({x,y,type,blocked:false,r:0,w:128*scale,h:128*scale});break;
  }

  // Bushes are intentionally solid obstacles, matching the user's rule for bushes.
  for(let n=0;n<70;n++)for(let tries=0;tries<40;tries++){
    const x=80+rand()*(z.width-160),y=80+rand()*(z.height-160);
    if(terrainAt(state,x,y)!=='grass'||!canPlace(x,y,48))continue;
    const type=rand()<.18?'bushFlower':rand()<.42?'bushDark':rand()<.65?'bushLight':'bushMedium';
    const sizes={bushFlower:[58,60,22],bushDark:[58,64,22],bushLight:[64,62,23],bushMedium:[68,64,24]};
    const [w,h,radius]=sizes[type];decor.push({x,y,type,blocked:true,r:radius,w,h});break;
  }

  // Forest rocks are solid obstacles.
  for(let n=0;n<35;n++)for(let tries=0;tries<30;tries++){
    const x=40+rand()*(z.width-80),y=40+rand()*(z.height-80);
    if(terrainAt(state,x,y)==='forest'&&canPlace(x,y,55)){decor.push({x,y,type:'rock',blocked:true,r:24,w:50,h:45});break}
  }

  // Natural freshwater ecosystem: vegetation sits near the bank, while larger debris can block movement.
  const softTypes=RIVER_SOURCES.filter(o=>!o.blocked),hardTypes=RIVER_SOURCES.filter(o=>o.blocked);
  for(let n=0;n<72;n++)for(let tries=0;tries<45;tries++){
    const candidate=waterBankPoint(z,rand);
    if(!candidate||!nearWater(candidate.x,candidate.y,115)||waterAt(candidate.x,candidate.y)||!canPlace(candidate.x,candidate.y,38))continue;
    const source=(n%9===0&&hardTypes.length)?hardTypes[Math.floor(rand()*hardTypes.length)]:softTypes[Math.floor(rand()*softTypes.length)];
    const scale=.42+rand()*.26;
    decor.push({x:candidate.x,y:candidate.y,type:source.name,blocked:source.blocked,r:source.blocked?Math.round(18+scale*14):0,w:128*scale,h:128*scale,sourceIndex:source.index});
    break;
  }
  return decor;
}

function distToEllipse(x,y,w){const cx=w.x+w.w/2,cy=w.y+w.h/2;const dx=(x-cx)/(w.w/2),dy=(y-cy)/(w.h/2);return Math.abs(Math.sqrt(dx*dx+dy*dy)-1)*Math.min(w.w,w.h)/2}
function waterBankPoint(z,rand){
  const waters=(z.water||[]).filter(Boolean);if(!waters.length)return null;
  const w=waters[Math.floor(rand()*waters.length)];
  if(w.type==='river'){
    const pts=w.points;if(pts.length<2)return null;const i=Math.floor(rand()*(pts.length-1)),a=pts[i],b=pts[i+1],t=.15+rand()*.7;
    const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.max(1,Math.hypot(dx,dy));
    const side=rand()<.5?-1:1,offset=52+rand()*55;return{x:x+(-dy/len)*offset*side,y:y+(dx/len)*offset*side};
  }
  const ang=rand()*Math.PI*2,rx=w.w/2+55+rand()*45,ry=w.h/2+55+rand()*45;return{x:w.x+w.w/2+Math.cos(ang)*rx,y:w.y+w.h/2+Math.sin(ang)*ry};
}
