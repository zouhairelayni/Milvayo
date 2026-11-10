// /tests/app/folder-structure.test.cjs
'use strict';
// Keeps the folder structure honest: code lives in src/, tests in tests/<group>/, every code file names its own path.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const CODE = /\.(js|cjs|py)$/;
const SKIP = new Set(['node_modules', '.git', '.expo', '.opencode', 'MilvayoRedesignPreview', 'dist', 'docs', 'assets']);
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (SKIP.has(e.name)) return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const files = walk(root).map(rel);
const code = files.filter((f) => CODE.test(f) || f === 'firestore.rules' || f === 'storage.rules');

test('the project root holds no code files except the Expo entry App.js', () => {
  const stray = fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && CODE.test(e.name) && !['App.js', 'metro.config.js'].includes(e.name)).map((e) => e.name);
  assert.deepEqual(stray, []);
  assert.match(fs.readFileSync(path.join(root, 'App.js'), 'utf8'), /from '\.\/src\/app\/App'/);
});

test('src has no loose code files, and tests/ has no loose code files except run-all.cjs', () => {
  assert.deepEqual(fs.readdirSync(path.join(root, 'src'), { withFileTypes: true }).filter((e) => e.isFile() && CODE.test(e.name)).map((e) => e.name), []);
  const loose = fs.readdirSync(path.join(root, 'tests'), { withFileTypes: true }).filter((e) => e.isFile() && CODE.test(e.name)).map((e) => e.name);
  assert.deepEqual(loose, ['run-all.cjs']);
});

test('every test is a *.test.cjs inside a tests/<group>/ folder', () => {
  const bad = code.filter((f) => f.startsWith('tests/') && !/^tests\/[\w-]+\/[\w.-]+\.cjs$/.test(f) && f !== 'tests/run-all.cjs');
  assert.deepEqual(bad, []);
  const named = code.filter((f) => /^tests\/(?!helpers\/)[\w-]+\//.test(f) && !f.endsWith('.test.cjs'));
  assert.deepEqual(named, []);
});

test('every code file starts with a comment holding its own /path', () => {
  const wrong = [];
  for (const f of code) {
    const lines = fs.readFileSync(path.join(root, f), 'utf8').split('\n');
    const first = lines[0].startsWith('#!') ? lines[1] : lines[0];
    const mark = f.endsWith('.py') ? '# /' : '// /';
    if (first !== mark + f) wrong.push(f);
  }
  assert.deepEqual(wrong, []);
});

test('every relative import and require in App.js, src, tests and scripts points to a real file', () => {
  const re = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|\brequire\.resolve\s*\(\s*)(['"])(\.{1,2}\/[^'"\n$\\]*)\1/g;
  const exts = ['', '.js', '.cjs', '.web.js', '.native.js', '.json', '/index.js'];
  const missing = [];
  for (const f of code.filter((x) => /\.(js|cjs)$/.test(x) && /^(App\.js|src\/|tests\/|scripts\/)/.test(x))) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    for (const m of text.matchAll(re)) {
      const base = path.resolve(path.dirname(path.join(root, f)), m[2]);
      if (!exts.some((e) => fs.existsSync(base + e) && fs.statSync(base + e).isFile())) missing.push(f + ' -> ' + m[2]);
    }
  }
  assert.deepEqual(missing, []);
});
