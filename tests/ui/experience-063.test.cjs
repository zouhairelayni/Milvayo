// /tests/ui/experience-063.test.cjs
'use strict';
const{test}=require('node:test');const assert=require('node:assert/strict');
const{screenHarness,nodes,control}=require('../helpers/screen-harness.cjs');
const{ACCENTS,palette,contrast}=require('../../src/ui/theme/themePalette.cjs');
test('all ten retained accent families have readable body, placeholder, selected and button text in three explicit modes',()=>{
 assert.deepEqual(ACCENTS.map(x=>x.id),['Aqua','Mint','Lime','Amber','Orange','Coral','Pink','Fuchsia','Violet','Indigo']);
 for(const a of ACCENTS)for(const mode of ['light','dark','amoled']){
  const c=palette(a.id,mode);if(mode==='amoled')assert.equal(c.bg,'#000000');
  for(const fg of ['ink','muted','faint'])for(const bg of ['bg','surface','surfaceAlt','elevated'])assert.ok(contrast(c[fg],c[bg])>=4.5,`${a.id} ${mode} ${fg}/${bg}`);
  assert.ok(contrast(c.accentInk,c.accent)>=4.5);assert.ok(contrast(c.onSelection,c.selection)>=4.5);
 }
});
test('confirmation commits once, keeps failed saves open, and closes only after durable success',async()=>{
 const h=screenHarness('src/ui/uiExperience.js',{});let resolve,calls=0,closed=0;
 const props={visible:true,title:'Delete record?',onClose(){closed++},onConfirm(){calls++;return new Promise(r=>{resolve=r})}};
 let tree=h.render('ConfirmSheet',props);const first=control(tree,'Confirm').props.onPress();const duplicate=control(tree,'Confirm').props.onPress();
 assert.equal(calls,1);assert.equal(closed,0);tree=h.render('ConfirmSheet',props);assert.equal(control(tree,'Please wait…').props.disabled,true);
 resolve(false);await first;await duplicate;tree=h.render('ConfirmSheet',props);assert.equal(closed,0);assert.ok(nodes(tree).some(n=>n.props.accessibilityRole==='alert'));
 const second=control(tree,'Confirm').props.onPress();resolve(true);await second;assert.equal(closed,1);assert.equal(calls,2);
 const failure={...props,onConfirm:()=>{throw Error('disk full')}};await control(h.render('ConfirmSheet',failure),'Confirm').props.onPress();assert.equal(closed,1);assert.ok(nodes(h.render('ConfirmSheet',failure)).some(n=>n.props.children==='disk full'));
});
test('context menu preserves disabled, safe and destructive callbacks and dismisses after selection',()=>{
 const h=screenHarness('src/ui/uiExperience.js',{}),calls=[];
 const props={label:'Project actions',items:[{label:'Duplicate',onPress:()=>calls.push('duplicate')},{label:'Delete',danger:true,onPress:()=>calls.push('delete')},{label:'Protected',disabled:true,onPress:()=>calls.push('bad')}]};
 let tree=h.render('ActionMenu',props);nodes(tree).find(n=>n.type==='IconBtn').props.onPress();tree=h.render('ActionMenu',props);
 assert.equal(control(tree,'Protected').props.disabled,true);control(tree,'Duplicate').props.onPress();assert.deepEqual(calls,['duplicate']);assert.equal(nodes(h.render('ActionMenu',props)).some(n=>n.type==='Sheet'),false);
});
test('searchable choices preserve typed values, bound initial rows, and reset the filter after selection',()=>{
 const h=screenHarness('src/components/inline/CompactTools.js',{}, {mocks:{'../../ui/Reveal':{__esModule:true,default:'Reveal'},'./DisclosureGlyph':{__esModule:true,default:'Disclosure'}}}),calls=[];
 const props={options:Array.from({length:150},(_,i)=>({value:i,label:'Person '+i})),value:2,onChange:v=>calls.push(v)};
 let tree=h.render('Dropdown',props);control(tree,'Person 2').props.onPress();tree=h.render('Dropdown',props);assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='radio').length,60);
 nodes(tree).find(n=>n.type==='Input').props.onChangeText('Person 149');tree=h.render('Dropdown',props);assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='radio').length,1);control(tree,'Person 149').props.onPress();assert.deepEqual(calls,[149]);assert.equal(typeof calls[0],'number');
 tree=h.render('Dropdown',props);control(tree,'Person 2').props.onPress();assert.equal(nodes(h.render('Dropdown',props)).filter(n=>n.props.accessibilityRole==='radio').length,60);
});
test('inline calendars pick real dates, respect limits and browse across month boundaries without committing navigation',()=>{
 const calls=[],h=screenHarness('src/ui/InlineCalendar.js',{});const props={label:'Planning',value:'2026-12-15',min:'2026-12-10',max:'2027-01-20',onChange:v=>calls.push(v)};
 let tree=h.render('InlineCalendar',props);assert.equal(nodes(tree).filter(n=>n.type==='PressSurface').length,42);
 assert.equal(control(tree,'2026-12-09').props.disabled,true);control(tree,'2026-12-16').props.onPress();assert.deepEqual(calls,['2026-12-16']);
 control(tree,'Next month in Planning').props.onPress();tree=h.render('InlineCalendar',props);assert.ok(nodes(tree).some(n=>n.props.children==='January 2027'));assert.equal(control(tree,'2027-01-21').props.disabled,true);assert.equal(calls.length,1);
});
test('range calendar keeps the opposite date fixed and does not advance after a rejected start edit',()=>{
 const calls=[],h=screenHarness('src/ui/InlineCalendar.js',{});let accept=false;const props={start:'2026-11-06',end:'2026-11-17',onStart:v=>{calls.push(['start',v]);return accept},onEnd:v=>calls.push(['end',v])};
 let tree=h.render('InlineDateRange',props);const calendar=()=>nodes(tree).find(n=>typeof n.type==='function'&&n.type.name==='InlineCalendar');
 calendar().props.onChange('2026-11-07');tree=h.render('InlineDateRange',props);assert.equal(calendar().props.value,props.start);
 accept=true;calendar().props.onChange('2026-11-08');tree=h.render('InlineDateRange',props);assert.equal(calendar().props.value,props.end);calendar().props.onChange('2026-11-18');assert.deepEqual(calls,[['start','2026-11-07'],['start','2026-11-08'],['end','2026-11-18']]);assert.equal(props.end,'2026-11-17');
});
test('confirming menu actions keeps one popup open through cancel, failure, retry and success',async()=>{
 const h=screenHarness('src/ui/uiExperience.js',{});let resolve,calls=0;const props={label:'Task actions',items:[{label:'Duplicate task',confirmation:{title:'Duplicate this task?',confirmLabel:'Duplicate',description:'Keep this task open.',successMessage:'Task duplicated.'},onPress:()=>{calls++;return new Promise(r=>{resolve=r})}}]};
 let tree=h.render('ActionMenu',props);nodes(tree).find(n=>n.type==='IconBtn').props.onPress();tree=h.render('ActionMenu',props);const type=nodes(tree).find(n=>n.type==='Sheet').type;
 control(tree,'Duplicate task').props.onPress();tree=h.render('ActionMenu',props);assert.equal(calls,0);assert.equal(nodes(tree).find(n=>n.type==='Sheet').type,type);assert.equal(nodes(tree).find(n=>n.type==='Sheet').props.title,'Duplicate this task?');assert.equal(nodes(tree).some(n=>n.type==='ConfirmSheet'),false);
 control(tree,'Cancel').props.onPress();tree=h.render('ActionMenu',props);assert.ok(control(tree,'Duplicate task'));assert.equal(nodes(tree).find(n=>n.type==='Sheet').props.visible,true);
 control(tree,'Duplicate task').props.onPress();tree=h.render('ActionMenu',props);const pending=control(tree,'Duplicate').props.onPress();control(tree,'Duplicate').props.onPress();assert.equal(calls,1);
 tree=h.render('ActionMenu',props);assert.equal(control(tree,'Please wait…').props.disabled,true);nodes(tree).find(n=>n.type==='Sheet').props.onClose();assert.ok(nodes(h.render('ActionMenu',props)).some(n=>n.type==='Sheet'));
 resolve(false);await pending;tree=h.render('ActionMenu',props);assert.equal(nodes(tree).find(n=>n.type==='Sheet').props.title,'Duplicate this task?');assert.ok(nodes(tree).some(n=>n.props.accessibilityRole==='alert'));
 const retry=control(tree,'Duplicate').props.onPress();resolve('copied-task');await retry;tree=h.render('ActionMenu',props);assert.equal(calls,2);assert.equal(nodes(tree).find(n=>n.type==='Sheet').props.title,'Task actions');assert.ok(control(tree,'Duplicate task'));assert.ok(nodes(tree).some(n=>n.props.text==='Task duplicated.'));
});
test('dangerous menu actions require confirmation even without a custom prompt and errors never dismiss',async()=>{
 const h=screenHarness('src/ui/uiExperience.js',{});let calls=0;const props={label:'Actions',items:[{label:'Delete',danger:true,onPress:()=>{calls++;throw Error('Cannot delete protected record')}}]};
 let tree=h.render('ActionMenu',props);nodes(tree).find(n=>n.type==='IconBtn').props.onPress();tree=h.render('ActionMenu',props);control(tree,'Delete').props.onPress();tree=h.render('ActionMenu',props);assert.equal(calls,0);assert.equal(nodes(tree).find(n=>n.type==='Sheet').props.title,'Delete?');await control(tree,'Delete').props.onPress();tree=h.render('ActionMenu',props);assert.equal(calls,1);assert.ok(nodes(tree).some(n=>n.props.children==='Cannot delete protected record'));assert.ok(nodes(tree).some(n=>n.type==='Sheet'));
});
