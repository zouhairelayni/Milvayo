// /tests/ui/motion-063.test.cjs
'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('../helpers/diagram-harness.cjs');
function animationMocks(){let worklet=false,renderReads=0;const configs=[];
 const shared=value=>({get(){if(!worklet){renderReads++;throw Error('shared read outside worklet')}return value},set(next){value=typeof next==='function'?next(value):next}});
 const run=fn=>{worklet=true;try{return fn()}finally{worklet=false}};
 const builder={duration(){return this},reduceMotion(){return this},easing(){return this}};
 return {shared,configs,reads:()=>renderReads,mocks:{react:{forwardRef:f=>f,useEffect:f=>f()},'react-native':{View:'View',StyleSheet:{flatten:s=>Array.isArray(s)?Object.assign({},...s):s}},'react-native-reanimated':{__esModule:true,default:{View:'AnimatedView',Text:'AnimatedText',createAnimatedComponent:()=> 'AnimatedShape'},useSharedValue:shared,useAnimatedStyle:run,useAnimatedProps:run,withSpring:(v,c)=>{configs.push(c);return v},withTiming:(v,c)=>{configs.push(c);return v},withDelay:(_d,v)=>v,cancelAnimation(){},Easing:{bezier:()=> 'ease'},ReduceMotion:{System:'system'},FadeIn:builder,FadeInDown:builder,FadeOutUp:builder,LinearTransition:builder},'react-native-svg':{Rect:'Rect',Path:'Path'}}};
}
test('Kanban native motion adds bounded lift/tilt and preview displacement without render-time shared reads',()=>{
 const a=animationMocks(),{BoardMotion}=load('src/board/boardMotion.native.js',a.mocks);const tree=BoardMotion({offset:{x:a.shared(120),y:a.shared(34)},shift:32,lifted:true,previewY:14,style:{},children:'Card'},null);
 const pose=tree.props.style[1].transform;assert.equal(pose[0].translateX,152);assert.equal(pose[1].translateY,43);assert.equal(pose[2].scale,1.025);assert.equal(pose[3].rotate,'0.96deg');assert.equal(a.reads(),0);assert.ok(a.configs.every(c=>c.reduceMotion==='system'));assert.ok(tree.props.layout);
});
test('native chart traces and columns publish finite SVG props through animated worklets',()=>{
 for(const [file,props] of [['Column',{height:88,baseline:122,x:9,width:27}],['TracePath',{d:'M0,10 L20,0',length:23,stroke:'#FFFFFF'}]]){
  const a=animationMocks(),module=load('src/components/charts/'+file+'.native.js',{...a.mocks,react:{...a.mocks.react,memo:f=>f}});const tree=module.default(props);assert.equal(a.reads(),0);assert.ok(Object.values(tree.props.animatedProps).every(Number.isFinite));assert.ok(a.configs.every(c=>c.reduceMotion==='system'));
 }
});
test('retained screen presence preserves its child and hides inactive pages without geometry transforms',()=>{
 for(const active of [true,false]){const a=animationMocks(),module=load('src/ui/ScreenPresence.native.js',a.mocks);const child={identity:'retained'};const tree=module.default({active,children:child,style:{flex:1}});assert.equal(tree.props.children,child);assert.equal(tree.props.style[1].display,active?'flex':'none');assert.equal(tree.props.style[2].opacity,active?1:0);assert.equal(tree.props.style[2].transform,undefined);assert.equal(a.reads(),0);}
});
test('native totals use intrinsic text height and retain default system font scaling',()=>{
 const a=animationMocks(),module=load('src/ui/CountValue.native.js',{...a.mocks,'./theme/theme':{font:'System',useTheme:()=>({c:{ink:'#FFFFFF'}})}});
 const tree=module.default({value:123,size:46});assert.equal(tree.props.style.height,undefined);assert.equal(tree.props.style.maxHeight,undefined);assert.equal(tree.props.style.minHeight,60);
 const text=tree.props.children;assert.notEqual(text.props.allowFontScaling,false);assert.equal(text.props.style.lineHeight,55);assert.equal(tree.props.accessibilityLabel,'123');assert.equal(text.props.numberOfLines,undefined);
});
test('Kanban arrival and dragged opacity have one owner and preserve the measured root',()=>{
 const a=animationMocks(),{BoardMotion}=load('src/board/boardMotion.native.js',a.mocks);const ref={current:null},onLayout=()=>{};
 const tree=BoardMotion({offset:{x:a.shared(0),y:a.shared(0)},lifted:true,style:[{width:280,opacity:1},{opacity:.94}],onLayout,children:'Card'},ref);
 assert.equal(tree.type,'AnimatedView');assert.equal(tree.props.ref,ref);assert.equal(tree.props.onLayout,onLayout);assert.equal(tree.props.children,'Card');assert.equal(tree.props.collapsable,false);assert.equal(tree.props.entering,undefined);assert.equal(tree.props.exiting,undefined);assert.equal(tree.props.style[1].opacity,.94);assert.ok(tree.props.layout);assert.ok(a.configs.some(c=>c.duration===170&&c.reduceMotion==='system'));assert.equal(a.reads(),0);
});
test('selected native tab icon scales to 24px without a highlight surface or layout change',()=>{
 for(const selected of [false,true]){const a=animationMocks(),module=load('src/components/shell/NavIcon.native.js',{...a.mocks,'@expo/vector-icons':{Feather:'Feather'}});const tree=module.default({name:'home',selected,color:'#FFFFFF'});assert.equal(tree.props.style.width,48);assert.equal(tree.props.style.height,28);assert.equal(tree.props.style.backgroundColor,undefined);assert.equal(tree.props.children.props.style.transform[0].scale,selected?1.2:1);assert.equal(tree.props.children.props.children.props.size,20);assert.equal(a.reads(),0);assert.ok(a.configs.every(c=>c.reduceMotion==='system'));}
});


