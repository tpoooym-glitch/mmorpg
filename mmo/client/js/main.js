const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const keys = {};

const player = {
  x: 1600, y: 1180, radius: 15, baseSpeed: 180,
  hp: 100, maxHp: 100, mp: 50, maxMp: 50,
  gold: 100, xp: 0, level: 1, name: 'Adventurer', class: 'Warrior'
};

let zone = null;
let mobs = [];
let camera = { x: 0, y: 0 };
let loadError = '';

const assets = { oak: new Image(), pine: new Image(), rock: new Image() };
assets.oak.src = '../assets/forest/oak-large.webp';
assets.pine.src = '../assets/forest/pine-large.webp';
assets.rock.src = '../assets/forest/rock-large.webp';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distance = (a, b, c, d) => Math.hypot(a - c, b - d);

async function loadZone() {
  try {
    const response = await fetch('../../maps/emerald-vales.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    zone = await response.json();
    player.x = zone.spawn.x; player.y = zone.spawn.y; createMobs();
  } catch (error) {
    loadError = `Unable to load Emerald Vales: ${error.message}`;
    zone = { name:'Emerald Vales', width:3200, height:2400, spawn:{x:1600,y:1180}, terrain:{base:'grass',regions:[]}, water:[], roads:[], bridges:[], structures:[], resources:[], collision:{default:'walkable'}, movement:{grassMultiplier:1,forestMultiplier:.85,swampMultiplier:.65,waterMultiplier:.45,roadMultiplier:1.15,bridgeMultiplier:1} };
    createMobs();
  }
}
function createMobs(){
  const spots=[[420,520],[680,840],[900,520],[1120,1450],[1380,1560],[1900,760],[2140,1380],[2480,720],[2720,1460],[2900,1720],[560,1820],[820,2040],[2200,2020],[2700,2120]];
  mobs=spots.map((p,i)=>({x:p[0],y:p[1],r:16,hp:40,maxHp:40,type:i%3===0?'Slime':i%3===1?'Forest Boar':'Greenling'}));
}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' '){e.preventDefault();attack();}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
function pointInRect(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
function pointNearSegment(px,py,ax,ay,bx,by,radius){const abx=bx-ax,aby=by-ay,len2=abx*abx+aby*aby||1,t=clamp(((px-ax)*abx+(py-ay)*aby)/len2,0,1);return distance(px,py,ax+t*abx,ay+t*aby)<=radius;}
function nearPolyline(x,y,points,radius){for(let i=1;i<points.length;i++)if(pointNearSegment(x,y,points[i-1][0],points[i-1][1],points[i][0],points[i][1],radius))return true;return false;}
function isBridge(x,y){return(zone.bridges||[]).some(b=>pointInRect(x,y,b));}
function terrainAt(x,y){if(!zone)return'grass';if(isBridge(x,y))return'bridge';if((zone.water||[]).some(w=>w.type==='pond'&&pointInRect(x,y,w)))return'water';if((zone.water||[]).some(w=>w.type==='river'&&nearPolyline(x,y,w.points,42)))return'water';if((zone.roads||[]).some(r=>nearPolyline(x,y,r.points,34)))return'road';const regions=zone.terrain?.regions||[];for(let i=regions.length-1;i>=0;i--)if(pointInRect(x,y,regions[i]))return regions[i].type;return zone.terrain?.base||'grass';}
function movementMultiplier(type){return zone?.movement?.[`${type}Multiplier`]??1;}
function blockedAt(x,y){if(!zone)return true;if(x<player.radius||y<player.radius||x>zone.width-player.radius||y>zone.height-player.radius)return true;if(isBridge(x,y))return false;for(const s of zone.structures||[]){const pad=16;if(pointInRect(x,y,{x:s.x-pad,y:s.y-pad,w:s.w+pad*2,h:s.h+pad*2}))return true;}return false;}
function movePlayer(dx,dy,dt){const speed=player.baseSpeed*movementMultiplier(terrainAt(player.x,player.y)),nx=player.x+dx*speed*dt,ny=player.y+dy*speed*dt;if(!blockedAt(nx,player.y))player.x=nx;if(!blockedAt(player.x,ny))player.y=ny;}
function attack(){for(const mob of mobs)if(mob.hp>0&&distance(mob.x,mob.y,player.x,player.y)<78){mob.hp-=20;if(mob.hp<=0){player.xp+=20;player.gold+=5;if(player.xp>=100){player.xp-=100;player.level++;player.maxHp+=10;player.hp=player.maxHp;}}}}
function update(dt){if(!zone)return;let dx=0,dy=0;if(keys.w||keys.arrowup)dy--;if(keys.s||keys.arrowdown)dy++;if(keys.a||keys.arrowleft)dx--;if(keys.d||keys.arrowright)dx++;if(dx&&dy){dx*=.707;dy*=.707;}movePlayer(dx,dy,dt);}
function worldToScreen(x,y){return[x-camera.x,y-camera.y];}
function drawPolyline(points,width,outer,inner){if(!points?.length)return;ctx.beginPath();points.forEach((p,i)=>{const[x,y]=worldToScreen(p[0],p[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=width;ctx.strokeStyle=outer;ctx.stroke();ctx.lineWidth=width-14;ctx.strokeStyle=inner;ctx.stroke();}
function drawForestSprites(){const placements=[[300,300,'oak',130,150],[720,500,'pine',95,145],[1080,390,'oak',115,135],[1260,1780,'pine',90,140],[1550,720,'oak',120,145],[1840,470,'pine',100,150],[2260,560,'oak',125,145],[2600,850,'pine',95,145],[560,1450,'oak',120,145],[940,1680,'pine',95,145],[1980,1800,'oak',120,145],[2760,1920,'pine',100,150],[360,900,'rock',48,42],[820,1200,'rock',42,38],[1740,420,'rock',45,40],[2380,1280,'rock',48,42],[2920,1100,'rock',44,40]];for(const[x,y,type,w,h]of placements){if(terrainAt(x,y)!=='forest')continue;const img=assets[type];if(!img.complete||!img.naturalWidth)continue;const[sx,sy]=worldToScreen(x,y);if(sx<-w||sy<-h||sx>canvas.width+w||sy>canvas.height+h)continue;ctx.drawImage(img,sx-w/2,sy-h,w,h);}}
function drawStructures(){for(const s of zone.structures||[]){const[x,y]=worldToScreen(s.x,s.y);ctx.fillStyle='#8b5a3c';ctx.fillRect(x,y,s.w,s.h);ctx.fillStyle='#c98955';ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+s.w/2,y-48);ctx.lineTo(x+s.w+10,y);ctx.closePath();ctx.fill();ctx.fillStyle='#f1d39b';ctx.fillRect(x+s.w*.42,y+s.h*.45,s.w*.16,s.h*.55);}}
function drawResources(){for(const r of zone.resources||[]){const[x,y]=worldToScreen(r.x,r.y);ctx.fillStyle=r.type==='ore'?'#9aa1aa':'#72a84b';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();}}
function draw(){if(!zone){ctx.fillStyle='#17252a';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.font='18px system-ui';ctx.fillText('Loading Emerald Vales…',30,40);return;}camera.x=clamp(player.x-canvas.width/2,0,Math.max(0,zone.width-canvas.width));camera.y=clamp(player.y-canvas.height/2,0,Math.max(0,zone.height-canvas.height));ctx.fillStyle='#79a84a';ctx.fillRect(0,0,canvas.width,canvas.height);const colors={grass:'#79a84a',forest:'#3f713e',swamp:'#607b52',desert:'#c5a65c',snow:'#d9e5df',volcano:'#754d3f',mountain:'#65705e'};for(const r of zone.terrain?.regions||[]){const[x,y]=worldToScreen(r.x,r.y);ctx.fillStyle=colors[r.type]||'#79a84a';ctx.fillRect(x,y,r.w,r.h);}for(const w of zone.water||[]){if(w.type==='river')drawPolyline(w.points,94,'#356b75','#5da9b7');else{const[x,y]=worldToScreen(w.x,w.y);ctx.fillStyle='#5da9b7';ctx.beginPath();ctx.ellipse(x+w.w/2,y+w.h/2,w.w/2,w.h/2,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9bd4dc';ctx.lineWidth=4;ctx.stroke();}}for(const r of zone.roads||[])drawPolyline(r.points,64,'#b88752','#d6a66c');for(const b of zone.bridges||[]){const[x,y]=worldToScreen(b.x,b.y);ctx.fillStyle='#795548';ctx.fillRect(x,y,b.w,b.h);ctx.strokeStyle='#d4a373';ctx.lineWidth=5;ctx.strokeRect(x,y,b.w,b.h);}drawForestSprites();drawResources();drawStructures();for(const mob of mobs){if(mob.hp<=0)continue;const[x,y]=worldToScreen(mob.x,mob.y);if(x<-30||y<-30||x>canvas.width+30||y>canvas.height+30)continue;ctx.fillStyle='#86b84d';ctx.beginPath();ctx.arc(x,y,mob.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1f2937';ctx.fillRect(x-15,y-25,30,4);ctx.fillStyle='#ef4444';ctx.fillRect(x-15,y-25,30*(mob.hp/mob.maxHp),4);}const[px,py]=worldToScreen(player.x,player.y);ctx.fillStyle='#f4c2a1';ctx.beginPath();ctx.arc(px,py,player.radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='12px system-ui';ctx.fillText(player.name,px-35,py-24);ctx.font='bold 18px system-ui';ctx.fillText(zone.name,18,28);if(loadError){ctx.fillStyle='#ffdddd';ctx.font='12px system-ui';ctx.fillText(loadError,18,48);}}
function ui(){document.querySelector('#character').textContent=`${player.name} · ${player.class} · Lv.${player.level}`;document.querySelector('#hp').textContent=`${Math.max(0,Math.round(player.hp))}/${player.maxHp}`;document.querySelector('#mp').textContent=`${player.mp}/${player.maxMp}`;document.querySelector('#gold').textContent=player.gold;document.querySelector('#xp').textContent=`${player.xp}/100`;document.querySelector('#hpbar').style.width=`${player.hp/player.maxHp*100}%`;document.querySelector('#mpbar').style.width=`${player.mp/player.maxMp*100}%`;}
let last=performance.now();function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;update(dt);draw();ui();requestAnimationFrame(loop);}loadZone();requestAnimationFrame(loop);
