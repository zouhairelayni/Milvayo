// /scripts/apply-np-v0.5.33.cjs
'use strict';
/** Niyarvo Projects 0.5.33 selective merge. Applied to installed 0.5.31 Desktop HF2 only. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = {
  layout: 'src/ui/layoutMode.cjs',
  app: 'src/app/ModernApp.js',
  store: 'src/store/store.js',
  tasks: 'src/screens/tasks/Tasks.js',
  overview: 'src/screens/overview/Overview.js',
  board: 'src/screens/board/Board.js',
  timeline: 'src/screens/timeline/Timeline.js',
};
const read = key => fs.readFileSync(path.join(root, files[key]), 'utf8');
const unique = (s, token, label) => {
  const n = s.split(token).length - 1;
  if (n !== 1) throw Error(`${label}: expected one source anchor, found ${n}. Refusing to edit.`);
};
const replaceOne = (s, from, to, label) => { unique(s, from, label); return s.replace(from, to); };

function transformTasks(src) {
  if (src.includes('NP533_COLUMNS')) return { source: src, message: 'Tasks already merged' };
  unique(src, 'const wide = useWide();', 'Tasks wide hook');
  if (!/import \{[^\n]*\} from 'react-native';/.test(src)) throw Error('Tasks: expected react-native import not found');
  src = src.replace(/import \{([^\n]*)\} from 'react-native';/, (_, names) =>
    `import { ${names.includes('useWindowDimensions') ? names.trim() : names.trim() + ', useWindowDimensions'} } from 'react-native';`);
  src = replaceOne(src, 'const wide = useWide();', `const wide = useWide();\n  // NP533_COLUMNS: actual viewport width, not desktop shell preference. Avoid columns overflowing portrait Web.\n  const roomForColumns = useWindowDimensions().width >= 1080;`, 'Tasks columns responsive');
  const rowStart = src.indexOf('{pageOf.items.map((row, i) => {');
  if (rowStart < 0) throw Error('Tasks: task rows layout changed; refusing unverified merge');
  const rowEnd = src.indexOf('</Card>', rowStart);
  if (rowEnd < 0) throw Error('Tasks: task table closure changed');
  let row = src.slice(rowStart, rowEnd);
  if (!row.includes('{wide ?') && !row.includes('wide?4:2')) throw Error('Tasks: expected responsive columns missing');
  row = row.replace(/\bwide\b/g, 'roomForColumns');
  // The label and row width are fitted independently of the page shell: 390px Web can remain Desktop mode.
  row = row.replace('paddingVertical: 12,', 'paddingVertical: 10,');
  const statusOld = '{roomForColumns ? <Pill label={t.status} color={STATUS_COLOR[t.status]} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[t.status] }} />}';
  const statusNew = '{roomForColumns ? <View style={{ width: 104 }}><Pill label={t.status} color={STATUS_COLOR[t.status]} /></View> : <View accessibilityLabel={t.status} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[t.status] }} />}';
  if (row.includes(statusOld)) row = row.replace(statusOld, statusNew);
  const priorityOld = '<Pill label={roomForColumns ? t.priority : t.priority.slice(0, 1)} color={PRIORITY_COLOR[t.priority]} />';
  if (row.includes(priorityOld)) row = row.replace(priorityOld, '<View style={roomForColumns ? { width: 80 } : undefined}><Pill label={roomForColumns ? t.priority : t.priority.slice(0, 1)} color={PRIORITY_COLOR[t.priority]} /></View>');
  src = src.slice(0, rowStart) + row + src.slice(rowEnd);
  const headerStart = src.indexOf('<Card pad={0} style={{ overflow: \'hidden\' }}>');
  if (headerStart < 0) throw Error('Tasks: expected task table card not found');
  const beforeRows = src.slice(headerStart, src.indexOf('{pageOf.items.map((row, i) => {', headerStart));
  if (/\bOwner<\/T>/.test(beforeRows)) {
    if (beforeRows.includes('wide && list.length')) {
      const replaced = beforeRows.replace('wide && list.length', 'roomForColumns && list.length');
      src = src.slice(0, headerStart) + replaced + src.slice(headerStart + beforeRows.length);
    }
  } else {
    const header = `{roomForColumns && list.length ? (\n          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 36, backgroundColor: c.surfaceAlt }}>\n            <View style={{ width: 20 }} />\n            <T size={12} weight="500" muted style={{ flex: 1 }}>Task</T>\n            <T size={12} weight="500" muted style={{ width: 150 }}>Owner</T>\n            <T size={12} weight="500" muted style={{ width: 62 }}>Due</T>\n            <T size={12} weight="500" muted style={{ width: 104 }}>Status</T>\n            <T size={12} weight="500" muted style={{ width: 80 }}>Priority</T>\n          </View>\n        ) : null}\n        `;
    src = src.slice(0, headerStart) + src.slice(headerStart).replace('{list.length === 0 ? <Empty>No tasks match these filters.</Empty> : null}', header + '{list.length === 0 ? <Empty>No tasks match these filters.</Empty> : null}');
    if (!src.includes('>Owner</T>')) throw Error('Tasks: table header insertion failed');
  }
  return { source: src, message: 'Responsive compact task table + aligned column headers' };
}

function transformOverview(src) {
  // Sonnet also had this nested Pressable defect. Fix it only when this layout is present.
  const lines = src.split('\n');
  const i = lines.findIndex(x => /<Card\b[^\n]*\bonPress=\{\(\) => go\('releases'\)\}/.test(x));
  if (i < 0) return { source: src, message: 'Release controls already independent or different layout (unchanged)' };
  const end = lines.findIndex((x, j) => j > i && /<\/Card>/.test(x));
  if (end < 0) throw Error('Overview: release card does not close');
  const button = lines.findIndex((x,j) => j > i && j < end && /<Button\b[^\n]*label="Open testing"/.test(x));
  if (button < 0) throw Error('Overview: release card click has no known nested testing control; refusing edit');
  lines[i] = lines[i].replace(/\s+onPress=\{\(\) => go\('releases'\)\}/, '');
  const indent = lines[button].match(/^\s*/)[0];
  const original = lines[button].trim();
  lines[button] = [
    `${indent}<View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>`,
    `${indent}  <Button label="Open releases" small variant="secondary" onPress={() => go('releases')} />`,
    `${indent}  ${original}`,
    `${indent}</View>`,
  ].join('\n');
  return { source: lines.join('\n'), message: 'Removed nested interactive Web controls in Release readiness' };
}

