import {state} from './core/state.js';
import {createInput} from './input/input-manager.js';
import {loadZone} from './world/map-loader.js';
import {generateDecor} from './world/decor-generator.js';
import {createMobs} from './entities/mob-factory.js';
import {move} from './systems/movement-system.js';
import {attack,useSkill,updateCombat} from './systems/combat-system.js';
import {loadAssets} from './render/asset-loader.js';
import {drawScene} from './render/canvas-renderer.js';
import {drawStructures} from './render/structure-renderer.js';
import {updateHud} from './ui/hud.js';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const debugToggle=document.querySelector('#debug-toggle');
const input=createInput(()=>attack(state),id=>useSkill(state,id));
debugToggle?.addEventListener('click',()=>{state.debug.hitboxes=!state.debug.hitboxes;debugToggle.setAttribute('aria-pressed',String(state.debug.hitboxes));debugToggle.textContent=state.debug.hitboxes?'DEBUG ON':'DEBUG'});
const {assets,ready}=loadAssets();
let last=performance.now();
async function loadSkills(){const response=await fetch('../data/skills.json');if(!response.ok)throw new Error(`Skill data failed: ${response.status}`);state.player.skillsData=await response.json()}
async function start(){const loaded=await loadZone();state.zone=loaded.zone;state.error=loaded.error;state.player.x=state.zone.spawn.x;state.player.y=state.zone.spawn.y;state.player.spawnX=state.zone.spawn.x;state.player.spawnY=state.zone.spawn.y;state.decor=generateDecor(state);state.mobs=createMobs();await loadSkills();requestAnimationFrame(loop);ready.catch(error=>{state.error=`Asset startup failed: ${error?.message||error}`;console.error(error)})}
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;move(state,input.keys,dt);updateCombat(state,dt);drawScene(ctx,state,assets);drawStructures(ctx,state);updateHud(state);requestAnimationFrame(loop)}
start().catch(error=>{state.error=`Startup failed: ${error?.message||error}`;console.error(error);if(state.zone)requestAnimationFrame(loop)});
