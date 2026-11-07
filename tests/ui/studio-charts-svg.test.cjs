// /tests/ui/studio-charts-svg.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module');
const React=require('react'),RN=require('react-native-web'),{renderToStaticMarkup}=require('react-dom/server');
const {load}=require('../helpers/diagram-harness.cjs');
const {nodes}=require('../helpers/screen-harness.cjs');
const {palette}=require('../../src/ui/theme/themePalette.cjs');

// Load the installed SVG Web implementation with the same RN Web alias as Metro.
const originalLoad=Module._load;
let SVG,extractTransform;
try{
 Module._load=function(id,...args){return id==='react-native'?RN:originalLoad.call(this,id,...args);};
 SVG=require('react-native-svg/lib/commonjs/elements.web');
 extractTransform=require('react-native-svg/lib/commonjs/lib/extract/extractTransform').default;
}finally{Module._load=originalLoad;}

function charts(mode='dark'){
 return load('src/components/charts/StudioCharts.js',{
  react:React,'react-native':RN,'react-native-svg':SVG,'@expo/vector-icons':{Feather:()=>null},
  '../../ui/uiBase':{T:({children})=>React.createElement(RN.Text,null,children)},
  '../../ui/theme/theme':{useTheme:()=>({c:palette('Coral',mode)})},
  '../illustrations/EmptyArtwork':()=>null,'./TracePath':()=>null,'./Column':()=>null,'../../ui/CountValue':()=>null,
 });
}

function check(tree,rotation,cx,cy){
 const circles=nodes(tree).filter(n=>n.type===SVG.Circle);
 for(const circle of circles){
  assert.equal(circle.props.origin,undefined);
  assert.equal(circle.props.rotation,undefined);
  if(circle.props.transform){
   assert.equal(circle.props.transform,`rotate(${rotation} ${cx} ${cy})`);
   // The actual native transform parser must preserve the same center and angle.
   const matrix=extractTransform(circle.props.transform),radians=rotation*Math.PI/180;
   const expected=[Math.cos(radians),Math.sin(radians),-Math.sin(radians),Math.cos(radians)];
   for(let i=0;i<4;i++)assert.ok(Math.abs(matrix[i]-expected[i])<1e-9);
   assert.ok(Math.abs(matrix[0]*cx+matrix[2]*cy+matrix[4]-cx)<1e-9);
   assert.ok(Math.abs(matrix[1]*cx+matrix[3]*cy+matrix[5]-cy)<1e-9);
  }
 }
 const errors=[],warn=console.warn,error=console.error;
 let html;
 try{
  console.error=(...args)=>errors.push(args);
  console.warn=(...args)=>errors.push(args);
  html=renderToStaticMarkup(tree);
 }finally{console.error=error;console.warn=warn;}
 assert.deepEqual(errors,[],'actual SVG Web + React DOM render must be warning-free');
 assert.ok(!html.includes('transform-origin'));
 return {html,circles};
}

test('CompletionArc renders through installed SVG Web without console errors and preserves native rotation and readings',()=>{
 for(const mode of ['dark','light'])for(const value of [0,.5,1,-1,2,NaN,Infinity]){
  const {CompletionArc}=charts(mode),v=Math.min(1,Math.max(0,Number.isFinite(value)?value:0));
  const tree=CompletionArc({value,label:'capacity',size:88,color:'#123456'});
  const {html,circles}=check(tree,135,50,50),length=2*Math.PI*34*.75;
  assert.equal(circles.length,v>0?2:1);
  assert.ok(html.includes(`capacity, ${Math.round(v*100)} percent`));
  assert.ok(html.includes('rotate(135 50 50)'));
  if(v>0){assert.equal(circles[1].props.strokeDasharray,`${length*v} ${2*Math.PI*34-length*v}`);assert.equal(circles[1].props.stroke,'#123456');}
 }
});

test('StatusOrbit keeps populated/empty/single-status arcs and legend actions without invalid Web props',()=>{
 for(const values of [[],[0,0,0,0],[0,0,0,8],[2,3,1,4]]){
  const selected=[],series=values.map((value,i)=>({label:['Backlog','In progress','Validation','Done'][i],value}));
  const {StatusOrbit}=charts();
  const tree=StatusOrbit({series,onStatus:label=>selected.push(label),progress:.4});
  const {html,circles}=check(tree,-90,86,86);
  assert.equal(circles.filter(n=>n.props.transform).length,values.filter(v=>v>0).length);
  assert.ok(html.includes('weighted progress 40 percent'));
  const controls=nodes(tree).filter(n=>n.type===RN.Pressable);
  for(const item of controls)item.props.onPress();
  assert.deepEqual(selected,series.map(s=>s.label));
 }
});
