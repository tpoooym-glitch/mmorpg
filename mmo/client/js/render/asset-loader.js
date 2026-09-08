/**
 * Updated Asset Loader
 * - Load sprites and images
 * - Use actual asset filenames from repository
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

  // ตรงกับไฟล์ที่มีจริงในโฟลเดอร์
  const assetSets = [
    // Environment - มีจริง
    { name: 'oak-large', category: 'environment', ext: 'svg' },
    { name: 'pine-large', category: 'environment', ext: 'svg' },
    { name: 'rock-large', category: 'environment', ext: 'svg' },
    { name: 'trees-bushes-01', category: 'environment', ext: 'webp' },
    { name: 'trees-bushes-02', category: 'environment', ext: 'webp' },
    
    // Buildings - มีจริง
    { name: 'house-red', category: 'buildings', ext: 'svg' },
  ];

  let completed = 0;
  const total = assetSets.length;

  assetSets.forEach(({ name, category, ext }) => {
    const img = new Image();
    img.onerror = () => {
      assets.failed++;
      const error = `Failed to load ${category}/${name}.${ext}`;
      assets.errors.push(error);
      console.warn('[ASSETS]', error);
      completed++;
      if (completed === total) finishLoading();
    };
    img.onload = () => {
      assets.sprites.set(name, img);
      assets.loaded++;
      console.log(`[ASSETS] ✓ ${name}.${ext}`);
      completed++;
      if (completed === total) finishLoading();
    };
    img.src = `../assets/${category}/${name}.${ext}`;
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
 */
export const FALLBACK_SHAPES = {
  // Trees
  'oak-large': { type: 'rect', width: 40, height: 50, color: '#2a5a2a' },
  'pine-large': { type: 'triangle', size: 25, color: '#1a4a1a' },
  
  // Rocks
  'rock-large': { type: 'circle', size: 15, color: '#8a8a8a' },
  
  // Buildings
  'house-red': { type: 'rect', width: 60, height: 50, color: '#dd4444' },
  
  // Entities
  player: { type: 'circle', size: 15, color: '#0088ff' },
  warrior: { type: 'circle', size: 15, color: '#ff4444' },
  mage: { type: 'circle', size: 15, color: '#ff00ff' },
  rogue: { type: 'circle', size: 15, color: '#ffaa00' },
};
