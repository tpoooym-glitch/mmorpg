import {state} from './core/state.js';
import {createInput} from './input/input-manager.js';
import {loadZone} from './world/map-loader.js';
import {generateDecor} from './world/decor-generator.js';
import {createMobs} from './entities/mob-factory.js';
import {move} from './systems/movement-system.js';
import {attack} from './systems/combat-system.js';
import {loadAssets} from './render/asset-loader.js';
import {drawScene} from './render/canvas-renderer.js';
import {updateHud} from './ui/hud.js';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const input=createInput(()=>attack(state));
const {assets,ready}=loadAssets();
let last=performance.now();
async function start(){const loaded=await loadZone();state.zone=loaded.zone;state.error=loaded.error;state.player.x=state.zone.spawn.x;state.player.y=state.zone.spawn.y;state.decor=generateDecor(state);state.mobs=createMobs();await ready;requestAnimationFrame(loop)}
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;move(state,input.keys,dt);drawScene(ctx,state,assets);updateHud(state);requestAnimationFrame(loop)}
start();