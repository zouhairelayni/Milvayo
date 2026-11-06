// /tests/helpers/release-0711-review.cjs
'use strict';
// Static JSX/RN Web fixtures, never a running Expo app. No real data or effects.
const fs=require('node:fs'),vm=require('node:vm');
let source=fs.readFileSync(require.resolve('./render-redesign-review.cjs'),'utf8');
source=source.replace('docs/qa/redesign-063/source-review','docs/qa/release-0711/source-review');
// RN Web portals have no server output. Project visible modal content in place for this review only.
source=source.replace("if(id==='react-native')return {...RN,", "if(id==='react-native')return {...RN,Modal:({visible,children})=>visible?React.createElement(RN.View,{style:{flex:1}},children):null,");
source=source.slice(0,source.indexOf("capture('overview-mobile'"));
source+=`
const dueTasks=Array.from({length:12},(_,i)=>({id:'upcoming-'+i,title:['Review dependency plan','Confirm release evidence','Schedule mobile verification'][i%3],due:'2026-11-10'}));
const DueSoon=read('src/screens/tasks/DueSoon.js').default;
const Board=read('src/screens/board/Board.js').default,Tasks=read('src/screens/tasks/Tasks.js').default,Sprints=read('src/screens/delivery/Delivery.js').Sprints;
const Create=read('src/screens/board/BoardManagement.js').BoardCreateSheet;
for(const w of [320,390]){
 capture('board-'+w,Board,{openTask:noop},w,844);
 capture('tasks-'+w,Tasks,{openTask:noop},w,844);
 capture('sprints-'+w,Sprints,{openTask:noop},w,844);
 capture('due-soon-'+w,()=>e(RN.View,{style:{padding:16}},e(DueSoon,{tasks:dueTasks,onOpenTask:noop})),{},w,300,false);
 capture('create-'+w,Create,{visible:true,onClose:noop,board:s.boards[0],onCreated:noop},w,844,false);
}
manifest.forEach(m=>{m.note='Static source render; inert effects/handlers. Visible modal portal projected in place. Due soon uses synthetic tasks.';});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('Rendered',manifest.length,'static source fixtures; no Expo/device runtime.');
`;
vm.runInThisContext('(function(require,module,exports,__dirname){'+source+'\n})',{filename:__filename})(require,module,module.exports,__dirname);