function transformBoard(src) {
  let count = 0;
  const countOld = '<T size={12} muted>{cardTotal}</T>';
  if (src.includes(countOld)) {
    src = replaceOne(src, countOld, `<View style={{ minWidth: 22, minHeight: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>\n          <T size={11} weight="600" muted>{cardTotal}</T>\n        </View>`, 'Board count badge');
    count++;
  }
  const paddingOld = 'borderRadius: 18,\n        padding: 10,\n        gap: 10,';
  if (src.includes(paddingOld)) {
    src = replaceOne(src, paddingOld, 'borderRadius: 14,\n        padding: 8,\n        gap: 8,', 'Board column compact spacing');
    count++;
  }
  return { source: src, message: count ? 'Board card count and column spacing refined; drag/width engine intact' : 'Board already customized: left untouched' };
}

function transformTimeline(src) {
  if (src.includes('NP533_WEEKENDS') || src.includes('weekendDays.map(')) return { source: src, message: 'Weekend shading already present' };
  const anchor = 'const visibleTicks = dayTicks.filter((i) => viewport.intersects(i * w, i * w + 80, paintLeft, paintWidth));';
  const gridAnchor = "{visibleTicks.map((i) => (\n                    <View key={'g' + i}";
  if (!src.includes(anchor) || !src.includes(gridAnchor)) return { source: src, message: 'Timeline grid structure customized: weekend feature deferred; no gesture changes' };
  unique(src, anchor, 'Timeline visible ticks');
  unique(src, gridAnchor, 'Timeline grid ticks');
  src = src.replace(anchor, anchor + `\n  // NP533_WEEKENDS: shade only viewport-visible weekend columns in Days zoom. No full-canvas nodes.\n  const weekendDays = [];\n  if (zoom === 'Days' && w > 0) {\n    const [year, month, day] = START.split('-').map(Number);\n    const startDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();\n    const first = Math.max(0, Math.floor(paintLeft / w));\n    const last = Math.min(span - 1, Math.ceil((paintLeft + paintWidth) / w));\n    for (let i = first; i <= last; i++) if ((startDay + i) % 7 === 0 || (startDay + i) % 7 === 6) weekendDays.push(i);\n  }`);
  src = src.replace(gridAnchor, `{weekendDays.map((i) => (\n                    <View key={'we' + i} pointerEvents="none" style={{ position: 'absolute', left: i * w, top: paintTop, height: paintH, width: w, backgroundColor: c.surfaceAlt, opacity: 0.3 }} />\n                  ))}\n                  ` + gridAnchor);
  return { source: src, message: 'Viewport-bounded Gantt weekend shading (Days zoom only)' };
}

