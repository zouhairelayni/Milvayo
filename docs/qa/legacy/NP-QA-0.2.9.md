# NP-QA-0.2.9 — Runtime verification checklist

**Before testing:** export a whole-workspace JSON backup. Keep the stable Git `main` branch unchanged. Work on `work`.

## Data migration and persistence

- [ ] Open an existing v0.2.8 workspace: project names, task IDs, release details, dependency connectors and backups still appear.
- [ ] Create a new task; `0%` and `0` estimated hours are the defaults.
- [ ] Set unfinished leaf progress to 25%, 50%, then 75% and save an estimate; restart Expo Go. Values remain.
- [ ] Change a task with verification/merge records; expected affected records reopen and release safety remains sound.
- [ ] Set a leaf Done and confirm progress reports 100% without falsely claiming verified/merged.
- [ ] Create nested parent → child → grandchild; progress counts the grandchild once, not repeatedly.
- [ ] Edit a child estimate and verify weighted parent/project progress changes.
- [ ] Attempt cyclic parent assignment: rejected without data loss.
- [ ] Export project JSON and whole workspace JSON. Reimport into a disposable workspace; task effort/progress and views match the originals.
- [ ] Snapshot and restore; verify data and views returned exactly.

## Saved task views

- [ ] Go to Tasks. Tap Filters & sort, search, choose status and priority, owner, and sorting.
- [ ] Save a view with a name; select it from the horizontal picker; filters and sort restore.
- [ ] Change the filters, save the same name to update the view. No duplicate ID.
- [ ] Create a second saved view and switch between them, then change projects. Views remain project-specific.
- [ ] Delete a selected view, confirm other views/tasks remain and a recovery snapshot exists.
- [ ] Filter matching tasks, bulk select and update; the view still applies to the updated data.
- [ ] Use the collapsed filter UI in portrait and landscape; touch targets and text remain readable.
- [ ] Sort by progress on a project with nested tasks; parent rows use derived progress rather than stale manual values.

## Regression and performance

- [ ] Kanban full-card hold/drag, auto horizontal scrolling, deletion and recovery.
- [ ] Gantt pinch zoom, pan, task resize/move, connector create/delete and scheduling preview/apply.
- [ ] Verify no phantom keyboard state or unexpected navigation when editing progress.
- [ ] Test with a larger disposable project (hundreds of tasks). Scroll and filters should not stall; report device performance.
- [ ] Confirm no Firebase project was activated and no network sync or user authentication was unexpectedly added.

## Release gate

| Check | Status |
|---|---|
| Model unit tests | 163/163 passed in authoring environment |
| Source JSX parsing | Passed |
| Android Expo Go | Not run |
| Web Metro | Not run |
| iOS | Not run |
| Firebase | Not connected |
| GitHub main | Unmodified |
