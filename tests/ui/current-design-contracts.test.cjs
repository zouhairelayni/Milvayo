// /tests/ui/current-design-contracts.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');
const read = file => fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8');
const workspaceMocks = {
  '../../diagnostics/DiagnosticsPanel':'DiagnosticsPanel', './Backup':'Backup',
  '../../ui/theme/launcherIcon':{syncLauncherIcon(){}},
  '../../ui/theme/iconPreview.cjs':{},
  '../../domain/operations.cjs':require('../../src/domain/operations.cjs'),
};

test('brand keeps a named Milvayo Board mark and readable wordmark at compact and wide sizes', () => {
  const h = screenHarness('src/components/shell/Menus.js', {});
  for (const compact of [false, true]) {
    const tree = h.render('Brand', { compact });
    assert.equal(tree.props.accessibilityLabel, 'Milvayo');
    assert.ok(text(tree).includes('Milvayo'));
    assert.equal(nodes(tree).filter(n => n.type === 'BoardMorph').length, 1);
  }
  assert.equal(nodes(h.render('Brand', { symbolOnly: true })).length, 1);
});

test('notification errors, warnings and sticky work persist; ordinary notices dismiss after their exit', () => {
  for (const notice of [{type:'error'}, {type:'warning'}, {type:'info', sticky:true}, {type:'success'}]) {
    const pending = new Map(); let serial = 0, dismissed = 0;
    const h = screenHarness('src/components/notice/IslandNotice.js', {}, {
      mocks: {'./NoticeMotion': {__esModule:true, default:'NoticeMotion'}, '../../ui/uiBase':{T:'T'}},
      globals: {setTimeout(fn, ms) {pending.set(++serial, {fn, ms}); return serial;}, clearTimeout(id) {pending.delete(id);}},
    });
    const props = {notice:{id:'n', text:'Saved workspace', ...notice}, onDismiss:()=>dismissed++};
    let tree = h.render('default', props);
    assert.equal(pending.size, notice.type === 'success' ? 1 : 0);
    if (notice.type === 'success') {
      const first = [...pending.values()][0]; assert.ok(first.ms >= 4000); pending.clear(); first.fn();
      tree = h.render('default', props);
      assert.equal(nodes(tree).find(n=>n.type==='NoticeMotion').props.state, 'hidden');
    } else {
      const motion = nodes(tree).find(n=>n.type==='NoticeMotion');
      const expanded = motion.props.expanded;
      assert.equal(expanded.props.accessibilityLiveRegion, notice.type === 'error' ? 'assertive' : 'polite');
      control(expanded, 'Dismiss notification').props.onPress();
    }
    assert.equal(dismissed, 0);
    [...pending.values()][0].fn();
    assert.equal(dismissed, 1);
    assert.equal(h.render('default', props), null);
  }
});

test('notification expansion and Backup action stay accessible without dismissing the current workspace', () => {
  const calls = [], timers = [];
  const h = screenHarness('src/components/notice/IslandNotice.js', {}, {
    mocks:{'./NoticeMotion':{__esModule:true,default:'NoticeMotion'}, '../../ui/uiBase':{T:'T'}},
    globals:{setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){}},
  });
  const props={notice:{id:'long',type:'warning',text:'Review '.repeat(30),action:'backup'},onAction:a=>calls.push(a),onDismiss:()=>calls.push('dismiss')};
  let expanded = h.render('default',props).props.children.props.expanded;
  control(expanded,'Read full notification').props.onPress();
  expanded = h.render('default',props).props.children.props.expanded;
  assert.ok(control(expanded,'Show less notification'));
  control(expanded,'Open Backup').props.onPress();
  assert.deepEqual(calls,['backup']); timers.at(-1)(); assert.deepEqual(calls,['backup','dismiss']);
});

