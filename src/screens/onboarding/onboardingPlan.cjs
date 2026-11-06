// /src/screens/onboarding/onboardingPlan.cjs
'use strict';
// Content and rules of the first-run tour. Pure: no storage, no React.
// Starter configuration is passed to the existing project creation transaction. Skipping changes nothing.
const projectTools=require('../../domain/projectTools.cjs');
const SLIDES = Object.freeze([
  Object.freeze({ id: 'board', art: 'board', title: 'Plan on a board', body: 'Move cards between stages and keep every task in view' }),
  Object.freeze({ id: 'timeline', art: 'timeline', title: 'See the schedule', body: 'Bars, dependencies and today on one timeline' }),
  Object.freeze({ id: 'release', art: 'release', title: 'Ship with checks', body: 'Gate each release on acceptance checks you can verify' }),
]);

// `off` lists optional tools the starter switches off for the new project. A switch only hides a screen; data is never touched.
const FOCUS_OFF = Object.freeze(['sprints', 'releases', 'testing']);
const STARTERS = Object.freeze([
  Object.freeze({ id: 'board', art: 'board', label: 'Board', hint: 'Cards in stages, with List and Timeline', off: FOCUS_OFF, screen: 'board' }),
  Object.freeze({ id: 'sprints', art: 'sprint', label: 'Sprints', hint: 'Time-boxed cycles and a burndown', off: Object.freeze([]), screen: 'sprints' }),
  Object.freeze({ id: 'timeline', art: 'timeline', label: 'Timeline', hint: 'Dates first, with dependencies', off: FOCUS_OFF, screen: 'timeline' }),
  Object.freeze({ id: 'blank', art: 'blank', label: 'Blank', hint: 'Start empty and add tools later', off: FOCUS_OFF, screen: 'board' }),
]);
const starterTools=id=>Object.fromEntries(Object.entries(projectTools.LEAN).map(([tool,on])=>[tool,starterPlan(id).off.includes(tool)?false:on]));
const DEFAULT_STARTER = 'board';
const STEPS = Object.freeze(['tour', 'start', 'name']);
const NAME_MAX = 180; // same limit as the Create project sheet

const starterPlan = (id) => STARTERS.find((s) => s.id === id) || STARTERS.find((s) => s.id === DEFAULT_STARTER);
const validName = (name) => { const n = String(name == null ? '' : name).trim(); return n.length > 0 && n.length <= NAME_MAX; };
const stepAfter = (step) => STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)];
const stepBefore = (step) => STEPS[Math.max(STEPS.indexOf(step) - 1, 0)];
// "Fresh install" means no workspace index and no workspace under the original key: an upgrade from any older release never qualifies.
const isFreshInstall = (indexValue, mainValue) => indexValue == null && mainValue == null;

module.exports = { SLIDES, STARTERS, STEPS, DEFAULT_STARTER, NAME_MAX, starterPlan, starterTools, validName, stepAfter, stepBefore, isFreshInstall };
