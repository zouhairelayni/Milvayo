// /tests/ui/wbs-diagram-controls.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../helpers/diagram-harness.cjs');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');
const model = require('../../src/domain/model.cjs');
const pm = load('src/governance/pm.js', { './data': { labourCosts: () => [], money: String } });
const scenes = {...require('../../src/governance/diagramScene.cjs'), Scene:'Scene'};
let serial=0;
const fixture = () => [{ id: 'w0', parent: null, name: '', hours: 0 }, { id: 'w1', parent: 'w0', name: 'Design', hours: 12 }, { id: 'w2', parent: 'w0', name: 'Build', hours: 20 }];

function setup(wide = false, initial = fixture()) {
  const calls = [], downloads = [], s = { project: { name: 'Studio & team' }, pm: { wbs: initial } };
  const store = { s, currentId:'fixture-'+(++serial), workspaceId:'tests', setPm(key, value) { calls.push([key, value]); s.pm[key] = value; } };
  const h = screenHarness('src/screens/governance/pm/PmWbs.js', {}, { wide, mocks: {
    '../../../governance/store': { useStore: () => store }, '../../../governance/pm': pm,
    '../../../governance/diagramCache.cjs':require('../../src/governance/diagramCache.cjs'), '../../../governance/wbsviews': scenes, '../../../governance/DiagramPreview':{__esModule:true,default:'DiagramPreview'}, '../../../governance/DiagramExports':{__esModule:true,default:'DiagramExports'}, '../../../diagnostics/monitor':{diagnosticMonitor:{measureWork:(_n,fn)=>fn(),recordAction(){}}}, './PmDocs': { DocHeader: 'DocHeader' },
    './pmui': { Field: 'Field', NumInput: 'NumInput', OwnerPick: 'OwnerPick' }, '../../../gestures/DiagramViewport': { __esModule: true, default: 'DiagramViewport' },
    '../../../ui/ui': new Proxy({ useWide: () => wide, downloadText: (...args) => downloads.push(args) }, { get: (o, k) => o[k] || k }),
  } });
  return { h, calls, downloads, s };
}
const selector = tree => nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='tree')) || nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='outline'));
const viewport = tree => nodes(tree).find(n => n.type === 'DiagramViewport');
const zoomControl = tree => nodes(tree).find(n => n.type === 'Segmented' && n.props.options.some(o => o.value === 'fit'));

test('WBS: compact summary preserves all derived values on phone and desktop',()=>{
 for(const wide of [false,true]){const {h}=setup(wide),tree=h.render();const items=nodes(tree).find(n=>n.type==='MetricStrip').props.items;
 assert.deepEqual(Array.from(items,x=>[x.label,x.value]),[['Elements',2],['Work packages',2],['Levels',1],['Estimated hours',32]]);}
});

test('WBS diagram inventory: Tree/directions, Fishbone, Mind map, Fit/100%/150%, pinch feedback, SVG/CSV export; gestures change no saved WBS', () => {
  const { h, calls, downloads, s } = setup(); const before = JSON.stringify(s.pm.wbs);
  for (const kind of ['tree', 'fishbone', 'mind']) {
    let tree = h.render(); selector(tree).props.onChange(kind); tree = h.render();
    let v = viewport(tree); assert.ok(v);
    assert.equal(v.props.children.type, scenes.Scene); assert.equal(v.props.children.props.scale, undefined);
    const key = v.props.resetKey;
    v.props.onZoom(2.25); tree = h.render(); v = viewport(tree);
    assert.equal(v.props.scale, 2.25); assert.equal(v.props.resetKey, key);
    zoomControl(tree).props.onChange('1.5'); tree = h.render(); v = viewport(tree);
    assert.equal(v.props.scale, 1.5); assert.notEqual(v.props.resetKey, key);
    const reset = v.props.resetKey;
    zoomControl(tree).props.onChange('1.5'); tree = h.render(); assert.notEqual(viewport(tree).props.resetKey, reset);
    zoomControl(tree).props.onChange('1'); tree = h.render(); assert.equal(viewport(tree).props.scale, 1);
    zoomControl(tree).props.onChange('fit'); tree = h.render();
    assert.equal(viewport(tree).props.scale, 'fit');
    const toolbar = nodes(tree).find(n => n.type === 'ScrollView');
    assert.equal(toolbar.props.horizontal, true); assert.equal(toolbar.props.contentContainerStyle.flexWrap, undefined);
    const toolbarControls = nodes(toolbar).filter(n => n.type === 'Segmented');
    assert.equal(toolbarControls.length, kind === 'tree' ? 2 : 1);
    if (kind === 'tree') {
      assert.deepEqual(Array.from(toolbarControls[0].props.options, o => o.label), ['Top-down', 'Left to right']);
      toolbarControls[0].props.onChange('right'); tree = h.render(); assert.match(viewport(tree).props.resetKey, /tree:right:/);
    }
    const exports=nodes(tree).find(n=>n.type==='DiagramExports');
    assert.equal(exports.props.scene,viewport(tree).props.scene);
    const svg=scenes.sceneToSvg(exports.props.scene,{});assert.ok(svg.includes(`width="${viewport(tree).props.scene.width}"`));assert.ok(svg.includes('Studio &amp; team'));
    assert.ok(exports.props.getCSV().includes('Design'));

  }
  assert.deepEqual(calls, []); assert.equal(JSON.stringify(s.pm.wbs), before);
  const p = model.makeProject({ name: 'Studio', governance: { wbs: s.pm.wbs } });
  assert.deepEqual(model.importProject(JSON.parse(JSON.stringify(p))).governance.wbs, p.governance.wbs);
});

