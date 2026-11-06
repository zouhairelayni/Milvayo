// /tests/timeline/timeline-drag-scroll-0515.test.cjs
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const follow = require('../../src/gestures/dragFollow.cjs');

test('scrollSince: how far the chart scrolled since the lift, per axis', () => {
  assert.deepEqual(follow.scrollSince({ x: 340, y: 90 }, { x: 100, y: 40 }, 'xy'), { x: 240, y: 50 });
  assert.deepEqual(follow.scrollSince({ x: 340, y: 90 }, { x: 100, y: 40 }, 'x'), { x: 240, y: 0 });
  assert.deepEqual(follow.scrollSince({ x: 60, y: 0 }, { x: 100, y: 0 }, 'x'), { x: -40, y: 0 }, 'scrolling back gives a negative shift');
  assert.deepEqual(follow.scrollSince(null, null, 'xy'), { x: 0, y: 0 });
  assert.deepEqual(follow.scrollSince({ x: NaN, y: 5 }, { x: 0, y: 0 }, 'xy'), { x: 0, y: 5 });
});

test('isStale: a missing or old heartbeat means the drag is gone', () => {
  assert.equal(follow.isStale(10_000, 9_900, 1500), false);
  assert.equal(follow.isStale(10_000, 8_000, 1500), true);
  assert.equal(follow.isStale(10_000, 0, 1500), true, 'no beat ever');
  assert.equal(follow.isStale(10_000, undefined, 1500), true);
  assert.equal(follow.isStale(10_000, 8_500, 1500), false, 'exactly at the limit is still alive');
});

test('keepWhole: dragged or lifted bars are never clipped away', () => {
  assert.equal(follow.keepWhole(true, false), true);
  assert.equal(follow.keepWhole(false, true), true);
  assert.equal(follow.keepWhole(false, false), false);
});

