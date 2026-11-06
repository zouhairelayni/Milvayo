// /src/screens/tasks/dueSoon.cjs
'use strict';
const { dueSoon } = require('../../domain/powerUps.cjs');

// Preserve each board's calendar choice while presenting one project-wide List preview.
function dueSoonForList(project, today) {
  const boards = (project.boards || []).filter(b => !b.archived && (project.powerUps?.[b.id] || []).includes('calendar'));
  const tasks = boards.flatMap(b => dueSoon(project, b.id, today))
    .sort((a, b) => a.due.localeCompare(b.due) || a.position - b.position);
  return { boards, tasks };
}

module.exports = { dueSoonForList };