test('WBS viewport fits the measured width and bounded height, and preserves its scene child during resize', () => {
  const h = screenHarness('src/gestures/DiagramViewport.js', {}, { mocks: { './DiagramGesture': { __esModule: true, default: 'DiagramGesture' }, './diagramZoom.cjs': require('../../src/gestures/diagramZoom.cjs') } });
  const child = { scene: true }, props = { scene: { width: 600, height: 1200 }, scale: 'fit', resetKey: 'tree:1', children: child };
  let tree = h.render('default', props); assert.equal(tree.props.children, null);
  tree.props.onLayout({ nativeEvent: { layout: { width: 320 } } }); tree = h.render('default', props);
  let g = nodes(tree).find(n => n.type === 'DiagramGesture');
  assert.equal(g.props.initialScale, 440 / 1200); assert.equal(g.props.children, child); assert.equal(tree.props.style.height, 440);
  tree.props.onLayout({ nativeEvent: { layout: { width: 160 } } }); tree = h.render('default', props); g = nodes(tree).find(n => n.type === 'DiagramGesture');
  assert.equal(g.props.initialScale, 156 / 600); assert.equal(g.props.children, child);
});

test('WBS Outline control inventory and empty starters remain available; empty diagrams do not mount gesture controls', () => {
  const { h } = setup(); let tree = h.render(); assert.equal(viewport(tree), undefined);
  const row = nodes(tree).find(n => typeof n.type === 'function' && n.type.name === 'OutlineRow' && n.props.n.id === 'w1');
  const detail = h.render(row.type, { ...row.props, open: true });
  const actions=nodes(detail).find(n=>n.type==='ActionRow');assert.equal(actions.props.primary.props.label,'Add below');
  for(const label of ['Add next','Move up','Move down','Indent','Outdent','Delete element'])assert.ok(actions.props.items.some(x=>x.label===label),label);
  const deletion=actions.props.items.find(x=>x.label==='Delete element');assert.equal(deletion.danger,true);assert.equal(deletion.confirmation.title,'Delete work element?');assert.ok(deletion.confirmation.description);assert.equal(h.render().props.children==null,false);
  for (const label of ['Name', 'Owner', 'Estimated hours', 'Description (WBS dictionary)']) assert.ok(nodes(detail).some(n => n.props.label === label), label);
  const empty = setup(false, [fixture()[0]]); tree = empty.h.render();
  const emptyState=nodes(tree).find(n=>n.type==='EmptyState');const starter=emptyState.props.action;
  assert.equal(starter.props.primary.props.label,'Add first element');assert.deepEqual(Array.from(starter.props.items,x=>x.label),['Deliverable-based','PMI process groups']);
  selector(tree).props.onChange('mind'); tree = empty.h.render(); assert.equal(viewport(tree), undefined); assert.equal(control(tree, 'Export diagram (SVG)'), undefined);
  starter.props.primary.props.onPress(); assert.equal(empty.s.pm.wbs.length, 2);
  assert.ok(text(empty.h.render()).includes('Pinch to zoom'));
});
test('WBS exposes only Outline and Diagram; the inner icon-and-label selector preserves all three 100% views',()=>{
 const {h}=setup();let tree=h.render();const top=nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='outline'));
 assert.deepEqual(Array.from(top.props.options,o=>o.label),['Outline','Diagram']);top.props.onChange('diagram');tree=h.render();
 for(const kind of ['tree','fishbone','mind']){const choose=nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='tree'));assert.ok(choose.props.options.every(o=>o.icon));choose.props.onChange(kind);tree=h.render();assert.equal(viewport(tree).props.scale,1);}
});
