// /src/domain/projectTools.cjs
'use strict';
// Per-project switches for optional tools. Switching a tool off only hides its screen and shortcuts: the project's data
// (sprints, releases, tests, costs...) is never read, changed or deleted by a switch.
// Migration: a project saved before this field existed has no `tools`, and normalizeTools turns that into "everything on".
// Nothing is rewritten on load; the field is saved with the project's next ordinary edit. Brand-new projects start LEAN.
// Screen tools hide their matching route; Advanced tasks only changes task-sheet detail.
const TOOLS = Object.freeze([
  Object.freeze({ id: 'sprints', label: 'Sprints', hint: 'Plan work in time-boxed cycles', lean: true }),
  Object.freeze({ id: 'releases', label: 'Releases', hint: 'Release records and sign-off gates', lean: true }),
  Object.freeze({ id: 'testing', label: 'Testing', hint: 'Acceptance checks with evidence', lean: true }),
  Object.freeze({ id: 'activity', label: 'Activity', hint: 'History of changes', lean: true }),
  Object.freeze({ id: 'resources', label: 'Resources', hint: 'Who has capacity this week', lean: false }),
  Object.freeze({ id: 'collaboration', label: 'Collaboration', hint: 'Comments and reminders', lean: false }),
  Object.freeze({ id: 'costs', label: 'Costs', hint: 'Budget against actual spend', lean: false }),
  Object.freeze({ id: 'automations', label: 'Automations', hint: 'Commands that move tasks for you', lean: false }),
  Object.freeze({ id: 'reports', label: 'Reports', hint: 'Progress and delivery summaries', lean: false }),
  Object.freeze({ id: 'specifications', label: 'Specifications', hint: 'Phases, schemas, API contracts and playbooks', lean: false }),
  Object.freeze({ id: 'advancedTasks', label: 'Advanced tasks', hint: 'Detailed planning, dependencies, time and delivery fields', lean: false, screen: false }),
]);
const IDS = TOOLS.map(t => t.id);
const SCREEN_IDS = TOOLS.filter(t => t.screen !== false).map(t => t.id);

const allOn = () => Object.fromEntries(IDS.map(id => [id, true]));
const LEAN = Object.freeze(Object.fromEntries(TOOLS.map(t => [t.id, t.lean])));

// Lenient on purpose: a damaged or unknown value must never stop a workspace from loading, so it falls back to "on".
function normalizeTools(input) {
  const out = allOn();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const id of IDS) if (input[id] === false) out[id] = false;
  return out;
}

// Creation accepts explicit boolean overrides only; existing imports keep their lenient migration rule.
function initialTools(overrides){
 if(overrides===undefined)return LEAN;
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.entries(overrides).some(([id,on])=>!IDS.includes(id)||typeof on!=='boolean'))throw Error('Invalid initial project tools');
 return {...LEAN,...overrides};
}
const isTool = id => IDS.includes(id);
// Screens that are not a tool (board, tasks, overview, settings...) are always on.
const screenOn = (tools, screen) => !SCREEN_IDS.includes(screen) || normalizeTools(tools)[screen] !== false;

function setTool(tools, id, on) {
  if (!isTool(id)) throw Error('Unknown tool');
  return { ...normalizeTools(tools), [id]: on === true };
}

module.exports = { TOOLS, IDS, SCREEN_IDS, LEAN, allOn, normalizeTools, isTool, screenOn, setTool, initialTools };
