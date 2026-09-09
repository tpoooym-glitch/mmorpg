const defs={
  Slime:{level:1,hp:40,attack:6,defense:2,speed:55,aggroRange:180,attackRange:30,respawnMs:15000,gold:[2,6],exp:12,color:'#78c850'},
  'Forest Boar':{level:2,hp:65,attack:10,defense:4,speed:70,aggroRange:220,attackRange:34,respawnMs:20000,gold:[4,10],exp:20,color:'#a66a3f'}
};
const positions=[[420,520],[680,840],[900,520],[1120,1450],[1380,1560],[1900,760],[2140,1380],[2480,720],[2720,1460],[2900,1720]];
export function createMobs(){return positions.map((p,i)=>{const type=i%2?'Forest Boar':'Slime',d=defs[type];return{id:`mob-${i+1}`,x:p[0],y:p[1],spawnX:p[0],spawnY:p[1],r:16,type,...d,alive:true,respawnAt:0,attackCooldown:0}})}
export {defs as mobDefinitions};
