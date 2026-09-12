import {state} from './core/state.js';
import {createInput} from './input/input-manager.js';
import {loadZone} from './world/map-loader.js';
import {generateDecor} from './world/decor-generator.js';
import {createMobs} from './entities/mob-factory.js?v=20260912-3';
import {move} from './systems/movement-system.js';
import {attack,useSkill,updateCombat} from './systems/combat-system.js';
import {loadAssets} from './render/asset-loader.js';
import {drawScene} from './render/canvas-renderer.js';
import {drawStructures} from './render/structure-renderer.js?v=20260912-3';
import {drawRoadOverlay} from './render/road-overlay.js?v=20260912-3';
import {drawActorsOverlay} from './render/actor-overlay.js?v=20260912-3';
import {drawVillageDecor} from './render/village-decor-overlay.js?v=20260912-3';
import {updateHud} from './ui/hud.js';
const canvas=document.querySelector('#game');
const ctx=canvas?.getContext('2d');
const debugToggle=document.querySelector('#debug-toggle');
const input=createInput(()=>attack(state),id=>useSkill(state,id));
debugToggle?.addEventListener('click',()=>{state.debug.hitboxes=!state.debug.hitboxes;debugToggle.setAttribute('aria-pressed',String(state.debug.hitboxes));debugToggle.textContent=state.debug.hitboxes?'DEBUG ON':'DEBUG'});
const {assets,ready}=loadAssets();
let last=performance.now();
function updateCamera(){const z=state.zone;if(!z)return;state.cam.x=Math.max(0,Math.min(z.width-canvas.width,state.player.x-canvas.width/2));state.cam.y=Math.max(0,Math.min(z.height-canvas.height,state.player.y-canvas.height/2))}
async function loadSkills(){const response=await fetch('../data/skills.json');if(!response.ok)throw new Error(`Skill data failed: ${response.status}`);state.player.skillsData=await response.json()}
function renderFallback(message){if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#6fa84a';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.font='bold 18px system-ui';ctx.fillText('Arelia Online',18,28);if(message){ctx.font='13px system-ui';ctx.fillText(message,18,52)}}
async function start(){if(!canvas||!ctx)throw new Error('Game canvas unavailable');const loaded=await loadZone();state.zone=loaded.zone;state.error=loaded.error;state.player.x=state.zone.spawn.x;state.player.y=state.zone.spawn.y;state.player.spawnX=state.zone.spawn.x;state.player.spawnY=state.zone.spawn.y;state.assets=assets;updateCamera();state.decor=generateDecor(state);state.mobs=createMobs();await loadSkills();requestAnimationFrame(loop);ready.catch(error=>{state.error=`Asset startup failed: ${error?.message||error}`;console.error(error)})}
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;try{move(state,input.keys,dt);updateCombat(state,dt);updateCamera();drawScene(ctx,state,assets);drawRoadOverlay(ctx,state);drawStructures(ctx,state);drawVillageDecor(ctx,state);drawActorsOverlay(ctx,state,assets);updateHud(state)}catch(error){state.error=`Render error: ${error?.message||error}`;console.error(error);renderFallback(state.error)}requestAnimationFrame(loop)}
start().catch(error=>{state.error=`Startup failed: ${error?.message||error}`;console.error(error);renderFallback(state.error);requestAnimationFrame(loop)});
