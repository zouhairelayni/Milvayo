// /src/store/useProjectTools.js
import { useMemo } from 'react';
import { useStore } from './store';
const projectTools = require('../domain/projectTools.cjs');

// Which optional tools are on for the open project: { sprints: true, releases: false, ... }. The object only changes
// identity when a switch changes, so screens do not re-render for ordinary edits.
export function useProjectTools() {
  const { workspace } = useStore();
  const raw = workspace.projects.find(p => p.id === workspace.selectedId)?.tools;
  const key = projectTools.IDS.map(id => (raw?.[id] === false ? 0 : 1)).join('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => projectTools.normalizeTools(raw), [key]);
}
