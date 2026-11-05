// /src/store/workspaces.cjs
'use strict';
// The list of workspaces. Each workspace is one whole saved workspace object under its own storage key.
// The first workspace keeps the original key, so existing data is never copied or moved (nothing to migrate or interrupt).
const INDEX_KEY = 'niyarvo-workspaces-v1';
const MAIN_KEY = 'milvayo-v1';
const KEY_PREFIX = 'niyarvo-workspace-v1:';
const MAX = 20;
const NAME_MAX = 60;

const cleanName = (raw) => {
  const name = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  if (!name) throw Error('Workspace name required');
  return name;
};
const keyFor = (id) => (id === 'main' ? MAIN_KEY : KEY_PREFIX + id);
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const taken = (items, name, exceptId) => items.some((x) => x.id !== exceptId && same(x.name, name));

function defaultIndex(now = new Date().toISOString()) {
  return { v: 1, activeId: 'main', items: [{ id: 'main', name: 'Main workspace', createdAt: now }] };
}

// Reads whatever was saved. Anything unreadable falls back to a safe list; the data under the keys is never touched here.
function parseIndex(raw) {
  let value = null;
  try { value = raw ? JSON.parse(raw) : null; } catch { value = null; }
  const seen = new Set();
  const items = (Array.isArray(value && value.items) ? value.items : []).filter((x) => {
    if (!x || typeof x.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(x.id) || seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  }).slice(0, MAX).map((x) => {
    let name; try { name = cleanName(x.name); } catch { name = 'Workspace'; }
    return { id: x.id, name, createdAt: typeof x.createdAt === 'string' ? x.createdAt : '' };
  });
  if (!items.length) return defaultIndex();
  return { v: 1, items, activeId: items.some((x) => x.id === (value && value.activeId)) ? value.activeId : items[0].id };
}

// Interrupted create or delete: list workspaces whose data exists but are not listed, drop listed ones whose data is gone.
function reconcileIndex(index, storedKeys) {
  const have = new Set(storedKeys);
  let items = index.items;
  if (items.length > 1) {
    const live = items.filter((x) => have.has(keyFor(x.id)));
    if (live.length && live.length < items.length) items = live; // never empty the list because of one odd read
  }
  const listed = new Set(items.map((x) => keyFor(x.id)));
  for (const key of storedKeys) {
    if (items.length >= MAX || !key.startsWith(KEY_PREFIX) || listed.has(key)) continue;
    const id = key.slice(KEY_PREFIX.length);
    if (!/^[a-z0-9-]{1,60}$/.test(id)) continue;
    let name = 'Recovered workspace';
    for (let n = 2; taken(items, name); n += 1) name = `Recovered workspace ${n}`;
    items = [...items, { id, name, createdAt: '' }];
  }
  const activeId = items.some((x) => x.id === index.activeId) ? index.activeId : items[0].id;
  return items === index.items && activeId === index.activeId ? index : { v: 1, items, activeId };
}

function addItem(index, rawName, id, now = new Date().toISOString()) {
  const name = cleanName(rawName);
  if (index.items.length >= MAX) throw Error(`Workspace limit (${MAX})`);
  if (taken(index.items, name)) throw Error('A workspace with that name already exists');
  return { ...index, activeId: id, items: [...index.items, { id, name, createdAt: now }] };
}
function renameItem(index, id, rawName) {
  const name = cleanName(rawName);
  if (!index.items.some((x) => x.id === id)) throw Error('Workspace missing');
  if (taken(index.items, name, id)) throw Error('A workspace with that name already exists');
  return { ...index, items: index.items.map((x) => (x.id === id ? { ...x, name } : x)) };
}
// Deleting the open workspace moves to the first one that is left.
function removeItem(index, id) {
  if (!index.items.some((x) => x.id === id)) throw Error('Workspace missing');
  if (index.items.length < 2) throw Error('The last workspace cannot be deleted');
  const items = index.items.filter((x) => x.id !== id);
  return { ...index, items, activeId: index.activeId === id ? items[0].id : index.activeId };
}
const setActive = (index, id) => {
  if (!index.items.some((x) => x.id === id)) throw Error('Workspace missing');
  return index.activeId === id ? index : { ...index, activeId: id };
};

module.exports = { INDEX_KEY, MAIN_KEY, KEY_PREFIX, MAX, keyFor, cleanName, defaultIndex, parseIndex, reconcileIndex, addItem, renameItem, removeItem, setActive };
