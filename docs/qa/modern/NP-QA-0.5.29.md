# NP-QA-0.5.29 — Multiple workspaces

## Automated (this environment, Node 22, no node_modules)
Command: `node tests/run-all.cjs` with temporary stub `app.json` and `package.json` (not shipped).
- **564 run, 560 pass, 3 fail, 1 skipped.**
- The 3 failures are `version-source` (service worker stamp), `native-animation-contract` and `native-worklets-hotfix`. They read the real `package.json` (scripts, reanimated dependency); the stub lacks them. They passed in 0.5.28 with the real file. **Not verified** against your real package.json: run `npm test` there.
- Skipped: 1 (same as 0.5.28, needs node_modules).
- New: `tests/store/workspaces-0529.test.cjs`, 11 tests, all pass (create/rename/switch/delete, names, last-workspace guard, limit, damaged list, interrupted create and delete, same project IDs in two workspaces, key-bound writer under a late flush, store wiring).
- Changed: `performance-stability-0510` (task sheet key).
- JSX parse (esbuild) of store.js, Menus.js, ModernApp.js, Backup.js: 0 errors.
- `npx expo install --check`, Expo Go, web, Android: **Not run**.

## What the tests do not cover
The store's switch code runs inside a React component; no renderer is available here, so it was checked by reading and by source-pattern tests, not executed. The pure list logic and the writer isolation were executed.

## Android acceptance checklist (all Not verified)
1. Fresh app start: menu shows "Main workspace", all existing projects present.
2. Create "Test A": opens with one blank project; the old workspace is unchanged after switching back.
3. Add tasks in A, switch to Main, switch back: tasks still there; Main has none of them.
4. Rename A; duplicate name (any case) is refused with a notice.
5. Delete A while open: confirm step shown, Main opens, A gone after restart.
6. With one workspace, delete is not offered.
7. Kill the app right after creating a workspace: it is listed after restart.
8. Switch while the Board/Timeline are open: no stale cards, no open task sheet, no crash; switching feels immediate (time it; no number claimed).
9. Open a password-protected import, switch workspace before it finishes: nothing imported, notice shown.
10. Export, import project and restore still work in the open workspace.
