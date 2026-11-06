// /src/ui/theme/iconPalette.cjs
'use strict';
const {findAccent}=require('./themePalette.cjs');
const blend=(a,b)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*0.76+parseInt(b.slice(i,i+2),16)*0.24).toString(16).padStart(2,'0')).join('').toUpperCase();
function iconPalette(accent,mode){
 const a=findAccent(accent);
 if(mode==='light')return {ink:a.lightPrimary,background:[a.lightBackground,blend(a.lightBackground,a.darkCard)]};
 if(mode==='amoled')return {ink:a.darkPrimary,background:['#000000',a.darkBackground]};
 return {ink:a.darkPrimary,background:[a.darkBackground,a.darkCard]};
}
module.exports={iconPalette};