test('native hook follows the chart scroll and always ends the drag', () => {
  const g = read('src/gestures/gesture.native.js');
  assert.match(g, /dragFollow\.cjs/);
  assert.match(g, /scrollX\.value = moved\.x/, 'scroll since lift is copied to a shared value');
  assert.match(g, /requestAnimationFrame\(loop\)/);
  assert.match(g, /cb\.onBeat\(\)/, 'heartbeat every frame while lifted');
  assert.match(g, /return \{ gesture, x, y, scrollX, scrollY, lifted \}/);
  assert.doesNotMatch(g, /setInterval|PanResponder/, 'existing contract: no interval in the native hook');
  // unmount while lifted must reach onCancel
  assert.match(g, /if \(active\.current\) \{\s*active\.current = false;\s*callbacks\.current\.onCancel\?\.\(\);/);
  // a finalized gesture that never reported success is closed by settle()
  assert.match(g, /scheduleOnRN\(settle\)/);
  assert.match(g, /scheduleOnRN\(finish/);
  assert.match(g, /else callbacks\.current\.onCancel\?\.\(\)/);
  // the loop must stop with the drag
  assert.match(g, /stopLoop\(\);\s*scrollX\.value = 0/);
});

test('native surface adds the scroll shift to the bar translation on the UI thread', () => {
  const s = read('src/gestures/gestureSurface.native.js');
  assert.match(s, /translateX\.value \+ scrollX\.value/);
  assert.match(s, /translateY\.value \+ scrollY\.value/);
  assert.match(s, /const scrollX = drag\.scrollX \|\| none/);
});

test('Timeline keeps the dragged bar mounted and whole, and stops stale auto-scroll', () => {
  const t = read('src/screens/timeline/Timeline.js');
  assert.match(t, /dragFollow\.keepWhole\(dragging, hot \|\| ln\.lifted\)/);
  assert.match(t, /if \(!whole && \(left < paintLeft - 56/, 'dragged milestone is not unmounted');
  assert.match(t, /const left = whole \? clipped\.left : Math\.max\(clipped\.left, paintLeft\)/);
  assert.match(t, /dragging=\{\(!!drag && drag\.id === t\.id\) \|\| \(!!link && link\.from === t\.id\)\}/);
  assert.equal((t.match(/onBeat: \(\) => \{ k\.beat = Date\.now\(\); \}/g) || []).length, 2, 'bar drag and link drag both beat');
  assert.match(t, /dragFollow\.isStale\(Date\.now\(\), k\.beat, BEAT_LIMIT_MS\)/);
  assert.doesNotMatch(t, /Platform\.OS !== 'web' && dragFollow\.isStale/, 'web beats too, so the watchdog covers it');
  // the existing contract: native chart scrolling is never disabled during a drag
  assert.match(t, /scrollEnabled=\{Platform\.OS === 'web' \? !pinching && !active : true\}/);
});

test('web hook: a touch drag survives the browser pan, ends cleanly and beats', () => {
  const w = read('src/gestures/gesture.web.js');
  assert.match(w, /document\.addEventListener\('touchmove', block, \{ passive: false \}\)/, 'stops the pan that sends pointercancel on phones');
  assert.match(w, /document\.addEventListener\('selectstart', block\)/);
  assert.match(w, /document\.addEventListener\('contextmenu', block\)/);
  assert.match(w, /callbacks\.current\.onBeat\?\.\(\); sync\(\)/);
  assert.match(w, /if \(wasActive\) callbacks\.current\.onCancel\?\.\(\)/, 'unmount mid-drag reaches onCancel');
  // the handler is attached AFTER the lift, never at contact, so ordinary swipes still scroll
  const lift = w.indexOf('s.active = true');
  assert.ok(lift > 0 && w.indexOf("'touchmove', block") > lift);
  assert.doesNotMatch(w, /PanResponder\.create|onStartShouldSetResponder:|onStartShouldSetPanResponder:/);
});

const edit = require('../../src/timeline/timelineEdit.cjs');
const gantt = require('../../src/timeline/gantt.cjs');
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
const fmt = (iso) => iso;
const base = { start: '2026-11-02', due: '2026-11-06' }; // 5 days

test('RULE: a move keeps the duration, a resize changes it', () => {
  const dur = (r) => edit.durationDays(r.start, r.due, daysBetween);
  assert.equal(dur(base), 5);
  for (const n of [-9, -1, 0, 3, 40]) assert.equal(dur(edit.apply('move', base, n, addDays)), 5, `move by ${n}`);
  assert.equal(dur(edit.apply('due', base, 3, addDays)), 8, 'right edge out: longer');
  assert.equal(dur(edit.apply('due', base, -2, addDays)), 3, 'right edge in: shorter');
  assert.equal(dur(edit.apply('start', base, -2, addDays)), 7, 'left edge out: longer');
  assert.equal(dur(edit.apply('start', base, 2, addDays)), 3, 'left edge in: shorter');
  assert.deepEqual(edit.apply('due', base, 3, addDays), { start: '2026-11-02', due: '2026-11-09' }, 'right edge keeps the start');
  assert.deepEqual(edit.apply('start', base, -2, addDays), { start: '2026-10-31', due: '2026-11-06' }, 'left edge keeps the due date');
});

test('RULE: a resize never goes below one day', () => {
  assert.deepEqual(edit.apply('due', base, -30, addDays), { start: '2026-11-02', due: '2026-11-02' });
  assert.deepEqual(edit.apply('start', base, 30, addDays), { start: '2026-11-06', due: '2026-11-06' });
  assert.equal(edit.durationDays('2026-11-02', '2026-11-02', daysBetween), 1);
});

test('RULE: a resize is recorded as a duration change, a move as a move', () => {
  const h = { fmt, daysBetween };
  const longer = edit.apply('due', base, 3, addDays);
  assert.equal(edit.commitLabel('due', 'Build', base, longer, h), 'Changed duration of "Build" from 5 days to 8 days (2026-11-02 to 2026-11-09)');
  const shorter = edit.apply('start', base, 4, addDays);
  assert.equal(edit.commitLabel('start', 'Build', base, shorter, h), 'Changed duration of "Build" from 5 days to 1 day (2026-11-06 to 2026-11-06)');
  assert.equal(edit.commitLabel('move', 'Build', base, edit.apply('move', base, 7, addDays), h), 'Moved "Build" to 2026-11-09');
  assert.equal(edit.isResize('start') && edit.isResize('due'), true);
  assert.equal(edit.isResize('move'), false);
  assert.ok(gantt, 'gantt module still loads');
});

test('Timeline uses the shared edit rules and previews every drag so dependency lines stay on the bar', () => {
  const t = read('src/screens/timeline/Timeline.js');
  assert.match(t, /timelineEdit\.commitLabel\(mode, t\.title/);
  assert.match(t, /timelineEdit\.apply\(mode, base, days, addDays\)/);
  assert.doesNotMatch(t, /Changed start of|Changed due date of/);
  assert.doesNotMatch(t, /Platform\.OS === 'web' \|\| mode !== 'move'/, 'move previews on native too');
  assert.doesNotMatch(t, /animate=/, 'no UI-thread bar translation: the bar and its lines move together');
  assert.match(read('AGENTS.md'), /resize of a task in the Timeline is a duration modification/i);
});
