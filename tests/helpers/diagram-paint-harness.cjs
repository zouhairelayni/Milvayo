// /tests/helpers/diagram-paint-harness.cjs
'use strict';
const React=require('react');
const {load}=require('./diagram-harness.cjs'),{lifecycleHarness}=require('./lifecycle-harness.cjs');
function diagramPaintHarness(){
 const h=lifecycleHarness();let renders=0,colors={ink:'#fafafa',bg:'#111111',surface:'#222222',muted:'#aaaaaa'};
 const mod=load('src/governance/wbsviews.js',{
  react:{...h.hooks,memo:fn=>fn,cloneElement:React.cloneElement},
  'react-native-svg':{Path:'Path',Rect:'Rect',Text:'SvgText'},
  '../ui/theme/theme':{font:'System',useTheme:()=>({c:colors})},'./DiagramSvg':{__esModule:true,default:'DiagramSvg'},
  '../diagnostics/useRenderMetric':{useRenderMetric:()=>renders++},
  '../diagnostics/monitor':{diagnosticMonitor:{measureWork:(_n,fn)=>fn(),recordAction(){}}},
 });
 return {render:props=>h.render(mod.Scene,props),stats:()=>mod.diagramPaintStats(),colors:value=>{colors=value;},get renders(){return renders;}};
}
module.exports={diagramPaintHarness};
