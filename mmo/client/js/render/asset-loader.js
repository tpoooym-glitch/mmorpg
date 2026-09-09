const sources={
  terrain:'assets/environment/ground-tileset.svg',
  water:'assets/environment/water-tileset.svg',
  nature:'assets/environment/trees-bushes-02.webp',
  rock:'assets/environment/rock-large.svg'
};
const encodedSources={
  grassDecor:{count:2,prefix:'assets/environment/grass-decor/grass-',suffix:'.b64'},
  riverDecor:{count:4,prefix:'assets/environment/river-decor/river-',suffix:'.b64'},
  shore:{count:1,prefix:'assets/environment/river-shore/shore-',suffix:'.b64'}
};
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Asset failed: '+src));image.src=src})}
async function loadEncodedImage(spec){const chunks=await Promise.all(Array.from({length:spec.count},(_,i)=>fetch(`${spec.prefix}${String(i).padStart(2,'0')}${spec.suffix}`).then(r=>{if(!r.ok)throw new Error(`Asset chunk failed: ${r.status}`);return r.text()})));return loadImage(`data:image/webp;base64,${chunks.join('')}`)}
function cleanNatureSheet(image){const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height);for(let i=0;i<data.data.length;i+=4){const r=data.data[i],g=data.data[i+1],b=data.data[i+2];const gray=Math.max(r,g,b)-Math.min(r,g,b);if(gray<14&&r>85)data.data[i+3]=0}ctx.putImageData(data,0,0);return c}
export function loadAssets(){const assets={};const pending=[];for(const [name,src] of Object.entries(sources)){pending.push(loadImage(src).then(image=>{assets[name]=name==='nature'?cleanNatureSheet(image):image}).catch(error=>{assets[name]=null;console.warn(error.message)}))}for(const [name,spec] of Object.entries(encodedSources)){pending.push(loadEncodedImage(spec).then(image=>{assets[name]=image}).catch(error=>{assets[name]=null;console.warn(`Asset ${name} failed: ${error.message}`)}))}return{assets,ready:Promise.all(pending)}}
