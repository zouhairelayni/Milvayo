// /src/governance/diagramCache.cjs
'use strict';
// In-memory only. Full semantic keys avoid hash collisions and survive immutable store normalization.
const revisions = new WeakMap();
function diagramRevision(nodes, name) {
  const old = revisions.get(nodes);
  if (old?.name === name) return old;
  const structure = JSON.stringify([nodes.map(n => [n.id, n.parent, n.id === 'w0' ? name || n.name || 'Project' : n.name || 'Untitled'])]);
  const parents = new Set(nodes.map(n => n.parent));
  const hours = JSON.stringify(nodes.map(n => parents.has(n.id) ? 0 : Number(n.hours) || 0));
  const next = { name, structure, hours, full: JSON.stringify([structure, hours]) };
  revisions.set(nodes, next);
  return next;
}

function createDiagramCache({ maxEntries = 12, maxBytes = 8 * 1024 * 1024, now = () => performance.now() } = {}) {
  const entries = new Map();
  let bytes = 0;
  const counts = { hits: 0, misses: 0, evictions: 0, calculations: {} };
  function get(parts, build, estimate = value => 1024 + JSON.stringify(value).length * 2) {
    const key = JSON.stringify(parts);
    if (entries.has(key)) {
      const entry = entries.get(key); entries.delete(key); entries.set(key, entry); counts.hits++;
      return { ...entry, hit: true, ms: 0 };
    }
    const at = now(), value = build(), ms = Math.max(0, now() - at);
    const cost = key.length * 2 + estimate(value);
    counts.misses++;
    const kind = parts[1]; counts.calculations[kind] = (counts.calculations[kind] || 0) + 1;
    const entry = { value, cost, ms };
    // Oversized results are usable by the active view but never retained by the cache.
    if (cost <= maxBytes) {
      while (entries.size && (entries.size >= maxEntries || bytes + cost > maxBytes)) {
        const first = entries.keys().next().value; bytes -= entries.get(first).cost; entries.delete(first); counts.evictions++;
      }
      entries.set(key, entry); bytes += cost;
    }
    return { ...entry, hit: false };
  }
  return {
    get,
    stats: () => ({ ...counts, calculations: { ...counts.calculations }, entries: entries.size, estimatedBytes: bytes, maxEntries, maxBytes }),
    clear: () => { entries.clear(); bytes = 0; counts.hits = counts.misses = counts.evictions = 0; counts.calculations = {}; },
  };
}

const diagramCache = createDiagramCache();
const views = new Map();
function diagramView(scope) {
  const value = views.get(scope) || { view: 'outline', dir: 'down', zoom: 'fit', poses: {}, zooms: {} };
  views.delete(scope); views.set(scope, value);
  while (views.size > 12) views.delete(views.keys().next().value);
  return value;
}
module.exports = { createDiagramCache, diagramCache, diagramRevision, diagramView };