test('notice motion uses opacity/translation and system reduced motion on both platforms', () => {
  const native = read('src/components/notice/NoticeMotion.native.js');
  assert.match(native, /useAnimatedStyle/); assert.match(native, /ReduceMotion.System/);
  assert.match(native, /opacity:.*translateY/); assert.doesNotMatch(native, /withRepeat|setInterval/);
  const web = read('src/components/notice/NoticeMotion.web.js');
  assert.match(web, /prefers-reduced-motion/); assert.match(web, /a\?\.cancel/);
  assert.match(web, /opacity:.*translateY/);
});

test('shared buttons expose names, disabled state, matching label/icon ink and generous touch targets', () => {
  const h = screenHarness('src/ui/uiControls.js', {}); let clicks = 0;
  for (const variant of ['primary','secondary','danger','ghost']) {
    const tree=h.render('Button',{label:'Save task',icon:'check',variant,onPress:()=>clicks++});
    assert.equal(tree.props.accessibilityRole,'button'); assert.equal(tree.props.accessibilityLabel,'Save task');
    assert.ok(tree.props.style.minHeight>=44);
    const icon=nodes(tree).find(n=>n.type==='Feather'), label=nodes(tree).find(n=>n.type==='T');
    assert.equal(icon.props.color,label.props.color); tree.props.onPress();
  }
  assert.equal(clicks,4);
  const disabled=h.render('Button',{label:'Save',disabled:true});
  assert.equal(disabled.props.disabled,true); assert.equal(disabled.props.accessibilityState.disabled,true);
  const icon=h.render('IconBtn',{label:'Edit project',icon:'edit-2'});
  assert.ok(icon.props.style.width>=44 && icon.props.style.height>=44);
});

test('fields retain accessible labels, focus contrast, disabled state and inline editing callbacks', () => {
  const h=screenHarness('src/ui/uiControls.js',{}), changes=[];
  const props={value:'Draft',placeholder:'Name',onChangeText:v=>changes.push(v)};
  let tree=h.render('Input',props), normal=tree.props.style;
  tree.props.onChangeText('Edited'); assert.deepEqual(changes,['Edited']);
  tree.props.onFocus(); tree=h.render('Input',props);
  assert.notEqual(tree.props.style[0]?.borderColor || tree.props.style.borderColor, normal[0]?.borderColor || normal.borderColor);
  assert.equal(tree.props.accessibilityLabel,'Name');
  tree=h.render('Input',{...props,editable:false,multiline:true});
  assert.equal(tree.props.accessibilityState.disabled,true);
  assert.ok(tree.props.style[0].minHeight>=44);
});

test('sheets support explicit close, Android Back, accessibility escape and top-only downward dismissal', () => {
  const h=screenHarness('src/ui/uiLayout.js',{}); let closed=0;
  const tree=h.render('Sheet',{visible:true,title:'Project settings',onClose:()=>closed++});
  tree.props.onRequestClose(); control(tree,'Close Project settings').props.onPress();
  const panel=nodes(tree).find(n=>n.props.onAccessibilityEscape);
  panel.props.onAccessibilityEscape(); assert.equal(closed,3);
  assert.equal(panel.props['aria-modal'],true); assert.equal(panel.props['aria-label'],'Project settings');
  const event=(x,y,end=false)=>({nativeEvent:{[end?'changedTouches':'touches']:[{pageX:x,pageY:y}]}});
  panel.props.onTouchStart(event(10,10)); panel.props.onTouchEnd(event(160,130,true)); assert.equal(closed,3);
  panel.props.onTouchStart(event(10,10)); panel.props.onTouchEnd(event(12,150,true)); assert.equal(closed,4);
  const body=nodes(tree).find(n=>n.type==='ScrollView'); body.props.onScroll({nativeEvent:{contentOffset:{y:40}}});
  panel.props.onTouchStart(event(10,10)); panel.props.onTouchEnd(event(12,150,true)); assert.equal(closed,4);
});

