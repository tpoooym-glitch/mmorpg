const sources={terrain:'assets/environment/ground-tileset.svg'};
const encodedSources={
  water:{count:1,prefix:'assets/environment/water-real/water.webp',suffix:'.b64'},
  nature:{count:1,prefix:'assets/environment/nature-real/nature.webp',suffix:'.b64'},
  riverDecor:{count:1,prefix:'assets/environment/river-real/river.webp',suffix:'.b64'},
  shore:{count:1,prefix:'assets/environment/water-real/shore.webp',suffix:'.b64'},
  grassDecor:{count:2,prefix:'assets/environment/grass-decor/grass-',suffix:'.b64'}
};
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Asset failed: '+src));image.src=src})}
async function loadEncodedImage(spec){const chunks=await Promise.all(Array.from({length:spec.count},(_,i)=>fetch(`${spec.prefix}${String(i).padStart(2,'0')}${spec.suffix}`).then(r=>{if(!r.ok)throw new Error(`Asset chunk failed: ${r.status}`);return r.text()})));return loadImage(`data:image/webp;base64,${chunks.join('')}`)}
export function loadAssets(){const assets={};const pending=[];for(const [name,src] of Object.entries(sources)){pending.push(loadImage(src).then(image=>{assets[name]=image}).catch(error=>{assets[name]=null;console.warn(error.message)}))}for(const [name,spec] of Object.entries(encodedSources)){pending.push(loadEncodedImage(spec).then(image=>{assets[name]=image}).catch(error=>{assets[name]=null;console.warn(`Asset ${name} failed: ${error.message}`)}))}return{assets,ready:Promise.all(pending)}}
