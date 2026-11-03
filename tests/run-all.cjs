// /tests/run-all.cjs
'use strict';
// Runs every *.test.cjs under tests/ and its subfolders (npm test calls this file).
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return walk(p);
  return e.name.endsWith('.test.cjs') ? [p] : [];
});

const files = walk(__dirname).sort();
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
