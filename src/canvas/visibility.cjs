// /src/canvas/visibility.cjs
'use strict';
function visibilityKey(p,v){'worklet';const scale=Math.pow(2,Math.ceil(Math.log2(p.scale))),w=Math.max(1,v.width/scale),h=Math.max(1,v.height/scale);return `${Math.floor(-p.x/p.scale/w)}:${Math.floor(-p.y/p.scale/h)}:${scale}:${v.width}:${v.height}`;}
function visibleBox(o,p,v){const pad=Math.max(v.width,v.height)/p.scale,left=-p.x/p.scale-pad,top=-p.y/p.scale-pad;return o.x+o.width>=left&&o.y+o.height>=top&&o.x<=left+v.width/p.scale+2*pad&&o.y<=top+v.height/p.scale+2*pad;}
function visibleRoute(bounds,p,v){return !!bounds&&visibleBox({x:bounds.left,y:bounds.top,width:bounds.right-bounds.left,height:bounds.bottom-bounds.top},p,v);}
module.exports={visibilityKey,visibleBox,visibleRoute};
