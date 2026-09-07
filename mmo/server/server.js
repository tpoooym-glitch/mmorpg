import http from 'http';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';
const PORT=process.env.PORT||8080;
const players=new Map();
const httpServer=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});res.end('Arelia Online server is running.');});
const wss=new WebSocketServer({server:httpServer});
function snapshot(){return Object.fromEntries([...players].map(([id,p])=>[id,{id,name:p.name,class:p.class,x:p.x,y:p.y}]));}
function broadcast(message){const data=JSON.stringify(message);for(const p of players.values())if(p.ws.readyState===1)p.ws.send(data);}
wss.on('connection',ws=>{const id=crypto.randomUUID();const p={id,ws,name:'Adventurer',class:'Warrior',x:550,y:340};players.set(id,p);ws.send(JSON.stringify({type:'welcome',id,players:snapshot()}));broadcast({type:'players',players:snapshot()});ws.on('message',raw=>{try{const m=JSON.parse(raw);if(m.type==='join'){p.name=String(m.name||'Adventurer').slice(0,18);p.class=String(m.class||'Warrior');}if(m.type==='state'){p.x=Number(m.x)||p.x;p.y=Number(m.y)||p.y;}if(m.type==='chat'){broadcast({type:'chat',name:p.name,text:String(m.text||'').slice(0,120)});}if(m.type==='join'||m.type==='state')broadcast({type:'players',players:snapshot()});}catch{}});ws.on('close',()=>{players.delete(id);broadcast({type:'players',players:snapshot()});});});
httpServer.listen(PORT,()=>console.log(`Arelia Online server listening on ${PORT}`));