test('phone sub-screen titles stay readable and Back/search controls keep their callbacks', () => {
  const h=screenHarness('src/components/shell/Bars.js',{}); let backed=0;
  const sub=h.render('PhoneHeader',{kind:'sub',title:'Testing',onBack:()=>backed++});
  assert.ok(text(sub).includes('Testing')); control(sub,'Back to More').props.onPress(); assert.equal(backed,1);
  assert.equal(h.render('PhoneHeader',{kind:'hub'}),null);
  const main=h.render('PhoneHeader',{kind:'main',onPickProject(){},onQuery(){}});
  assert.ok(control(main,'Search tasks'));
  assert.equal(nodes(main).find(n=>n.type==='ProjectSwitcher').props.showProjectName,false);
});

test('timeline retains one pinned calendar and contextual actions above the single scrolling task canvas', () => {
  const source=read('src/screens/timeline/Timeline.js');
  const calendar=source.indexOf('transform: [{ translateX: calendarShift }]');
  const page=source.indexOf('<Page',calendar);
  assert.ok(calendar>=0 && page>calendar);
  assert.match(source.slice(page,page+100),/intro=\{false\}/);
  for(const label of ['Hide task names','Show task names','Jump to first task','Show critical path','Parent tasks','To schedule'])assert.ok(source.includes(label),label);
  assert.match(source,/calendarShift = useMemo\(\(\) => Animated.multiply\(horizontalOffset, -1\)/);
  assert.equal((source.match(/<TimelineScrollView\b/g)||[]).length,1);
});

test('retained screens freeze workspace subscriptions and share a single notice host with the tour', () => {
  const source=read('src/app/ModernApp.js');
  assert.match(source,/<ScreenPresence active=\{active\}/);
  assert.match(source,/<StoreFreeze frozen=\{!active\}/);
  assert.equal((source.match(/<IslandNotice\b/g)||[]).length,1);
  assert.ok(source.includes('>{noticeLayer}</Onboarding>:noticeLayer'));
});

test('workspace history filters and expands bounded chunks without mutating stored entries', () => {
  const activity=Array.from({length:110},(_,i)=>({id:String(i),at:'2026-11-06',action:i===107?'Unique change':'Edited '+i}));
  const before=JSON.stringify(activity),h=screenHarness('src/screens/workspace/Workspace.js',{s:{activity}},{mocks:workspaceMocks});
  let tree=h.render('Activity'); assert.equal(text(tree).includes('Edited 60'),false);
  control(tree,'Show more activity (60 remaining)').props.onPress(); tree=h.render('Activity');
  assert.ok(text(tree).includes('Edited 60')); assert.equal(text(tree).includes('Unique change'),false);
  nodes(tree).find(n=>n.props.accessibilityLabel==='Search workspace history').props.onChangeText('Unique');
  tree=h.render('Activity'); assert.ok(text(tree).includes('Unique change'));
  assert.equal(control(tree,'Show more activity (10 remaining)'),undefined); assert.equal(JSON.stringify(activity),before);
});

test('automation checks remain distinct callable actions in their contextual Run checks menu', () => {
  const model=require('../../src/domain/model.cjs'),workspace=model.normalizeWorkspace({...model.createWorkspace(),selectedId:'p',projects:[model.makeProject({id:'p',name:'Studio'})]});
  const calls=[],store={workspace,s:{automations:[],boards:[],commands:[],automationHistory:[]},runDueCommands:()=>calls.push('due'),runAgingCommands:()=>calls.push('aging'),sweepDue:()=>calls.push('overdue')};
  const h=screenHarness('src/screens/workspace/Workspace.js',store,{mocks:workspaceMocks});
  const row=h.render('Automations').props.actions;
  assert.equal(row.props.menuLabel,'Run checks');
  assert.deepEqual(Array.from(row.props.items,item=>item.label),['Due checks','Card aging','Flag overdue']);
  row.props.items.forEach(item=>item.onPress()); assert.deepEqual(calls,['due','aging','overdue']);
});