test('native list lift is 40% smaller while direct drag and neighbour preview distances stay exact',()=>{
 const a=animationMocks(),{BoardMotion}=load('src/board/boardMotion.native.js',a.mocks);
 for(const lifted of [true,false]){
  const tree=BoardMotion({offset:{x:a.shared(400),y:a.shared(34)},shift:32,previewY:14,lifted,liftAmount:.6,style:{}},null),pose=tree.props.style[1].transform;
  assert.equal(pose[0].translateX,432);assert.equal(pose[1].translateY,lifted?45:48);assert.equal(pose[2].scale,lifted?1.015:1);assert.equal(pose[3].rotate,lifted?'1.2deg':'0deg');assert.equal(tree.props.liftAmount,undefined);assert.equal(a.reads(),0);
 }
});

test('web list scale and tilt use the same smaller excursion and keep the original card default',()=>{
 for(const liftAmount of [.6,undefined])for(const lifted of [true,false]){
  const effects=[],offsetTransform=[{translateX:23},{translateY:9}],node={style:{}},ref={current:null};
  const {BoardMotion}=load('src/board/boardMotion.web.js',{
   react:{forwardRef:f=>f,useEffect:f=>effects.push(f),useLayoutEffect:f=>effects.push(f),useRef:current=>({current})},
   'react-native':{Animated:{View:'AnimatedView',Value:class{constructor(value){this.value=value;}},timing:()=>({start(){},stop(){}})}},
  });
  const tree=BoardMotion({offset:{getTranslateTransform:()=>offsetTransform},lifted,liftAmount,style:{}},ref);tree.props.ref(node);effects.forEach(f=>f());
  assert.equal(ref.current,node);assert.equal(node.style.scale,lifted?(liftAmount===.6?'1.015':'1.025'):'1');assert.equal(node.style.rotate,lifted?(liftAmount===.6?'-0.72deg':'-1.2deg'):'0deg');assert.deepEqual(Array.from(tree.props.style[1].transform).slice(0,2),offsetTransform);
 }
});
