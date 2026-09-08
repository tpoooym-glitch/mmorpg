export function drawSprite(ctx,image,x,y,w,h){if(!image?.complete||!image.naturalWidth)return false;ctx.drawImage(image,x-w/2,y-h/2,w,h);return true}
export function drawPlaceholder(ctx,x,y,w,h){ctx.beginPath();ctx.arc(x,y,Math.min(w,h)/3,0,Math.PI*2);ctx.fill()}
