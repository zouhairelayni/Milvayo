// /tests/ui/remediation-062.test.cjs
'use strict';
const{test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');const {load}=require('../helpers/diagram-harness.cjs');const core=require('../../src/diagnostics/core.cjs');
test('Board mark exposes platform-correct accessibility without a nonboolean DOM accessible prop',()=>{
 for(const os of ['web','android']){
 const mod=load('src/components/brand/BoardMorph.js',{react:React,'react-native':{Platform:{OS:os},AccessibilityInfo:{}},'react-native-svg':{__esModule:true,default:'svg',Defs:'defs',G:'g',LinearGradient:'linearGradient',Path:'path',Stop:'stop'},'../../ui/theme/theme':{useTheme:()=>({accentPref:'Orange'})}});
 if(os==='web'){const errors=[],prev=console.error;console.error=(...a)=>errors.push(a);try{const html=renderToStaticMarkup(React.createElement(mod.default));assert.match(html,/role="img"/);assert.match(html,/aria-label="Milvayo Board logo"/);assert.doesNotMatch(html,/accessible=/);assert.deepEqual(errors,[]);}finally{console.error=prev;}}
 else {const props=require('node:fs').readFileSync('src/components/brand/BoardMorph.js','utf8');assert.match(props,/accessible: true, accessibilityLabel:/);}
 }
});
test('diagnostics classifies warning fingerprints and never saves warning message content',()=>{
 assert.equal(core.warningKind(['[Reanimated] Reading from `value` during component render.']),'reanimated-render-read');
 assert.equal(core.warningKind(['props.pointerEvents is deprecated. Use style.pointerEvents']),'web-pointer-events-deprecation');
 assert.equal(core.warningKind(['Received true for a non-boolean attribute accessible']),'svg-accessibility-prop');
 const s=core.fresh('qa',1);s.warningKinds={'reanimated-render-read':36};s.warnings=36;assert.match(core.reportPerf(s),/reanimated-render-read 36/);
 assert.equal(core.warningKind(['password=private user@example.com']),'unclassified');assert.doesNotMatch(JSON.stringify(s),/private|user@example/);
});

test('web sheets expose a named modal dialog while native retains its own accessibility semantics',()=>{
 const {screenHarness,nodes}=require('../helpers/screen-harness.cjs');
 for(const platform of ['web','android']){
  const h=screenHarness('src/ui/uiLayout.js',{}, {platform});const tree=h.render('Sheet',{visible:true,title:'Task details',onClose(){}});
  const container=nodes(tree).find(n=>n.props.accessibilityViewIsModal);
  assert.equal(container.props.role,platform==='web'?'dialog':undefined);
  assert.equal(container.props['aria-label'],platform==='web'?'Task details':undefined);
 }
});
