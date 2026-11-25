// /scripts/qa-evidence.cjs
'use strict';
// One command that runs the Milvayo tests and gathers the evidence into one folder you can zip and send back.
//   node scripts/qa-evidence.cjs              runs `npm test` and then `npm run test:cloud` (the emulator suite; needs Firebase emulators, e.g. Termux)
//   node scripts/qa-evidence.cjs --skip-cloud runs only `npm test`
// It changes nothing in the project. Output goes to qa-evidence/<date-time>/ :
//   EVIDENCE.md        short summary in plain words (version, machine, pass/fail numbers, failed test names)
//   app-tests.log      full output of `npm test`
//   cloud-tests.log    full output of `npm run test:cloud`
//   project-files.txt  list of the project files with sizes and a short checksum, to prove which build was tested
// Logs contain test output only. They do not contain passwords or keys (the project keeps none in the tests), but look before you share.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), os = require('node:os'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const skipCloud = process.argv.includes('--skip-cloud');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const out = path.join(root, 'qa-evidence', stamp);
fs.mkdirSync(out, { recursive: true });

const read = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return ''; } };
// The build label is the newest entry of the changelog (the app.json number is bumped by hand and can lag behind).
const version = (read('docs/changelog/CHANGELOG.md').match(/^## v?(\d+\.\d+\.\d+)/m) || read('app.json').match(/"version"\s*:\s*"([^"]+)"/) || [])[1] || 'unknown';

function run(label, command, args, logName) {
  const started = Date.now();
  console.log('\n== ' + label + ' ==\n' + command + ' ' + args.join(' '));
  const r = cp.spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, shell: process.platform === 'win32' });
  const text = (r.stdout || '') + (r.stderr ? '\n--- errors ---\n' + r.stderr : '') + (r.error ? '\n--- could not start ---\n' + r.error.message : '');
  fs.writeFileSync(path.join(out, logName), text);
  const seconds = Math.round((Date.now() - started) / 1000);
  return { label, text, code: r.status, seconds, logName };
}

// Counts are read from the usual node:test and runner summaries; if a line is missing the summary says "not found" instead of guessing.
function numbers(text) {
  const pick = re => { const m = [...text.matchAll(re)].pop(); return m ? Number(m[1]) : null; };
  return { pass: pick(/^[#ℹ]?\s*pass\s+(\d+)/gim), fail: pick(/^[#ℹ]?\s*fail\s+(\d+)/gim), total: pick(/^[#ℹ]?\s*tests\s+(\d+)/gim) };
}
function failedNames(text) {
  const tap = [...text.matchAll(/^\s*not ok \d+ - (.+)$/gm)].map(m => m[1].trim());
  const after = text.includes('failing tests:') ? text.slice(text.indexOf('failing tests:')) : '';
  const list = [...after.matchAll(/^✖ (.+?) \(\d[\d.]*ms\)\s*$/gm)].map(m => m[1].trim());
  return [...new Set([...tap, ...list])].slice(0, 40);
}
// Plain-words reasons for problems that are not test failures.
function hints(text) {
  const out = [];
  if (/port taken|Port \d+ is not open|could not start Firestore Emulator/i.test(text)) out.push('The emulators could not start because a port is already in use (an old emulator is probably still running). Close it (in Termux: `pkill -f firebase; pkill -f java`), wait 10 seconds and run again.');
  if (/Cannot find module/.test(text)) out.push('A file or package is missing (see the log).');
  return out;
}

const results = [run('App and planner tests', 'npm', ['test'], 'app-tests.log')];
if (!skipCloud) results.push(run('Cloud emulator tests', 'npm', ['run', 'test:cloud'], 'cloud-tests.log'));

// Which files were tested: a list with sizes and a short checksum of each (skips the usual big or private folders).
const skip = new Set(['node_modules', '.git', 'dist', 'android', 'ios', 'qa-evidence', '.expo', 'logs']);
const lines = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (skip.has(name) || name === '.env' || name === 'credentials.json') continue;
    const full = path.join(dir, name), st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else lines.push(path.relative(root, full) + '  ' + st.size + '  ' + crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex').slice(0, 12));
  }
})(root);
fs.writeFileSync(path.join(out, 'project-files.txt'), lines.join('\n') + '\n');
const whole = crypto.createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);

const md = [];
md.push('# Milvayo test evidence', '');
md.push('- Version: ' + version, '- Date (UTC): ' + new Date().toISOString(), '- Machine: ' + os.platform() + ' ' + os.arch() + ', Node ' + process.version, '- Build fingerprint (all project files): ' + whole + ' (' + lines.length + ' files, see project-files.txt)', '');
md.push('Level: Planner-tested / Server-tested only. These runs do NOT prove anything works on two real devices; that is the separate checklist.', '');
for (const r of results) {
  const n = numbers(r.text), ok = r.code === 0;
  md.push('## ' + r.label, '', '- Result: ' + (ok ? 'PASSED' : 'FAILED') + ' (exit code ' + r.code + ', ' + r.seconds + ' s)', '- Numbers: ' + (n.total === null ? 'not found in the log' : n.pass + ' passed, ' + n.fail + ' failed, ' + n.total + ' total'), '- Full log: ' + r.logName);
  const failed = failedNames(r.text);
  if (failed.length) md.push('- Failed tests:', ...failed.map(f => '  - ' + f));
  for (const h of hints(r.text)) md.push('- Probable reason: ' + h);
  md.push('');
}
if (skipCloud) md.push('## Cloud emulator tests', '', '- Skipped (--skip-cloud).', '');
md.push('## Please also attach (by hand, from the app)', '', '1. Settings > Sync > Diagnostics text (copy) from BOTH devices after the test.', '2. Settings > Sync > "Compare with cloud" result from BOTH devices.', '3. A screenshot of the sync banner / line if anything looked wrong, with the time you saw it.', '4. The checklist with Pass / Fail written next to each line.', '');
fs.writeFileSync(path.join(out, 'EVIDENCE.md'), md.join('\n'));

console.log('\nDone. Evidence folder: ' + out);
console.log(md.slice(0, 12).join('\n'));
const zipped = cp.spawnSync('zip', ['-r', '-q', out + '.zip', path.basename(out)], { cwd: path.dirname(out) });
if (zipped.status === 0) console.log('\nSend this file back: ' + out + '.zip');
else console.log('\nZip the folder above and send it back (the "zip" tool was not found).');
process.exit(results.every(r => r.code === 0) ? 0 : 1);
