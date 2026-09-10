const sources={terrain:'assets/environment/ground-tileset.svg',rock:'assets/environment/rock-large.svg'};
const encodedSources={
  waterFill:{path:'assets/environment/water-real/water-fill.webp.b64'},
  waterAtlas:{path:'assets/environment/water-real/water-atlas.webp.b64'},
  water:{path:'assets/environment/water-real/water-fill.webp.b64'},
  shore:{path:'assets/environment/water-real/shore.webp.b64'},
  riverDecor:{path:'assets/environment/river-real/river.webp.b64'},
  nature:{path:'assets/environment/nature-fixed/nature-00.b64'},
  oakLarge:{path:'assets/environment/nature-real/oak-large.webp.b64'},
  oakMedium:{path:'assets/environment/nature-real/oak-medium.webp.b64'},
  pineLarge:{path:'assets/environment/nature-real/pine-large.webp.b64'},
  grassDecor:{files:['assets/environment/grass-decor/grass-00.b64','assets/environment/grass-decor/grass-01.b64']}
};
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Asset failed: '+src));image.src=src})}
async function loadEncodedImage(spec){const files=spec.files||[spec.path];let text='';for(const src of files){const response=await fetch(src);if(!response.ok)throw new Error(`Asset chunk failed: ${response.status} ${src}`);text+=(await response.text()).trim()}return loadImage(`data:image/webp;base64,${text}`)}
export function loadAssets(){const assets={};const pending=[];for(const [name,src] of Object.entries(sources)){pending.push(loadImage(src).then(image=>{assets[name]=image}).catch(error=>{assets[name]=null;console.warn(error.message)}))}for(const [name,spec] of Object.entries(encodedSources)){pending.push(loadEncodedImage(spec).then(image=>{assets[name]=image}).catch(error=>{assets[name]=null;console.warn(`Asset ${name} failed: ${error.message}`)}))}return{assets,ready:Promise.all(pending)}}
