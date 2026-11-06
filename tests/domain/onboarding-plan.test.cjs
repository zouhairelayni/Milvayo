// /tests/domain/onboarding-plan.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('../../src/screens/onboarding/onboardingPlan.cjs');
const tools = require('../../src/domain/projectTools.cjs');
const { TOUR_KINDS: kinds } = (() => { const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../src/components/illustrations/TourArtwork.js'), 'utf8'); return { TOUR_KINDS: [...src.match(/TOUR_KINDS = \[([^\]]+)\]/)[1].matchAll(/'(\w+)'/g)].map((m) => m[1]) }; })();

test('three slides and four starters, all with drawings that exist', () => {
  assert.equal(p.SLIDES.length, 3);
  assert.deepEqual(p.STARTERS.map((s) => s.id), ['board', 'sprints', 'timeline', 'blank']);
  for (const x of [...p.SLIDES, ...p.STARTERS]) assert.ok(kinds.includes(x.art), x.id);
  assert.ok(Object.isFrozen(p.SLIDES) && Object.isFrozen(p.STARTERS));
});

test('starters switch off only real optional tools and only ever land on a screen that tool set keeps on', () => {
  const ids = new Set(tools.TOOLS ? tools.TOOLS.map((t) => t.id) : Object.keys(tools.LEAN));
  for (const s of p.STARTERS) {
    for (const t of s.off) assert.ok(ids.has(t), `${s.id} switches off unknown tool ${t}`);
    if (s.screen === 'sprints') assert.ok(!s.off.includes('sprints'), 'the Sprints starter keeps Sprints on');
    assert.ok(['board', 'timeline', 'sprints'].includes(s.screen));
  }
  assert.deepEqual(p.starterPlan('sprints').off, []);
  assert.deepEqual(p.starterPlan('board').off, ['sprints', 'releases', 'testing']);
});

test('an unknown starter falls back to the default and never throws', () => {
  assert.equal(p.starterPlan('nope').id, p.DEFAULT_STARTER);
  assert.equal(p.starterPlan(undefined).id, p.DEFAULT_STARTER);
});

test('project name rules match the Create project sheet', () => {
  assert.equal(p.validName(''), false);
  assert.equal(p.validName('   '), false);
  assert.equal(p.validName(null), false);
  assert.equal(p.validName(' Garden planner '), true);
  assert.equal(p.validName('x'.repeat(180)), true);
  assert.equal(p.validName('x'.repeat(181)), false);
});

test('steps move forward and back inside the three steps', () => {
  assert.deepEqual(p.STEPS, ['tour', 'start', 'name']);
  assert.equal(p.stepAfter('tour'), 'start');
  assert.equal(p.stepAfter('name'), 'name');
  assert.equal(p.stepBefore('name'), 'start');
  assert.equal(p.stepBefore('tour'), 'tour');
});

test('only a true first launch is fresh: an upgrade from an older release is never fresh', () => {
  assert.equal(p.isFreshInstall(null, null), true);
  assert.equal(p.isFreshInstall(undefined, undefined), true);
  assert.equal(p.isFreshInstall('{"items":[]}', null), false);
  assert.equal(p.isFreshInstall(null, '{"projects":[]}'), false, 'old install with data under the original key and no index');
  assert.equal(p.isFreshInstall('x', 'y'), false);
});

test('copy follows the writing rules: no exclamation marks and no trailing period on short strings', () => {
  const strings = [...p.SLIDES.flatMap((s) => [s.title, s.body]), ...p.STARTERS.flatMap((s) => [s.label, s.hint])];
  for (const s of strings) { assert.doesNotMatch(s, /!/); assert.doesNotMatch(s, /\.$/); assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}]/u); }
});
