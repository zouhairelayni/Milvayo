// /src/screens/overview/today.cjs
'use strict';

// Read-only daily view; missing dependencies remain visible as blockers.
function todayTasks(tasks, today) {
  const byId = new Map(tasks.map(t => [t.id, t]));
  const open = tasks.filter(t => t.status !== 'Done');
  const dated = t => /^\d{4}-\d{2}-\d{2}$/.test(t.due || '');
  const attention = open.map(task => ({
    task,
    overdue: dated(task) && task.due < today,
    blockers: (task.dependsOn || []).filter(id => byId.get(id)?.status !== 'Done'),
  })).filter(x => x.overdue || x.blockers.length)
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.task.due || '9999').localeCompare(b.task.due || '9999'));
  const upcoming = open.filter(t => dated(t) && t.due >= today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  return { attention, upcoming };
}

module.exports = { todayTasks };
