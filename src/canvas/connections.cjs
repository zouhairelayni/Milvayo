// /src/canvas/connections.cjs
'use strict';
const LINE_PALETTE=[{label:'Theme',value:''},{label:'Clay',value:'#D16B58'},{label:'Sage',value:'#2F9568'},{label:'Blue',value:'#4E7CCD'},{label:'Gold',value:'#A67A25'}];
const LINE_COLORS=LINE_PALETTE.filter(c=>c.value).map(c=>c.value);
function randomLineColor(random=Math.random){return LINE_COLORS[Math.max(0,Math.min(LINE_COLORS.length-1,Math.floor(random()*LINE_COLORS.length)))];}
module.exports={LINE_PALETTE,LINE_COLORS,randomLineColor};
