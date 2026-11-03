// /src/domain/specifications.cjs
'use strict';
// Add, edit and delete the specification entries kept on a project: phases, data schemas, API contracts, playbooks.
// Length limits and defaults are applied by the project normaliser in model.cjs when the project is saved.
const KINDS = {
  phases: { label: 'phase', prefix: 'phase', fields: ['name', 'stage', 'description', 'goal', 'exit'] },
  schemas: { label: 'data schema', prefix: 'schema', fields: ['name', 'description', 'content'] },
  apiContracts: { label: 'API contract', prefix: 'api', fields: ['name', 'description'] },
  playbooks: { label: 'playbook', prefix: 'playbook', fields: ['name', 'description'] },
};
const STAGES = ['Development', 'Testing', 'Production'];
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const kindOf = (k) => { const d = KINDS[k]; if (!d) throw Error('Unknown specification type'); return d; };

// entry without id adds; entry with id replaces the fields it carries.
function save(project, kind, entry) {
  const d = kindOf(kind);
  const name = String((entry && entry.name) || '').trim();
  if (!name) throw Error(`Give the ${d.label} a name.`);
  if (kind === 'phases' && entry.stage && !STAGES.includes(entry.stage)) throw Error('Choose Development, Testing or Production.');
  const clean = {};
  for (const f of d.fields) if (entry[f] !== undefined) clean[f] = String(entry[f]);
  clean.name = name;
  const list = project[kind] || [];
  const at = entry.id ? list.findIndex((x) => x.id === entry.id) : -1;
  if (entry.id && at < 0) throw Error(`The ${d.label} no longer exists.`);
  const next = at < 0 ? [...list, { id: newId(d.prefix), ...clean }] : list.map((x, i) => (i === at ? { ...x, ...clean } : x));
  return { ...project, [kind]: next };
}

function remove(project, kind, id) {
  const d = kindOf(kind);
  const list = project[kind] || [];
  if (!list.some((x) => x.id === id)) throw Error(`The ${d.label} no longer exists.`);
  const next = { ...project, [kind]: list.filter((x) => x.id !== id) };
  // Tasks keep a phaseId; a deleted phase must not leave it dangling.
  if (kind === 'phases') next.tasks = (project.tasks || []).map((t) => (t.phaseId === id ? { ...t, phaseId: '' } : t));
  return next;
}

module.exports = { KINDS, STAGES, save, remove };
