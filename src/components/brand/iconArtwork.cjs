// /src/components/brand/iconArtwork.cjs
'use strict';
const {iconPalette}=require('../../ui/theme/iconPalette.cjs');
const {outlines,windows}=require('./morphGeometry.cjs');
function iconSvg(accent,mode,{size=1024,layer='complete',ink}={}){
 const colors=iconPalette(accent,mode),[start,end]=colors.background;
 const background=layer==='foreground'?'':`<defs><linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#background)"/>`;
 const logo=layer==='background'?'':`<g transform="translate(184.32 184.32) scale(2.56)" fill="${ink||colors.ink}" fill-rule="evenodd">${outlines.map((d,i)=>`<path d="${d} ${windows[i].join(' ')}"/>`).join('')}</g>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${background}${logo}</svg>`;
}
module.exports={iconSvg};
