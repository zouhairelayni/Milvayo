// /tests/ui/release-0551-governance-timeline.test.cjs
'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');

test('Light/Dark/AMOLED inputs expose a visible surface, outline and focused border',()=>{
  const ui=read('src/ui/uiControls.js');
  const input=ui.slice(ui.indexOf('export function Input('));
  for (const required of ['backgroundColor: c.surface','borderWidth: 1',"c.faint + 'A8'",'focused ? c.accentText', 'onFocus={() => setFocused(true)}','setFocused(false)','minHeight: multiline ? 104 : 44'])
    assert.ok(input.includes(required),required);
  assert.doesNotMatch(input,/backgroundColor: c\.surfaceAlt/);
});

test('Project creation uses six accessible field controls and only saves on explicit Create',()=>{
  const src=read('src/screens/governance/CreateProjectSheet.js');
  for(const label of ['Project name','Project code (optional)','Description','Project manager','Sponsor','Objective'])
    assert.ok(src.includes(`title="${label}"`),label);
  assert.match(src,/title="Description"[^>]*markdown/);
  assert.match(src,/footer=\{<><Button label="Cancel"/);
  assert.match(src,/onPress=\{save\}/);
  assert.match(src,/if\(id\)\{close\(\);onCreated\?\.\(id\);\}/);
  assert.doesNotMatch(src,/onChangeText=\{createProject/);
});

test('Markdown renderer supports bold, italics, headings, lists, quote and code without HTML',()=>{
  const {lines} = require('../../src/ui/taskMarkdown.cjs');
  const content=lines('# Summary\n**bold** *italic* ***both*** `code`\n- a task\n> quote');
  assert.equal(content[0].kind,'heading');
  assert.ok(content[1].parts.some(p=>p.text==='bold'&&p.bold));
  assert.ok(content[1].parts.some(p=>p.text==='italic'&&p.italic));
  assert.ok(content[1].parts.some(p=>p.text==='both'&&p.bold&&p.italic));
  assert.ok(content[1].parts.some(p=>p.text==='code'&&p.code));
  assert.equal(content[2].kind,'list');
  assert.equal(content[3].kind,'quote');
  const field=read('src/components/inline/MarkdownField.js');
  assert.match(field,/<TaskMarkdown source=\{value\}/);
  assert.match(field,/Preview/);
  assert.match(field,/onChangeText=\{onChangeText\}/);
  assert.doesNotMatch(field,/<WebView|dangerouslySetInnerHTML/);
});

test('Portfolio and Program editors have concise sheets, anchored footer actions and Markdown descriptions',()=>{
  for(const [f,label] of [['Portfolios','portfolio'],['Programs','program']]){
    const s=read(`src/screens/governance/${f}.js`);
    assert.match(s,/const editor=\(<View style=\{\{gap:14\}\}>/);
    assert.match(s,/<Labeled title="Description"[^>]+markdown/);
    assert.match(s,/<TaskMarkdown source=\{p\.description\}/);
    assert.ok(s.includes(`footer={<><Button label="Cancel"`),f);
    assert.ok(s.includes(`label="Save ${label}"`),f);
    assert.doesNotMatch(s,new RegExp('<Fold title="Manage '+f.toLowerCase()+'"'));
    assert.ok(s.includes(`label="Create ${label}"`));
  }
  const projects=read('src/screens/governance/Projects.js');
  assert.match(projects,/<Labeled title="Description"[^>]+markdown/);
  assert.match(projects,/<TaskMarkdown source=\{p\.description\}/);
});

test('Other long-form planning editors reuse the same Markdown source/preview path',()=>{
  for(const p of ['src/screens/governance/pm/PmDocs.js','src/screens/governance/pm/PmWbs.js','src/screens/governance/pm/PmRisks.js','src/screens/tasks/TaskSheet.js'])
    assert.match(read(p),/import MarkdownField/,p);
  assert.match(read('src/screens/governance/pm/PmDocs.js'),/sec.kind === 'text' \? <MarkdownField/);
  assert.match(read('src/screens/governance/pm/PmWbs.js'),/<MarkdownField showLabel=\{false\} label="WBS description"/);
  assert.match(read('src/screens/governance/pm/PmRisks.js'),/<MarkdownField showLabel=\{false\} label="Response plan"/);
  assert.match(read('src/screens/tasks/TaskSheet.js'),/<MarkdownField label="Description"/);
});

test('Timeline ribbon, calendar and zoom remain visible while the Gantt rows scroll vertically',()=>{
  const timeline=read('src/screens/timeline/Timeline.js');
  const bars=read('src/components/shell/Bars.js');
  assert.match(timeline,/const zoomHeader = useMemo\(\(\) => \(\{kind:'zoom', value:zoom, onChange:setZoom\}\)/);
  assert.doesNotMatch(timeline,/scrolledDown|hideChrome|scrollChromeRef/);
  assert.match(timeline,/<TimelineGestureHost>\s*<View style=\{\{ flex: 1 \}\}>/);
  const ribbon=timeline.indexOf('<Chip label={showItems'), calendar=timeline.indexOf('<Animated.View pointerEvents="none"');
  const page=timeline.indexOf('    <Page\n');
  const chart=timeline.indexOf('<Animated.ScrollView\n              ref={chartRef}');
  assert.ok(ribbon>0&&calendar>ribbon&&page>calendar&&chart>page,'pinned ribbon and calendar precede the scrolling page');
  assert.match(timeline,/transform: \[\{ translateX: calendarShift \}\]/);
  assert.match(timeline,/useNativeDriver: Platform\.OS !== 'web'/);
  assert.doesNotMatch(timeline,/calendarRef\.current/);
  assert.match(timeline,/directionalLockEnabled/);
  assert.match(timeline,/scrollProps=\{\{ \.\.\.pageScrollProps, nestedScrollEnabled: true \}\}/);
  assert.match(bars,/controls\.kind === 'zoom'/);
  assert.match(timeline,/onCommit=\{bar\.onCommit\}/);
  assert.match(timeline,/np533DependencyColor\(l\)/);
});

test('Shared sheets reset prior scroll position when opened again',()=>{
  const src=read('src/ui/uiLayout.js');
  assert.match(src,/onShow=\{\(\) => \{ scrollY\.current=0; bodyRef\.current\?\.scrollTo\(\{y:0,animated:false\}\); \}\}/);
  assert.match(src,/<ScrollView ref=\{bodyRef\}/);
  assert.match(src,/onTouchStart=\{startSwipe\} onTouchEnd=\{finishSwipe\}/);
});

test('v0.5.51 ships one cumulative changelog, QA and matching application versions',()=>{
  const pkg=require('../../package.json'), app=require('../../app.json'), lock=require('../../package-lock.json');
  assert.equal(pkg.version,'0.5.53');
  assert.equal(app.expo.version,pkg.version);
  assert.equal(lock.version,pkg.version);
  assert.equal(lock.packages[''].version,pkg.version);
  const changelog=read('docs/changelog/CHANGELOG.md');
  assert.match(changelog,/## v0\.1\.0/);
  assert.equal((changelog.match(/## v0\.5\.51/g)||[]).length,1);
  assert.ok(fs.existsSync(path.join(root,'docs/qa/NP-FORM-TIMELINE-AUDIT-v0.5.51.md')));
  assert.deepEqual(fs.readdirSync(path.join(root,'docs/changelog')),['CHANGELOG.md']);
});
