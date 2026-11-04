// /tests/ui/release-0550-design-audit.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

const {ACCENTS,palette,contrast}=require('../../src/ui/theme/themePalette.cjs');

test('ten accents in three appearances have readable text and primary buttons',()=>{
  assert.equal(ACCENTS.length,10);
  for(const item of ACCENTS)for(const mode of ['light','dark','amoled']){
    const c=palette(item.id,mode);
    for(const field of ['ink','muted','faint','accentText'])
      assert.ok(contrast(c[field],c.bg)>=4.5,`${item.id}/${mode} ${field}: ${contrast(c[field],c.bg).toFixed(2)}`);
    assert.ok(contrast(c.accentInk,c.accent)>=4.5,`${item.id}/${mode} button`);
    if (mode !== 'amoled') assert.equal(c.accent, mode==='light'?item.lightPrimary:item.darkPrimary);
  }
});

test('noninteractive labels no longer imitate pressable buttons',()=>{
  const ui=read('src/ui/uiControls.js'),labels=read('src/components/inline/TaskLabels.js');
  assert.match(ui,/if \(!onPress\) return <View style=\{style\(\)\}>/);
  assert.match(ui,/accessibilityState=\{\{ selected: !!active \}\}/);
  assert.match(labels,/return onPress\?<Pressable/);
  assert.match(labels,/:<View key=\{name\}/);
  assert.doesNotMatch(labels,/disabled=\{!onPress\}/);
  assert.match(labels,/minHeight:onPress\?44/);
});

test('editable controls and cards expose consistent semantics',()=>{
  const base=read('src/ui/uiBase.js'),ui=read('src/ui/uiControls.js'),inline=read('src/components/inline/CompactTools.js');
  assert.match(base,/<Pressable onPress=\{onPress\} accessibilityRole="button"/);
  assert.match(ui,/accessibilityRole="radio"/);
  assert.match(ui,/accessibilityState=\{\{disabled:!!disabled\}\}/);
  assert.match(ui,/accessibilityLabel=\{accessibilityLabel \|\| placeholder \|\| undefined\}/);
  assert.match(inline,/accessibilityLabel=\{title\}/);
  assert.match(inline,/accessibilityLabel=\{cur\?cur.label/);
});

test('shared sheets retain gestures and expose modal dismissal to assistive tech',()=>{
  const layout=read('src/ui/uiLayout.js');
  assert.match(layout,/accessibilityViewIsModal onAccessibilityEscape=\{onClose\}/);
  assert.match(layout,/accessibilityLabel=\{`Dismiss \$\{title \|\| 'sheet'\}`\}/);
  assert.match(layout,/accessibilityRole="header"/);
  assert.match(layout,/dy>110/);
  assert.doesNotMatch(layout,/IconBtn icon="x"/);
});

test('new risks stay draft-only until a named Save; deleting risks requires confirmation',()=>{
  const src=read('src/screens/governance/pm/PmRisks.js');
  const add=src.slice(src.indexOf('  const add = () => {'),src.indexOf('  let shown = risks.filter'));
  assert.match(add,/setDraftRisk\(r\)/);
  assert.doesNotMatch(add,/save\(/);
  assert.match(src,/disabled=\{!r\.title\.trim\(\)\}/);
  assert.match(src,/save\(\[draftRisk, \.\.\.risks\], 'Added a risk'\)/);
  assert.match(src,/onCancel=\{\(\) => setDraftRisk\(null\)\}/);
  assert.match(src,/<DangerConfirm label="Delete risk" onConfirm=\{onDelete\} \/>/);
  assert.match(src,/accessibilityLabel=\{`\$\{type\}, probability \$\{p\}, impact \$\{i\}/);
});

test('governance controls use readable typography and no decorative left side stripe',()=>{
  const pm=read('src/screens/governance/pm/pmui.js'),wbs=read('src/screens/governance/pm/PmWbs.js'),risks=read('src/screens/governance/pm/PmRisks.js');
  assert.match(pm,/width: 44, height: 44/);
  assert.match(pm,/<T size=\{12\} weight="500" muted>\{label\}<\/T>/);
  assert.match(wbs,/accessibilityState=\{\{expanded:open\}\}/);
  assert.match(wbs,/width: 8, height: 8, borderRadius: 4, backgroundColor: col/);
  assert.doesNotMatch(wbs,/width: 4, alignSelf: 'stretch', borderRadius: 2/);
  assert.match(risks,/color=\{buttonInk\(base\)\}/);
});

test('notifications and error boundary communicate without exposing technical exception text',()=>{
  const inline=read('src/components/notice/InlineNotice.js'),island=read('src/components/notice/IslandNotice.js'),err=read('src/components/shell/ScreenErrorBoundary.js');
  assert.match(inline,/accessibilityLiveRegion="assertive"/);
  assert.match(island,/accessibilityLabel="Dismiss notification"/);
  assert.match(err,/Retry this screen/);
  assert.doesNotMatch(err,/<T size=\{13\} muted>\{String\(this.state.error.message/);
});

test('charts and gesture-heavy task surfaces have accessible actions without changing drag geometry',()=>{
  const chart=read('src/components/charts/charts.js'),board=read('src/screens/board/Board.js'),timeline=read('src/screens/timeline/Timeline.js');
  assert.match(chart,/accessibilityRole="checkbox"/);
  assert.match(chart,/accessibilityState=\{\{checked:!!on\}\}/);
  assert.match(chart,/textDecorationLine:on\?'none':'line-through'/);
  assert.match(board,/onAccessibilityTap=\{\(\) => openTask\(t.id\)\}/);
  assert.match(timeline,/onAccessibilityTap=\{\(\) => onOpen\(t.id\)\}/);
  assert.match(timeline,/<Pressable onPress=\{onGridTap\} accessible=\{false\}/);
});

test('historical release remains cumulative, with one current QA record and synchronized metadata',()=>{
  const pkg=require('../../package.json'),app=require('../../app.json'),lock=require('../../package-lock.json');
  assert.equal(pkg.version,'0.5.58'); assert.equal(app.expo.version,pkg.version);
  assert.equal(lock.version,pkg.version); assert.equal(lock.packages[''].version,pkg.version);
  const log=read('docs/changelog/CHANGELOG.md');
  assert.equal((log.match(/^## v0\.5\.50 /gm)||[]).length,1);
  assert.match(log,/## v0\.1\.0/);
  assert.ok(read('docs/qa/NP-FULL-SURFACE-DESIGN-AUDIT-v0.5.50.md').length>3500);
  assert.ok(fs.existsSync(path.join(root,'docs/instructions/README.md')));
});
