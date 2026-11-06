// /tests/helpers/startup-repair-review.cjs
'use strict';
// Reuse the established source renderer; no Metro, persistence, device or browser automation.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{execFileSync}=require('node:child_process');
const checkpoint=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/qa/startup-repair/source-baseline.json'),'utf8')).head;
const originalProjects=execFileSync('git',['show',checkpoint+':src/screens/governance/Projects.js'],{encoding:'utf8'});
let source=fs.readFileSync(require.resolve('./render-redesign-review.cjs'),'utf8');
source=source.replace("docs/qa/redesign-063/source-review", "docs/qa/startup-repair/source-review");
source=source.replace("if(file.endsWith('/src/store/store.js'))", "if(file.endsWith('/diagnostics/useRenderMetric.js'))return {useRenderMetric:()=>{}};\n if(file.endsWith('/src/store/store.js'))");
source=source.replace("let width=390,mode='dark';", "let projectsVariant='after',nativeProjection=false;let width=390,mode='dark';");
source=source.replace("if(id==='react-native')return {...RN,", "if(id==='react-native')return {...RN,Platform:{...RN.Platform,get OS(){return nativeProjection?'android':'web'}},FlatList:props=>React.createElement(RN.View,{},props.ListHeaderComponent,props.data.slice(0,props.initialNumToRender).map((item,index)=>React.createElement(React.Fragment,{key:item.id},props.renderItem({item,index}))),props.ListFooterComponent),");
source=source.replace("fs.readFileSync(file,'utf8')", "(file.endsWith('/governance/Projects.js')&&projectsVariant==='before'?originalProjects:fs.readFileSync(file,'utf8'))");
source=source.replace("isBoard=name.startsWith('board')", "isBoard=name.includes('board')");
source=source.replace("current:isResource?'more':isBoard?'work':'home'", "current:name.includes('projects')?'projects':isResource?'more':isBoard?'work':'home'");
source=source.slice(0,source.indexOf("capture('overview-mobile'"));
if(process.argv[2]==='benchmark')source+=`
const projectFile=path.join(root,'src/screens/governance/Projects.js');
projectsVariant='before';const Before=read('src/screens/governance/Projects.js').Projects;cache.delete(projectFile);
projectsVariant='after';const After=read('src/screens/governance/Projects.js').Projects;
const base=workspace.projects[0];workspace.projects=Array.from({length:20},(_,i)=>({...base,id:'sample-'+i,name:'Independent project '+(i+1),code:'P'+i}));workspace.selectedId='sample-0';api.projects=workspace.projects;
const result={kind:'alternating paired warm Node React DOM renders; native FlatList adapter enforces initial mount policy; NOT Android latency/FPS',measurement:'elapsed JS wall time including host scheduling and GC, not CPU profiler duration',node:process.version,samplesPerVariant:9,warmupsPerVariant:10,cases:{}};
for(const native of [false,true]){
 nativeProjection=native;width=native?390:1440;
 const render=Component=>renderToStaticMarkup(e(Component,{}));
 for(let i=0;i<10;i++){render(Before);render(After);}
 const samples={before:[],after:[]},counts={};
 for(let i=0;i<9;i++)for(const [name,Component] of i%2?[['after',After],['before',Before]]:[['before',Before],['after',After]]){
  const began=performance.now(),html=render(Component);samples[name].push(performance.now()-began);counts[name]=(html.match(/aria-label="Open project"/g)||[]).length;
 }
 const metrics={width,projects:20,initialCardActions:counts};for(const name of ['before','after'])metrics[name]={samplesMs:samples[name],medianMs:[...samples[name]].sort((a,b)=>a-b)[4]};result.cases[native?'nativeInitialPolicy':'web']=metrics;
}
fs.writeFileSync(path.join(root,'docs/qa/startup-repair/paired-render-benchmark.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
`;
else source+=`
const phase=process.argv[2]||'after';projectsVariant=phase;
const Projects=read('src/screens/governance/Projects.js').Projects;
for(const w of [320,390,780,1440])capture(phase+'-projects-'+w,Projects,{},w,w>=900?1000:844);
if(phase==='after'){const Board=read('src/screens/board/Board.js').default,base=s.tasks[0],lane=s.boards[0].lists[0];s.tasks=Array.from({length:20},(_,i)=>({...base,id:'DEMO-'+i,title:'Delivery card '+(i+1),board:s.boards[0].id,list:lane.id,status:lane.status}));capture('after-board-390',Board,{openTask:noop});manifest[manifest.length-1].sourceData='Bundled sample extended to 20 synthetic Board cards; never persisted';}
fs.writeFileSync(path.join(out,phase+'-manifest.json'),JSON.stringify(manifest,null,2));
console.log('Source Projects fixtures and render baseline:',phase);
`;
vm.runInThisContext('(function(require,module,exports,__dirname,originalProjects){'+source+'\n})',{filename:__filename})(require,module,module.exports,__dirname,originalProjects);
