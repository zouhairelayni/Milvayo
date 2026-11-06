// /tests/app/refactor-batch02-0522.test.cjs
// Batch 02 refactor: the app shell is split into src/shell/*; behavior and wiring stay the same.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');

test('ModernApp.js keeps the screen tables and passes them to the shell parts', () => {
  const app = read('src/app/ModernApp.js');
  assert.doesNotMatch(app, /const NAV = \[/); // the menu entries live in navigation/sections.cjs
  assert.match(app, /const TABS = SECTIONS\.map/);
  assert.match(app, /const SCREENS = \{/);
  assert.match(app, /<Sidebar nav=\{navFor\(tools\)\} current=\{screen\}/);
  assert.match(app, /<PhoneHeader kind=/);
  assert.match(app, /<ViewPill views=\{views\}/);
  assert.match(app, /<TabBar tabs=\{TABS\} current=\{section\.id\}/);
  assert.match(app, /import ScreenErrorBoundary from '\.\.\/components\/shell\/ScreenErrorBoundary'/);
});

test('shell parts are defined once, outside ModernApp.js', () => {
  const app = read('src/app/ModernApp.js');
  assert.doesNotMatch(app, /function (Brand|NavItem|ProjectDrawer|ProjectCard|Sidebar|SideMenu|TopBar|TabBar)\b/);
  assert.doesNotMatch(app, /class ScreenErrorBoundary/);
  const menus = read('src/components/shell/Menus.js');
  assert.match(menus, /export function Sidebar\(\{ nav,/);
  assert.doesNotMatch(menus, /SideMenu/); // the phone drawer is replaced by the More screen
  assert.equal((menus.match(/<NavGroups /g) || []).length, 1); // only the wide sidebar renders NAV groups
  assert.equal((menus.match(/nav\.map\(/g) || []).length, 1);
  const bars = read('src/components/shell/Bars.js');
  assert.match(bars, /export function TabBar\(\{ tabs,/);
  assert.match(bars, /items\.map\(/);
  assert.match(bars, /export function ViewPill\(\{ views,/);
  assert.match(bars, /export function PhoneHeader\(\{ kind,/);
  assert.match(read('src/components/shell/ScreenErrorBoundary.js'), /export default class ScreenErrorBoundary extends Component/);
});

test('shell files import only paths that exist', () => {
  for (const f of ['Menus.js', 'Bars.js', 'ScreenErrorBoundary.js']) {
    const dir = path.join(__dirname, '..', '..', 'src', 'components', 'shell');
    for (const m of read(`src/components/shell/${f}`).matchAll(/(?:from |require\()'(\.[^']+)'/g)) {
      const base = path.resolve(dir, m[1]);
      const ok = ['', '.js', '.cjs', '.web.js', '.native.js', '.png'].some((e) => fs.existsSync(base + e));
      assert.ok(ok, `${f} imports missing ${m[1]}`);
    }
  }
  assert.ok(fs.existsSync(path.join(__dirname, '..', '..', 'assets/milvayo-white.png')));
  assert.ok(fs.existsSync(path.join(__dirname, '..', '..', 'assets/milvayo-dark.png')));
  assert.match(read('src/components/shell/Menus.js'), /BoardMorph/);
});

test('ui.js only re-exports; every shared component is still exported once', () => {
  const barrel = read('src/ui/ui.js');
  for (const f of ['uiBase', 'uiControls', 'uiLayout', 'downloadText']) assert.match(barrel, new RegExp(`export \\* from '\\./${f}'`));
  assert.doesNotMatch(barrel, /function /);
  const files = ['src/ui/uiBase.js', 'src/ui/uiControls.js', 'src/ui/uiLayout.js', 'src/ui/downloadText.js'].map(read).join('\n');
  const names = [...files.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map((m) => m[1]).sort();
  assert.deepEqual(names, ['Avatar', 'Bar', 'Button', 'Card', 'Cell', 'Chip', 'Empty', 'Grid', 'IconBtn', 'Input', 'LayoutProvider', 'MetricStrip', 'Page', 'Pill', 'ScreenIntro', 'SectionTitle', 'Segmented', 'Sheet', 'Stat', 'T', 'downloadBytes', 'downloadText', 'useLayoutPreference', 'useWide']);
});

test('no cycle: base imports no other ui file, controls only base, layout only base and controls', () => {
  const imports = (f) => [...read(f).matchAll(/from '\.\/(ui\w*)'/g)].map((m) => m[1]);
  assert.deepEqual(imports('src/ui/uiBase.js'), []);
  assert.deepEqual(imports('src/ui/uiControls.js'), ['uiBase']);
  assert.deepEqual(imports('src/ui/uiLayout.js').sort(), ['uiBase', 'uiControls']); // Sheet reuses the shared close control without a reverse import
  assert.deepEqual(imports('src/ui/downloadText.js'), []);
});
