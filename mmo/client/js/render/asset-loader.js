const sources={terrain:'assets/environment/ground-tileset.svg'};
const encodedSources={
  water:{files:['assets/environment/water-real/water.webp.b64']},
  oakLarge:{files:['assets/environment/nature-real/oak-large.webp.b64']},
  oakMedium:{files:['assets/environment/nature-real/oak-medium.webp.b64']},
  pineLarge:{files:['assets/environment/nature-real/pine-large.webp.b64']},
  riverDecor:{files:['assets/environment/river-real/river.webp.b64']},
  shore:{files:['assets/environment/water-real/shore.webp.b64']},
  grassDecor:{files:['assets/environment/grass-decor/grass-00.b64','assets/environment/grass-decor/grass-01.b64']}
};
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Asset failed: '+src));image.src=src})}
async function loadEncodedImage(spec){const files=spec.files||[];const chunks=await Promise.all(files.map(src=>fetch(src).then(r=>{if(!r.ok)throw new Error(`Asset chunk failed: ${r.status} ${src}`);return r.text()})));return loadImage(`data:image/webp;base64,${chunks.join('')}`)}
export function loadAssets(){const assets={};const pending=[];for(const [name,src] of Object.entries(sources)){pending.push(loadImage(src).then(image=>{assets[name]=image}).catch(error=>{assets[name]=null;console.warn(error.message)}))}for(const [name,spec] of Object.entries(encodedSources)){pending.push(loadEncodedImage(spec).then(image=>{assets[name]=image}).catch(error=>{assets[name]=null;console.warn(`Asset ${name} failed: ${error.message}`)}))}return{assets,ready:Promise.all(pending)}}
