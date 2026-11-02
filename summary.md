# Niyarvo Projects — summary.md

**Batch:** 0.5.29 (feature 3: multiple workspaces). Set version 0.5.29 in app.json, package.json and package-lock.json yourself.

## Done
- Create / rename / switch / delete workspaces; drawer under the side menu's workspace row.
- Main workspace keeps key `niyarvo-projects-v1` (no migration); list in `niyarvo-workspaces-v1`; others `niyarvo-workspace-v1:<id>`.
- Safe switching: flush old workspace, key-bound writers, one change at a time, stale-import and stale-GitHub guards.
- Tests: 564 run, 560 pass, 3 fail (stub package.json only; recheck with real file), 1 skipped. Device: Not run.

## Next tasks
- 0.5.30: import modes (project / new workspace / restore), multi-workspace complete backup.
- Then: Atlas fixtures, gzip level check, Timeline windowing tests, Android profiling.

## Files changed
- NEW src/store/workspaces.cjs, tests/store/workspaces-0529.test.cjs; store.js, Menus.js, ModernApp.js, Backup.js; performance-stability-0510 test; CHG/QA/audit 0.5.29

## Open issues
- Markdown links are not clickable.
- Typed text within 300 ms of a switch is refused (low).
