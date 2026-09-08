/**
 * Updated Asset Loader
 * - Load sprites and images
 * - Fallback to shapes if missing
 * - Track loading errors
 */

const assets = {
  sprites: new Map(),
  errors: [],
  loaded: 0,
  failed: 0
};

let readyPromise = null;
let readyResolve = null;

export function loadAssets() {
  readyPromise = new Promise(resolve => {
    readyResolve = resolve;
  });

  const assetSets = [
    { name: 'player', category: 'entities' },
    { name: 'warrior', category: 'entities' },
    { name: 'mage', category: 'entities' },
    { name: 'rogue', category: 'entities' },
    { name: 'goblin', category: 'mobs' },
    { name: 'orc', category: 'mobs' },
    { name: 'grass', category: 'terrain' },
    { name: 'forest', category: 'terrain' },
    { name: 'water', category: 'terrain' },
    { name: 'house', category: 'buildings' },
    { name: 'shop', category: 'buildings' },
    { name: 'tree', category: 'environment' },
    { name: 'rock', category: 'environment' },
    { name: 'bridge', category: 'structures' }
  ];

  let completed = 0;
  const total = assetSets.length;

  assetSets.forEach(({ name, category }) => {
    const img = new Image();
    img.onerror = () => {
      assets.failed++;
      const error = `Failed to load ${category}/${name}.svg`;
      assets.errors.push(error);
      console.warn('[ASSETS]', error);
      completed++;
      if (completed === total) finishLoading();
    };
    img.onload = () => {
      assets.sprites.set(name, img);
      assets.loaded++;
      completed++;
      if (completed === total) finishLoading();
    };
    img.src = `../assets/${category}/${name}.svg`;
  });

  return { assets, ready: readyPromise };
}

function finishLoading() {
  console.log(`[ASSETS] Loading complete: ${assets.loaded} loaded, ${assets.failed} failed`);
  if (assets.errors.length > 0) {
    console.warn('[ASSETS] Errors:', assets.errors);
  }
  readyResolve();
}

export function getSprite(name) {
  return assets.sprites.get(name) || null;
}

export function hasSprite(name) {
  return assets.sprites.has(name);
}

export function getAssetErrors() {
  return [...assets.errors];
}

export function getAssetStats() {
  return {
    loaded: assets.loaded,
    failed: assets.failed,
    total: assets.loaded + assets.failed,
    errors: assets.errors
  };
}

/**
 * Fallback shape rendering ถ้าไม่มี sprite
 * (จะใช้ใน canvas-renderer.js)
 */
export const FALLBACK_SHAPES = {
  player: { type: 'circle', size: 15, color: '#0088ff' },
  warrior: { type: 'circle', size: 15, color: '#ff4444' },
  mage: { type: 'circle', size: 15, color: '#ff00ff' },
  rogue: { type: 'circle', size: 15, color: '#ffaa00' },
  goblin: { type: 'triangle', size: 12, color: '#00ff00' },
  orc: { type: 'triangle', size: 20, color: '#00aa00' },
  tree: { type: 'rect', width: 30, height: 40, color: '#228822' },
  house: { type: 'rect', width: 60, height: 50, color: '#8844aa' },
  shop: { type: 'rect', width: 50, height: 50, color: '#dd8844' }
};
