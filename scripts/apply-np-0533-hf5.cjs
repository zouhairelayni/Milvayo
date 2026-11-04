// /scripts/apply-np-0533-hf5.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const payload = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/np533-hf5-hunks.json'), 'utf8'));
const dry = process.argv.includes('--dry-run');
const planned = [];
const done = [];
const errors = [];
const expectedSource = 'src/app/ModernApp.js';

// Compatibility with users' existing HF1/HF4 source variants, without replacing theme exports.
const rivnaOverlay = 'src/ui/theme/rivnaPalette.cjs';
const overlayFile = path.join(root, rivnaOverlay);
if (!fs.existsSync(overlayFile)) {
  console.error('HF5 compatibility support is missing: ' + rivnaOverlay);
  process.exit(1);
}
function adaptTimelineState(source) {
  if (/const \[taskPanel,\s*setTaskPanel\]/.test(source)) return source;
  const re = /(^[ \t]*)const \[showUnscheduled,\s*setShowUnscheduled\]\s*=\s*useState\(false\);/m;
  if (!re.test(source)) return null;
  return source.replace(re, (_, indent) => indent + 'const [taskPanel, setTaskPanel] = useState(null);');
}
function adaptTimelineActions(source) {
  const title = source.indexOf('title="Timeline"');
  if (title < 0 || source.indexOf('title="Timeline"', title + 1) !== -1) return null;
  const page = source.lastIndexOf('<Page', title);
  const actions = source.indexOf('actions={', title);
  const scroll = source.indexOf('scrollRef={pageRef}', actions);
  if (page < 0 || actions < 0 || scroll < 0 || actions - title > 1000 || scroll - actions > 2000) return null;
  // Do not swallow unrelated Page props: require the actions expression to close before scrollRef.
  let depth = 0;
  let end = -1;
  for (let i = actions + 'actions='.length; i < scroll; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) { end = i; break; }
  }
  if (end < 0 || source.slice(end + 1, scroll).trim()) return null;
  const original = source.slice(actions, end + 1);
  const segment = original.match(/<Segmented\b[\s\S]*?\/>/);
  if (!segment || !/value=\{zoom\}/.test(segment[0]) || !/onChange=\{setZoom\}/.test(segment[0])) return null;
  const tags = [...original.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map(m => m[1]);
  if (tags.some(tag => tag !== 'Segmented' && tag !== 'Chip')) return null;
  const labels = [...original.matchAll(/<Chip\b[^\n]*?label=["']([^"']+)["']/g)].map(m => m[1].toLowerCase());
  const allowed = new Set(['critical path', 'first task', 'today']);
  if (labels.some(label => !allowed.has(label))) return null;
  // The three chart-navigation chips are moved to the chart ribbon by a later hunk.
  const lineStart = source.lastIndexOf('\n', actions) + 1;
  const indentation = source.slice(lineStart, actions);
  return source.slice(0, actions) + 'actions={' + segment[0] + '}\n' + indentation + source.slice(scroll);
}
function adaptDiagnosticsTest(source) {
  const expected = "assert.match(s,/showItems \u005c\? 'Hide Items' : 'Show Items'/);";
  if (source.includes(expected) || /assert\.match\(s,\s*\/showItems\s*\\\?/.test(source)) return source;
  // Rewrite only a Timeline assertion that explicitly expects a literal Items label.
  const old = /assert\.match\(s\s*,\s*\/[^\/\n]*\bItems\b[^\/\n]*\/\s*\);?/g;
  const matches = [...source.matchAll(old)];
  if (matches.length === 1) return source.replace(old, expected);
  if (matches.length > 1) return null;
  // Some releases removed the old Items assertion. Do not invent or delete an unrelated assertion.
  if (source.includes('timeline shows all scheduled rows') && source.includes("src/screens/timeline/Timeline.js")) return source;
  return null;
}

// Keep any existing HF1-specific ThemeProvider behavior if that source differs from the fixture.
const themeRequire = 'require(' + "'./theme.cjs')";
function preserveThemeProvider(original) {
  if (!original.includes('ThemeContext') || !original.includes('useTheme') || !original.includes('ThemeProvider') || !original.includes(themeRequire)) return null;
  if (!/export const useTheme\s*=\s*\(\)\s*=>\s*useContext\(ThemeContext\);?/.test(original)) return null;
  let value = original;
  if (!value.includes('npRivnaPalette')) value = value.replace(themeRequire + ';', themeRequire + ';\nconst { palette: npRivnaPalette } = '+ themeRequire + ';');
  value = value.replace(/export const LIGHT\s*=\s*\{[\s\S]*?\n\};/, "export const LIGHT = npRivnaPalette('Orange', 'light');");
  value = value.replace(/export const DARK\s*=\s*\{[\s\S]*?\n\};/, "export const DARK = npRivnaPalette('Orange', 'dark');");
  if (!/export const AMOLED/.test(value)) value = value.replace(/export const DARK[^\n]*\n/, match => match + "export const AMOLED = npRivnaPalette('Orange', 'amoled');\n");
  value = value.replace(/\['system',\s*'light',\s*'dark'\]/g, "['system','light','dark','amoled']");
  value = value.replace(/\['system',\s*'dark',\s*'light'\]/g, "['system','dark','light','amoled']");
  value = value.replace(/export const useTheme\s*=\s*\(\)\s*=>\s*useContext\(ThemeContext\);?/, `export const useTheme = () => {
  const value = useContext(ThemeContext);
  const c = useMemo(() => ({ ...value.c, ...npRivnaPalette(value.accentPref, value.mode) }), [value.c, value.accentPref, value.mode]);
  return useMemo(() => ({ ...value, c }), [value, c]);
};`);
  if (!/import \{[^}]*useMemo[^}]*\} from 'react'/.test(value)) value = value.replace(/import \{([^}]+)\} from 'react';/, (_, names) => `import { ${names.trim()}, useMemo } from 'react';`);
  return value;
}
function preserveCommonThemeExports(original, latest) {
  if (!original.includes('DEFAULT_ACCENT') || !original.includes('STORAGE_KEY') || !original.includes('ACCENTS') || !original.includes('themeTokens') || !original.includes('module.exports')) return null;
  const out = original.match(/module\.exports\s*=\s*\{([^}]+)\}/);
  if (!out) return null;
  const allowed = new Set(['DEFAULT_ACCENT', 'STORAGE_KEY', 'ACCENTS', 'findAccent', 'themeTokens', 'palette', 'contrast', 'buttonInk']);
  if (out[1].split(',').map(x => x.trim().split(':')[0].trim()).some(name => !allowed.has(name))) return null;
  return latest;
}
const shell = fs.readFileSync(path.join(root, expectedSource), 'utf8');
if (!/LayoutProvider/.test(shell)) {
  console.error('HF5 refused: restore the v0.5.31 Desktop HF1/HF2 shell before merging.');
  process.exit(1);
}
const timeline = fs.readFileSync(path.join(root, 'src/screens/timeline/Timeline.js'), 'utf8');
if (!timeline.includes('np533DependencyColor')) {
  console.error('HF5 refused: apply the HF4 colored dependencies and mobile-browser patch first.');
  process.exit(1);
}
for (const item of payload.files) {
  const file = path.resolve(root, item.path);
  if (!file.startsWith(root + path.sep)) { errors.push(`${item.path}: invalid path`); continue; }
  if (!fs.existsSync(file)) { errors.push(`${item.path}: missing source`); continue; }
  let source = fs.readFileSync(file, 'utf8');
  let changed = 0;
  // Existing installations expose additional theme helpers. Keep all original
  // exports and append the RIVNA palette as an additive, reversible adapter.
  if (item.path === 'src/ui/theme/theme.cjs') {
    if (!/module\.exports/.test(source)) { errors.push('src/ui/theme/theme.cjs: unexpected export format; no files written'); continue; }
    const suffix = 'Object.assign(module.exports, require(\'./rivnaPalette.cjs\'));';
    if (!source.includes(suffix)) { source = source.trimEnd() + '\n\n' + suffix + '\n'; changed++; }
    planned.push({ file, source, path: item.path, changed });
    continue;
  }
  for (const [index, chunk] of item.chunks.entries()) {
    const beforeCount = source.split(chunk.before).length - 1;
    const afterCount = source.split(chunk.after).length - 1;
    if (beforeCount === 1) {
      source = source.replace(chunk.before, chunk.after);
      changed++;
    } else if (afterCount === 1) {
      // An already-applied hunk is a no-op.
    } else if (item.path === 'src/screens/timeline/Timeline.js' && index === 2) {
      const adapted = adaptTimelineActions(source);
      if (adapted === null) { errors.push('Timeline: toolbar contains unexpected controls; no files written'); break; }
      if (adapted !== source) { source = adapted; changed++; }
    } else if (item.path === 'src/screens/timeline/Timeline.js' && index === 1) {
      const adapted = adaptTimelineState(source);
      if (adapted === null) { errors.push('Timeline: unable to identify the previous scheduling-panel state; no files written'); break; }
      if (adapted !== source) { source = adapted; changed++; }
    } else if (item.path === 'tests/diagnostics/diagnostics-048.test.cjs' && index === 0) {
      const adapted = adaptDiagnosticsTest(source);
      if (adapted === null) { errors.push('diagnostics test: previous Items assertion not recognized; no files written'); break; }
      if (adapted !== source) { source = adapted; changed++; }
    } else if (item.path === 'src/ui/theme/theme.js' && source.includes('npRivnaPalette') && source.includes('export const AMOLED')) {
      // The provider-preserving adaptation is already installed.
    } else if (item.path === 'src/ui/theme/theme.js' && index === 0) {
      const adapted = preserveThemeProvider(source);
      if (adapted && adapted !== source) { source = adapted; changed++; }
      else { errors.push(`${item.path}: unknown theme provider; no files written`); break; }
    } else if (item.path === 'src/ui/theme/theme.cjs' && index === 0) {
      const adapted = preserveCommonThemeExports(source, chunk.after);
      if (adapted && adapted !== source) { source = adapted; changed++; }
      else { errors.push(`${item.path}: unknown theme exports; no files written`); break; }
    } else {
      errors.push(`${item.path}: source differs at hunk ${index + 1}; no files written`);
      break;
    }
  }
  planned.push({ file, source, path: item.path, changed });
}
if (errors.length) {
  console.error('HF5 refused to merge against unexpected source:\n - ' + errors.join('\n - '));
  process.exit(1);
}
const toWrite = planned.filter(p => p.changed);
for (const p of toWrite) console.log(`${dry ? 'Would update' : 'Updated'}: ${p.path}`);
if (dry) {
  console.log(`DRY RUN: ${toWrite.length} source/test files would change. No files written.`);
  process.exit(0);
}
for (const p of toWrite) {
  const temporary = p.file + '.np533hf5.tmp';
  fs.writeFileSync(temporary, p.source);
  fs.renameSync(temporary, p.file);
  done.push(p.path);
}
console.log(`HF5 applied: ${done.length} files changed. Desktop shell, persistence and gestures untouched.`);
