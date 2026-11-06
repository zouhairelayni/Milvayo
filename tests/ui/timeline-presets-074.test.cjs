// /tests/ui/timeline-presets-074.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const parser=require('@babel/parser'),generate=require('@babel/generator').default;
const display=require('../../src/timeline/timelineDisplay.cjs'),zoom=require('../../src/timeline/timelineZoom.cjs');
const {screenHarness,nodes,control}=require('../helpers/screen-harness.cjs');
test('returning to Days centers Today after arbitrary scrolling in Weeks and Months, including repeated preset selections',()=>{
 const ast=parser.parse(fs.readFileSync('src/screens/timeline/Timeline.js','utf8'),{sourceType:'module',plugins:['jsx']});let functions=[];
 function find(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&['chooseZoom','settleZoom'].includes(n.id?.name))functions.push(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(find);else if(v&&typeof v==='object')find(v);}find(ast);
 const offsets=[],scrolls=[],ctx={Object,Math,Number,Date,ZOOM:{Days:34,Weeks:14,Months:6},span:56,w:34,viewportW:350,START:'2026-11-01',TODAY:'2026-11-15',daysBetween:(a,b)=>(Date.parse(b)-Date.parse(a))/86400000,display,timelineZoom:zoom,k:{scroll:{x:0}},zoomQueue:{current:{clear(){}}},pendingZoom:{current:null},horizontalOffset:{setValue:v=>offsets.push(v)},chartRef:{current:{scrollTo:point=>scrolls.push(point.x)}},setScrollXPaint(){},setPinchWindow(){},pinch:{reset(){}},setZoom(){},setZoomFactor(){},diagnosticMonitor:{recordAction(){}}};
 vm.createContext(ctx);vm.runInContext(functions.map(n=>generate(n).code).join('\n'),ctx);
 for(const preset of ['Weeks','Months','Days','Days','Months','Weeks','Days']){
  ctx.k.scroll.x=999;ctx.gridW=ctx.w*ctx.span;ctx.chooseZoom(preset);const nextWidth=display.dayWidth(ctx.ZOOM[preset],56),expected=zoom.focusDay(14,nextWidth,56,350);
  assert.equal(offsets.at(-1),expected,'calendar rebases immediately');ctx.w=nextWidth;ctx.gridW=nextWidth*ctx.span;ctx.settleZoom(true,nextWidth*56);assert.equal(scrolls.at(-1),expected,'native viewport acknowledges Today');assert.equal(ctx.k.scroll.x,expected);assert.equal(ctx.pendingZoom.current,null);
 }
 assert.equal(scrolls.at(-1),318);ctx.chooseZoom('invalid');assert.equal(ctx.pendingZoom.current,null);
});
test('Today focus remains finite and bounded before layout, across resize and extreme schedule spans',()=>{
 for(const span of [56,300,5000])for(const viewport of [0,200,350,1200])for(const width of [34,14,6,8192/span]){
  const x=zoom.focusDay(span/2,width,span,viewport);assert.ok(Number.isFinite(x));assert.ok(x>=0&&x<=Math.max(0,width*span-viewport));
 }
 assert.equal(zoom.focusDay(NaN,34,56,350),0);assert.equal(zoom.focusDay(14,0,56,350),0);
});
test('Timeline options renders Days, Weeks and Months in one top row; selecting a pill keeps the options popup open',()=>{
 const pills=screenHarness('src/ui/uiControls.js',{}),menu=screenHarness('src/ui/uiExperience.js',{}),calls=[];
 const header=pills.render('Segmented',{options:['Days','Weeks','Months'],value:'Days',fill:true,wrap:false,onChange:v=>calls.push(v)});
 assert.equal(header.props.style.flexWrap,'nowrap');assert.equal(nodes(header).filter(n=>n.props.accessibilityRole==='radio').length,3);
 const props={label:'Timeline options',header,items:[{label:'Parent tasks',onPress(){}}]};let tree=menu.render('ActionMenu',props);control(tree,'Timeline options').props.onPress();tree=menu.render('ActionMenu',props);
 const radios=nodes(tree).filter(n=>n.props.accessibilityRole==='radio');radios.forEach(n=>n.props.onPress());assert.deepEqual(calls,['Days','Weeks','Months']);assert.ok(nodes(menu.render('ActionMenu',props)).some(n=>n.type==='Sheet'&&n.props.visible));assert.ok(nodes(tree).indexOf(radios[0])<nodes(tree).indexOf(control(tree,'Parent tasks')));
});
