// /tests/app/refactor-batch02-0522.test.cjs
// Batch 02 refactor: the app shell is split into src/shell/*; behavior and wiring stay the same.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');

test('ModernApp.js keeps the screen tables and passes them to the shell parts', () => {
  const app = read('src/app/ModernApp.js');
  assert.match(app, /const NAV = \[/);
  assert.match(app, /const TABS = \[/);
  assert.match(app, /const SCREENS = \{/);
  assert.match(app, /<Sidebar nav=\{NAV\} current=\{screen\}/);
  assert.match(app, /<SideMenu nav=\{NAV\} visible=\{menu\}/);
  assert.match(app, /<TabBar tabs=\{TABS\} current=\{screen\}/);
  assert.match(app, /import ScreenErrorBoundary from '\.\.\/components\/shell\/ScreenErrorBoundary'/);
});

test('shell parts are defined once, outside ModernApp.js', () => {
  const app = read('src/app/ModernApp.js');
  assert.doesNotMatch(app, /function (Brand|NavItem|ProjectDrawer|ProjectCard|Sidebar|SideMenu|TopBar|TabBar)\b/);
  assert.doesNotMatch(app, /class ScreenErrorBoundary/);
  const menus = read('src/components/shell/Menus.js');
  assert.match(menus, /export function Sidebar\(\{ nav,/);
  assert.match(menus, /export function SideMenu\(\{ nav,/);
  assert.equal((menus.match(/<NavGroups /g) || []).length, 2); // sidebar and side menu share one group list
  assert.equal((menus.match(/nav\.map\(/g) || []).length, 1);
  const bars = read('src/components/shell/Bars.js');
  assert.match(bars, /export function TabBar\(\{ tabs,/);
  assert.match(bars, /tabs\.map\(/);
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
  assert.ok(fs.existsSync(path.join(__dirname, '..', '..', 'assets/niyarvo-projects-white.png')));
  assert.ok(fs.existsSync(path.join(__dirname, '..', '..', 'assets/niyarvo-projects-dark.png')));
  assert.match(read('src/components/shell/Menus.js'), /require\('\.\.\/\.\.\/\.\.\/assets\/niyarvo-projects-white\.png'\)/);
});

test('ui.js only re-exports; every shared component is still exported once', () => {
  const barrel = read('src/ui/ui.js');
  for (const f of ['uiBase', 'uiControls', 'uiLayout', 'downloadText']) assert.match(barrel, new RegExp(`export \\* from '\\./${f}'`));
  assert.doesNotMatch(barrel, /function /);
  const files = ['src/ui/uiBase.js', 'src/ui/uiControls.js', 'src/ui/uiLayout.js', 'src/ui/downloadText.js'].map(read).join('\n');
  const names = [...files.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map((m) => m[1]).sort();
  assert.deepEqual(names, ['Avatar', 'Bar', 'Button', 'Card', 'Cell', 'Chip', 'Empty', 'Grid', 'IconBtn', 'Input', 'Page', 'Pill', 'SectionTitle', 'Segmented', 'Sheet', 'Stat', 'T', 'downloadBytes', 'downloadText', 'useWide']);
});

test('no cycle: base imports no other ui file, controls only base, layout only base and controls', () => {
  const imports = (f) => [...read(f).matchAll(/from '\.\/(ui\w*)'/g)].map((m) => m[1]);
  assert.deepEqual(imports('src/ui/uiBase.js'), []);
  assert.deepEqual(imports('src/ui/uiControls.js'), ['uiBase']);
  assert.deepEqual(imports('src/ui/uiLayout.js').sort(), ['uiBase', 'uiControls']);
  assert.deepEqual(imports('src/ui/downloadText.js'), []);
});
