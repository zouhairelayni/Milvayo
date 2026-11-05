# NP-SCHED1 — Scheduling engine contract and safe UI integration

**Baseline:** Milvayo `v0.2.5`, independently developed, React Native + Expo SDK 58. **Batch:** NP-SCHED1 (engine-only, not a new app version). **Branch:** `work`. **Owner of current UI:** parallel Sonnet redesign; do **not** overwrite its App.js, GanttView.js, design tokens, or Metro setup.

## Delivered functionality

Pure module: `src/scheduling.cjs`, dependency-free and usable in Web/Android/iOS JavaScript.

- UTC, date-only calendar arithmetic; `mode: 'calendar'` or `mode: 'workdays'`, selected weekdays ISO 1=Monday to 7=Sunday, one-off `closed`/`opened` date exceptions.
- Four constraint types: **FS** (finish-to-start), **SS** (start-to-start), **FF** (finish-to-finish), **SF** (start-to-finish).
- Signed, integer `lagDays` (-365..365). Negative lag is lead/overlap. In workdays mode, lag counts eligible days. FS zero-lag means *first eligible day after* predecessor finish; SS/FF/SF use the same eligible anchor day.
- Audits for conflicting or unscheduled dependencies; directed acyclic graph validation and duplicate-edge checks.
- Explicit **push-only** cascade from `changedTaskIds`: never pulls a task earlier, never alters the explicitly edited anchor, and preserves inclusive duration and due-only milestone representation. Multiple predecessors: the latest required start wins.
- Transaction-like **preview → apply**: the preview makes no changes. Applying verifies a project/task state stamp and fails for stale data or unresolved issues. Moved tasks lose `verified` and `merged` flags.
- No mutation of input objects, no storage/network access, no automatic imports or silent migration.

## API example

```js
const s = require('./src/scheduling.cjs');
const options = {
  changedTaskIds: ['TASK-1'],
  calendar: {
    mode: 'workdays',
    weekdays: [1, 2, 3, 4, 5],
    closed: ['2026-11-09'], // optional holiday
    opened: []               // optional working weekend exception
  },
  typedLinks: [
    { predecessorId: 'TASK-1', successorId: 'TASK-2', type: 'FS', lagDays: 1 }
  ]
};

const audit = s.auditSchedule(project, options); // READ ONLY
const preview = s.previewCascade(project, options); // READ ONLY
if (preview.canApply) {
  // Show proposed changes in a confirmation sheet, with a Cancel action.
  // Create a workspace snapshot using the existing model first.
  // After confirmation only, pass the latest project to applyCascade.
  const scheduled = s.applyCascade(latestProject, preview);
  // Persist `scheduled` using the app's existing validated workspace update path.
}
```

The above is an integration example, not UI currently wired. `preview.changedTaskIds` means the edited anchor was already updated by the caller's existing task workflow. If date edits have not been committed, preview a cloned project with those edits. Recompute the plan if the workspace changes before confirmation.

## Compatibility with v0.2.5 project files

`task.dependsOn` **remains an array of predecessor IDs**. With no `typedLinks` argument, every existing edge is FS, lag=0, matching the old app's scheduling behavior. `typedLinks` is an **in-memory overlay**, allowed only for edges already present in `dependsOn`. It is *not persisted* by this batch: `makeProject`, import/export, and JSON schema remain untouched. Do not expose SS/FF/SF as a durable UI setting until a separate, reviewed migration adds persistent metadata and round-trip tests.

A future migration should store typed metadata in a strictly validated per-project structure and ensure dependency ID arrays and typed links cannot diverge. It must migrate old workspaces to FS/0 without data loss, preserve backups, and update the task-dependency, Gantt-renderer, conflict/critical-path, JSON schema, and import/export paths **together**.

## Invariants and limitations

- Only explicit user-confirmed schedule changes should be persisted; never run cascade on app startup or on project import.
- A missing or partly scheduled linked task blocks cascade rather than generating guessed dates.
- For workdays mode, scheduled task start/end must fall on eligible dates; the engine reports off-calendar endpoints for user correction. Milestones may have only a due date.
- Endpoints are inclusive: a 3-day non-milestone task starting Monday finishes Wednesday in calendar mode, or Wednesday in a normal Mon–Fri calendar.
- Tasks with large ranges (>100,000 days) are rejected to avoid excessive iteration.
- This is **not** a resource-leveled scheduler, multi-user concurrency system, or full critical-path engine for SS/FF/SF. v0.2.5 `gantt.criticalPath` and connectors still use old FS/calendar assumptions until coordinated Gantt integration.
- The stamp only detects changes to the project identity and task schedule/dependency/verification fields. It is not a cryptographic signature or a substitute for optimistic concurrency control in a future Firebase backend.
- The calendar is passed explicitly and does not persist until project schema migration.

## Integration after Sonnet finishes

1. Use Sonnet's accepted redesigned source as the **new baseline**, after user confirms its Git checkpoint.
2. Add these additive files only. Do not extract the old v0.2.5 complete archive over the redesign.
3. Run `npm test` and `node scripts/schedule-smoke.cjs` in Termux. Ensure Web and Android Metro still start.
4. Review Sonnet's data model and Gantt handlers, then integrate calendar settings, typed link editing, audit indicators and schedule-preview confirmation **as a separate UI patch with Unslop review**.
5. Add integration tests for persistence, restored backups, import/export, release verification, multi-project isolation, and undo before enabling apply in UI.
6. Only after user QA: commit to `work`, review diff and data backups, then merge to `main` as a separate validated release. Firebase remains unconnected.

## Test evidence

- `npm test` on v0.2.5 + NP-SCHED1: **103/103 passing**, comprising 66 baseline and 37 new checks.
- `node scripts/schedule-smoke.cjs`: **PASS** on an isolated three-task sample.
- `node --check` on scheduling module: **PASS**.
- Metro bundling, Expo Go, iOS, visual Unslop acceptance, Firebase and Git actions: **Not run/not performed**.
