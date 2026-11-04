// /tests/ui/accent-contrast-0531.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {contrastInk,ACCENTS}=require('../../src/ui/theme/theme.cjs');
const lum=hex=>{
 const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return .2126*v[0]+.7152*v[1]+.0722*v[2];
};
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('chosen foreground reaches WCAG AA on all ten theme accents and both default themes',()=>{
 for(const color of [...ACCENTS.map(v=>v.hex),'#C24328','#FF7A55']){
  const ink=contrastInk(color);
  assert.ok(contrast(color,ink)>=4.5,`${color} / ${ink} did not reach 4.5:1`);
 }
});