function apply({ dryRun = false } = {}) {
  for (const name of Object.values(files)) if (!fs.existsSync(path.join(root, name))) throw Error(`Missing expected project file: ${name}`);
  const isDesktopLayout = require(path.join(root, files.layout)).isDesktopLayout;
  if (typeof isDesktopLayout !== 'function'
    || !isDesktopLayout(390, 'web', 'auto')
    || !isDesktopLayout(768, 'web', 'auto')
    || isDesktopLayout(390, 'android', 'auto')) {
    throw Error('Portrait desktop safety check failed. Install v0.5.31 DESKTOP HF2 before this merge. No changes made.');
  }
  if (!read('app').includes('LayoutProvider')) throw Error('HF1 desktop LayoutProvider missing. Refusing to replace or rewrite shell.');
  if (!read('store').includes("import { T } from " + String.fromCharCode(39) + "../ui/uiBase" + String.fromCharCode(39) + ";")) throw Error('HF2 direct Store import missing. Refusing circular dependency regression.');
  const checks = {
    tasks: transformTasks,
    overview: transformOverview,
    board: transformBoard,
    timeline: transformTimeline,
  };
  const original = Object.fromEntries(Object.keys(checks).map(k => [k, read(k)]));
  const result = Object.fromEntries(Object.entries(checks).map(([k,fn]) => [k, fn(original[k])]));
  // No partial changes if the structural checks fail. All transformations are evaluated first.
  if (!result.tasks.source.includes('NP533_COLUMNS') || !result.tasks.source.includes('roomForColumns')) throw Error('Responsive task table self-check failed');
  if (result.overview.source.includes("onPress={() => go('releases')}") && result.overview.source.includes('<Button label="Open testing"')) {
    // Can be valid in a sibling release button, but not on the same Card line.
    if (/<Card[^\n]*onPress=\{\(\) => go\('releases'\)\}/.test(result.overview.source)) throw Error('Nested release card self-check failed');
  }
  const changes = Object.keys(checks).filter(k => result[k].source !== original[k]);
  for (const k of Object.keys(result)) console.log(`${k}: ${result[k].message}`);
  if (dryRun) { console.log(`Dry run: ${changes.length} source files would change. No files written.`); return changes; }
  const written = [];
  try {
    for (const k of changes) {
      const target = path.join(root, files[k]);
      fs.writeFileSync(target + '.np533tmp', result[k].source);
      fs.renameSync(target + '.np533tmp', target);
      written.push(k);
    }
  } catch (e) {
    for (const k of written) fs.writeFileSync(path.join(root, files[k]), original[k]);
    for (const k of changes) { try { fs.unlinkSync(path.join(root, files[k]) + '.np533tmp'); } catch { /* absent */ } }
    throw e;
  }
  console.log(`Niyarvo Projects 0.5.33 selective merge applied: ${changes.length} changed source files.`);
  console.log('Desktop layout, portrait mode, theme, persistence, gesture engines and native breakpoints preserved.');
  return changes;
}
if (require.main === module) {
  try { apply({ dryRun: process.argv.includes('--dry-run') }); }
  catch (e) { console.error(`0.5.33 merge NOT applied: ${e.message}`); process.exitCode = 1; }
}
module.exports = { transformTasks, transformOverview, transformBoard, transformTimeline, apply };
