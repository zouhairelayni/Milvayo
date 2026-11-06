// /tests/helpers/render-redesign-review.cjs
'use strict';
// Lightweight source-rendered visual fixtures. These are NOT a running Expo app or native acceptance.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),babel=require('@babel/core');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),RN=require('react-native-web');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/qa/redesign-063/source-review');fs.mkdirSync(out,{recursive:true});
const model=require('../../src/domain/model.cjs'),bridge=require('../../src/domain/modernBridge.cjs'),tokens=require('../../src/ui/theme/themePalette.cjs'),glyphs=require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json');
require.extensions['.png']=(m,f)=>{m.exports={uri:'file://'+f,width:128,height:128}};
const workspace=model.createWorkspace(),s=bridge.projectView(workspace),project=workspace.projects.find(p=>p.id===workspace.selectedId);
let width=390,mode='dark';const cache=new Map(),noop=()=>{};
const api=new Proxy({s,workspace,projects:workspace.projects,workspaceList:{items:[{id:'local',name:workspace.name||'Local workspace'}],activeId:'local'},workspaceId:'local',costSummary:()=>model.operations.costSummary(project),flush:async()=>true},{get:(o,k)=>o[k]??noop});
const theme={useTheme:()=>({c:tokens.palette('Coral',mode),mode,pref:mode,accentPref:'Coral',setPref:noop,setAccent:noop}),radius:{sm:9,md:14,lg:20,pill:999},font:'system-ui',serif:'Georgia',ACCENTS:tokens.ACCENTS,STATUS_COLOR:{Backlog:'#8C919B','In progress':'#80A7EF',Validation:'#C7B4EE',Done:'#83D8B4'},PRIORITY_COLOR:{Low:'#8C919B',Medium:'#80A7EF',High:'#F0CC77',Critical:'#FFA09B'}};
function svg(tag){return function Shape({children,rotation,origin,pointerEvents,accessible,accessibilityLabel,style,...props}){if(rotation){const[cx,cy]=String(origin||'0,0').split(/[, ]+/);props.transform=`rotate(${rotation} ${cx} ${cy})`;}if(accessibilityLabel)props['aria-label']=accessibilityLabel;return React.createElement(tag,{...props,style:Array.isArray(style)?Object.assign({},...style):style},children)}}
const SVG={__esModule:true,default:svg('svg')};for(const k of ['Circle','Defs','G','Line','LinearGradient','Path','Rect','Stop','Text','ClipPath','Polygon','Ellipse'])SVG[k]=svg(k==='Text'?'text':k==='LinearGradient'?'linearGradient':k==='ClipPath'?'clipPath':k.toLowerCase());
function requireSource(file){
 if(cache.has(file))return cache.get(file).exports;
 if(/\.(png|jpe?g|webp)$/.test(file))return {uri:'file://'+file,width:128,height:128};
 if(file.endsWith('.json')||file.endsWith('.cjs'))return require(file);
 if(file.endsWith('/src/store/store.js'))return {useStore:()=>api,useStoreActions:()=>api,useScreenActive:()=>true};
 if(file.endsWith('/DiagnosticsPanel.js')||file.endsWith('/Backup.js'))return {__esModule:true,default:()=>null};
 if(/launcherIcon(?:\.web)?\.js$/.test(file))return {syncLauncherIcon:noop};
 const m={exports:{}};cache.set(file,m);
 const code=babel.transformSync(fs.readFileSync(file,'utf8'),{filename:file,babelrc:false,configFile:false,plugins:[[require.resolve('@babel/plugin-transform-react-jsx'),{runtime:'automatic'}],require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
 const load=id=>{
  if(id==='react'||id==='react/jsx-runtime')return require(id);
  if(id==='react-native')return {...RN,useWindowDimensions:()=>({width,height:844,scale:1,fontScale:1})};
  if(id==='react-native-svg')return SVG;
  if(id==='@expo/vector-icons')return {Feather:({name,size=18,color,...props})=>React.createElement('span',{...props,'aria-hidden':true,style:{fontFamily:'Feather',fontSize:size,color,lineHeight:1,display:'inline-block'}},String.fromCodePoint(glyphs[name]||glyphs.circle))};
  if(id==='react-native-safe-area-context')return {SafeAreaProvider:RN.View,SafeAreaView:RN.View,useSafeAreaInsets:()=>({top:0,left:0,right:0,bottom:0})};
  if(/(?:^|\/)theme\/theme$/.test(id))return theme;
  if(/(?:^|\/)store\/store$/.test(id))return {useStore:()=>api,useStoreActions:()=>api,useScreenActive:()=>true};
  if(/downloadText$/.test(id))return {downloadText:noop,downloadBytes:noop};
  if(/HeaderActions$/.test(id))return {useHeaderActions:noop};
  if(/diagnostics\/monitor$/.test(id))return {diagnosticMonitor:{recordAction:noop,recordRender:noop}};
  if(!id.startsWith('.'))throw Error('Unsupported visual fixture dependency '+id+' in '+file);
  const base=path.resolve(path.dirname(file),id),resolved=['.web.js','.js','.cjs','.json',''].map(e=>base+e).find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());if(!resolved)throw Error('Missing '+id);return requireSource(resolved);
 };
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(load,m,m.exports);
 if(file.endsWith('/uiBase.js')){m.exports.useWide=()=>width>=900;m.exports.useLayoutPreference=()=>({preference:'auto',setPreference:noop});}
 return m.exports;
}
const read=(p)=>requireSource(path.join(root,p));const e=React.createElement;
const font='data:font/ttf;base64,'+fs.readFileSync(path.join(root,'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf')).toString('base64');
const themeSource=fs.readFileSync(path.join(root,'src/ui/theme/theme.js'),'utf8');
for(const key of ['STATUS_COLOR','PRIORITY_COLOR']){const literal=themeSource.match(new RegExp('export const '+key+' = (\\{[\\s\\S]*?\\});'))?.[1];if(literal)theme[key]=vm.runInNewContext('('+literal+')');}
const manifest=[];
function capture(name,component,props={},w=390,h=844,shell=true){width=w;const c=tokens.palette('Coral',mode);const Bars=read('src/components/shell/Bars.js'),section=require('../../src/app/navigation/sections.cjs'),isBoard=name.startsWith('board'),isResource=name.startsWith('resources');
 let body=e(component,props);
 if(shell)body=e(RN.View,{style:{height:h,width:w,backgroundColor:c.bg,overflow:'hidden'}},w>=900?null:e(Bars.PhoneHeader,{kind:name.startsWith('resources')?'sub':'main',title:isResource?'Resources':isBoard?'Board':'Overview',onBack:noop,query:'',onQuery:noop,onPickProject:noop}),w<900&&isBoard?e(Bars.ViewPill,{views:section.SECTIONS[1].views,current:'board',go:noop}):null,body,w>=900?null:e(Bars.TabBar,{tabs:section.SECTIONS.map(x=>[x.id,x.label,x.icon]),current:isResource?'more':isBoard?'work':'home',go:noop,intent:{begin:noop,accept:()=>true},onCreate:noop}));
 const html=renderToStaticMarkup(body),sheet=RN.StyleSheet.getSheet();fs.writeFileSync(path.join(out,name+'.html'),`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Milvayo source review — ${name}</title><style>@font-face{font-family:Feather;src:url('${font}')}html,body{margin:0;background:${c.bg};color:${c.ink};font-family:system-ui}*{box-sizing:border-box}${sheet.textContent}</style>${html}`);
 manifest.push({file:name+'.html',width:w,height:h,sourceRendered:true,expoRuntime:false,mode,sourceData:'model.createWorkspace() bundled sample; never persisted'});
}
capture('overview-mobile',read('src/screens/overview/Overview.js').default,{openTask:noop,go:noop,openStatus:noop,onNewTask:noop,onOpenBackup:noop});
capture('overview-desktop',read('src/screens/overview/Overview.js').default,{openTask:noop,go:noop,openStatus:noop,onNewTask:noop,onOpenBackup:noop},1440,1000);
capture('calendar-mobile',()=>e(RN.View,{style:{padding:20,backgroundColor:tokens.palette('Coral',mode).bg}},e(read('src/ui/InlineCalendar.js').InlineDateRange,{start:'2026-11-06',end:'2026-11-17',onStart:noop,onEnd:noop})),{},390,620,false);
mode='amoled';
capture('empty-artwork-mobile',()=>e(RN.View,{style:{padding:20,gap:20,backgroundColor:tokens.palette('Coral',mode).bg}},e(read('src/ui/uiExperience.js').EmptyState,{kind:'people',title:'Make room for your team',description:'Add a contributor to see workload and availability.',action:e(read('src/ui/uiControls.js').Button,{label:'Add contributor',icon:'user-plus',onPress:noop})}),e(read('src/components/charts/StudioCharts.js').HistoryArea,{series:[]})),{},390,800,false);
mode='dark';
capture('resources-mobile',read('src/screens/workspace/Workspace.js').Resources);
capture('board-mobile',read('src/screens/board/Board.js').default,{openTask:noop});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Rendered source review fixtures:',manifest.map(x=>x.file).join(', '));
