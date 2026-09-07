const canvas=document.querySelector('#game');
const ctx=canvas.getContext('2d');
const keys={};
const player={x:550,y:340,speed:180,hp:100,maxHp:100,mp:50,maxMp:50,gold:100,xp:0,level:1,name:'Adventurer',class:'Warrior'};
const world={width:3600,height:2400};
const zones=[
 {name:'Arelia Town',x:0,y:0,w:900,h:800},
 {name:'Emerald Meadow',x:900,y:0,w:900,h:800},
 {name:'Murk Swamp',x:1800,y:0,w:900,h:800},
 {name:'Golden Desert',x:2700,y:0,w:900,h:800},
 {name:'Ancient Ruins',x:0,y:800,w:900,h:800},
 {name:'Frostpeak',x:900,y:800,w:900,h:800},
 {name:'Shadow Dungeon',x:1800,y:800,w:900,h:800},
 {name:'Ember Crater',x:2700,y:800,w:900,h:800},
 {name:'Royal Castle',x:0,y:1600,w:900,h:800},
 {name:'Dragon Valley',x:900,y:1600,w:900,h:800},
 {name:'Moonlight Forest',x:1800,y:1600,w:900,h:800},
 {name:'Kingdom Frontier',x:2700,y:1600,w:900,h:800}
];
let mobs=[];
for(let i=0;i<45;i++)mobs.push({x:Math.random()*world.width,y:Math.random()*world.height,r:14,hp:30+Math.random()*40});
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')attack();});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function zone(){return zones.find(z=>player.x>=z.x&&player.x<z.x+z.w&&player.y>=z.y&&player.y<z.y+z.h)||zones[0]}
function attack(){for(const m of mobs){if(m.hp>0&&Math.hypot(m.x-player.x,m.y-player.y)<75){m.hp-=20;if(m.hp<=0){player.xp+=20;player.gold+=5;if(player.xp>=100){player.xp-=100;player.level++;player.maxHp+=10;player.hp=player.maxHp}}}}}
function update(dt){let dx=0,dy=0;if(keys.w||keys.arrowup)dy--;if(keys.s||keys.arrowdown)dy++;if(keys.a||keys.arrowleft)dx--;if(keys.d||keys.arrowright)dx++;if(dx&&dy){dx*=.707;dy*=.707}player.x=Math.max(16,Math.min(world.width-16,player.x+dx*player.speed*dt));player.y=Math.max(16,Math.min(world.height-16,player.y+dy*player.speed*dt));}
function draw(){const camX=Math.max(0,Math.min(world.width-canvas.width,player.x-canvas.width/2));const camY=Math.max(0,Math.min(world.height-canvas.height,player.y-canvas.height/2));ctx.fillStyle='#315c4a';ctx.fillRect(0,0,canvas.width,canvas.height);for(const z of zones){ctx.fillStyle=['#667085','#2d6a4f','#315c4a','#b8944e','#59636e','#9fb9c7','#342b43','#702929','#444b63','#45613c','#254d3b','#53657a'][zones.indexOf(z)];ctx.fillRect(z.x-camX,z.y-camY,z.w,z.h);ctx.strokeStyle='#ffffff44';ctx.strokeRect(z.x-camX,z.y-camY,z.w,z.h);ctx.fillStyle='#ffffffaa';ctx.font='bold 16px system-ui';ctx.fillText(z.name,z.x-camX+14,z.y-camY+24)}for(const m of mobs){if(m.hp<=0)continue;ctx.fillStyle='#8abf45';ctx.beginPath();ctx.arc(m.x-camX,m.y-camY,m.r,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#fca5a5';ctx.beginPath();ctx.arc(player.x-camX,player.y-camY,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.stroke();ctx.fillStyle='#fff';ctx.font='12px system-ui';ctx.fillText(player.name,player.x-camX-35,player.y-camY-22)}
function ui(){document.querySelector('#character').textContent=`${player.name} · ${player.class} · Lv.${player.level}`;document.querySelector('#hp').textContent=`${Math.max(0,Math.round(player.hp))}/${player.maxHp}`;document.querySelector('#mp').textContent=`${player.mp}/${player.maxMp}`;document.querySelector('#gold').textContent=player.gold;document.querySelector('#xp').textContent=`${player.xp}/100`;document.querySelector('#hpbar').style.width=(player.hp/player.maxHp*100)+'%';document.querySelector('#mpbar').style.width=(player.mp/player.maxMp*100)+'%';}
let last=performance.now();function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;update(dt);draw();ui();requestAnimationFrame(loop)}requestAnimationFrame(loop);
