const defs={
  Slime:{level:1,hp:40,attack:6,defense:2,speed:55,aggroRange:180,attackRange:30,respawnMs:15000,gold:[2,6],exp:12,color:'#78c850'},
  'Forest Boar':{level:2,hp:65,attack:10,defense:4,speed:70,aggroRange:220,attackRange:34,respawnMs:20000,gold:[4,10],exp:20,color:'#a66a3f'},
  'Forest Champion':{level:5,hp:260,attack:24,defense:8,speed:48,aggroRange:360,attackRange:48,respawnMs:45000,gold:[35,60],exp:90,color:'#8b5cf6',questTarget:'forest-champion',questType:'boss',boss:true},
  'Elite Boar':{level:4,hp:180,attack:20,defense:7,speed:62,aggroRange:320,attackRange:42,respawnMs:35000,gold:[25,45],exp:65,color:'#b45309',questTarget:'elite-boar',questType:'boss',boss:true}
};
const positions=[[700,520],[1200,820],[1800,420],[2500,700],[3200,500],[4000,780],[4800,520],[5450,900],[1100,1150],[4300,1100],[1500,850],[5000,1050]];
export function createMobs(){const normal=positions.map((p,i)=>{const type=i%2?'Forest Boar':'Slime',d=defs[type];return{id:`mob-${i+1}`,x:p[0],y:p[1],spawnX:p[0],spawnY:p[1],r:16,type,...d,alive:true,respawnAt:0,attackCooldown:0}});return[...normal,{id:'forest-champion',x:5400,y:700,spawnX:5400,spawnY:700,r:30,type:'Forest Champion',...defs['Forest Champion'],alive:true,respawnAt:0,attackCooldown:0},{id:'elite-boar',x:4700,y:1100,spawnX:4700,spawnY:1100,r:25,type:'Elite Boar',...defs['Elite Boar'],alive:true,respawnAt:0,attackCooldown:0}]}
export {defs as mobDefinitions};
