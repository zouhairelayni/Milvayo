// /src/app/navigation/visitedTabs.cjs
// Retained tabs are keyed by project, so a project switch rebuilds every retained page. Instead of
// rebuilding all of them at once, the retained set restarts from the visible tab and refills lazily.
function resolveVisited(state, projectId, screen, tabs) {
 if (state && state.projectId === projectId) return state.list;
 return tabs.includes(screen) ? [screen] : [];
}
function addVisited(state, projectId, screen, target, tabs) {
 const base = resolveVisited(state, projectId, screen, tabs);
 if (!tabs.includes(target) || base.includes(target)) return state && state.projectId === projectId ? state : { projectId, list: base };
 return { projectId, list: [...base, target] };
}
module.exports = { resolveVisited, addVisited };
