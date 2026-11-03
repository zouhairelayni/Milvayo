# CHG-NP-0.5.30 — Audit fixes

## Baseline
0.5.29 (multiple workspaces). This release is marked 0.5.30. Set version 0.5.30 in app.json, package.json and package-lock.json yourself (they are not in the ZIP). Commit status: Not committed. No APK, no deploy. Backup/encryption formats, the Task Sheet layout, and `src/store/workspaces.cjs` are untouched.

## 1. Must fix — writer is null during startup (`src/store/store.js`)
- The AppState "save" handler (also used by the effect cleanup and web `pagehide`) now calls `writer.current?.flush()`.
- `api.flush` is now `writer.current?.flush()??Promise.resolve(true)`, so it resolves `true` when there is no writer yet.
- Left as it was: the call inside `swapTo`. It runs only after `if(!currentRef.current)throw Error('The workspace is still loading…')`, and `writer.current` and `currentRef.current` are set together after the first load, so it cannot see a null writer. The existing test `workspaces-0529` pins that exact line, so it was not touched.
- Test: `tests/store/audit-fix1-0529.test.cjs` (source check: the two startup paths are guarded; the one remaining plain call is the one after the loading guard).

## 2. Should fix — "Flag overdue" button (`src/screens/workspace/Workspace.js`)
- Automations page header now has a small secondary button "Flag overdue" (icon `flag`, already used elsewhere) beside "Due checks" and "Card aging". It calls `sweepDue`.
- Test: source check of the button row.

## 3. Should fix — taps that matched nothing looked dead (`src/store/store.js`)
- `runDueCommands` and `runAgingCommands`: when no command applies, show `notify('No tasks matched.','info')` and return the project unchanged. Matching behaviour is unchanged.
- `sweepDue`: when no open task is past due without an `Overdue` label, show `notify('No overdue tasks.','info')` and return the project unchanged.
- Side effect to be aware of: before, `sweepDue` with nothing to flag still produced a new project object, so it bumped the revision and wrote a "Flagged overdue tasks" activity entry and a save. It no longer does when nothing is flagged.
- These three buttons are on the Workspace screen, which is not inside a native Modal, so the island notice is visible there.
- Test: source checks for the three messages, plus the pure automation engine (`model.automation.run`) for a no-match case (0 applied) and a match case (>0 applied).

## 4. Should fix — refusal notices behind native Modals: CHANGE NEEDED
Evidence:
- `src/ui/uiLayout.js:13` — `Sheet` is a native `<Modal>`. `TaskSheet` renders inside it (`src/screens/tasks/TaskSheet.js:99`).
- `src/components/shell/Menus.js:276` — the phone `SideMenu` is a native `<Modal>`; `WorkspaceDrawer` and `ProjectDrawer` render inside it as absolutely positioned views.
- `src/app/ModernApp.js:271` and `:299` — `IslandNotice` is mounted in the app shell, outside those Modals. On Android a native Modal is drawn in its own window above the app, so the island (`zIndex:1000`, `elevation:14`, `IslandNotice.js:81`) sits behind it. Error notices never auto-dismiss, so the user would only see the error after closing the sheet.
- `noticePlacement.cjs` only computes the top offset; it does not change the layering.

Change (no new notification system; it reuses the store's current notice):
- NEW `src/components/notice/inlineNotice.cjs` — pure rule: show the notice text only if it is an error and was not already on screen when the surface opened.
- NEW `src/components/notice/InlineNotice.js` — small error strip with a dismiss button (dismiss also clears the store notice).
- `TaskSheet.js` — strip is the first item of the sheet footer, which stays visible while the body scrolls, so a refusal from Verify, Record merge, progress, or attaching a GitHub reference is visible next to those actions.
- `Menus.js` — `SideMenu` passes `inModal` to `WorkspaceDrawer` and `ProjectDrawer`, which then show the strip above their list. The wide-screen `Sidebar` is not a Modal and does not pass it, so there is no duplicate there.
- Not changed: other `Sheet` users (`BoardManagement.js`, `Sprints.js`, `Delivery.js` sprint form, `DiagnosticsPanel.js`) are also native Modals, so an error raised inside them is also behind the Modal. They were outside the named scope (Task Sheet, side menu and its drawers) and were not changed.
- Tests: `tests/app/inline-notice-0529.test.cjs` (pure rule; source evidence that both surfaces are Modals and carry the strip).

## 5. Nice to have — dead code removed (no behaviour change)
- Unused imports/variables removed: `CompactTools.js` SectionTitle; `Board.js` isOverdue and the unused `useTheme()` result in `TaskCard`; `Delivery.js` Avatar, STAGES; `Portfolios.js` PRIORITY_COLOR, STATUS_COLOR; `Programs.js` Grid, Cell, Stat, Input; `Projects.js` setDocStatus and the unused `c` in `ProjectGovernance`; `Management.js` Pressable, Card, SectionTitle, useTheme; `TaskSheet.js` addTask; `Workspace.js` Chip, useWide, fmt, toCSV; `store.js` Button; `automation.cjs` DEFAULT_BOARD_ID; `model.cjs` `valid`; `timelineDisplay.cjs` `finite`.
- `src/board/boardGesture.native.js`: deleted `attachDoc` and everything only it fed: `IS_WEB`, the `Platform` import, the `detach` state field, `detachDoc` and its two call sites, and the stale comment about web document listeners. Nothing read them (`attachDoc` was never called, so `detach` was always null); no test asserts on them.
- Kept on purpose, because a test uses them:
  - `Timeline.js` `const SPAN = display.BASE_DAYS` — asserted by `native-animation-contract.test.cjs`.
  - `Projects.js` `const { projectSummary } = require('../../domain/projectRelations.cjs')` — `management-screen-separation-054` requires that file to reference `projectRelations.cjs`.
- `src/ui/ui.js` exports were not touched (`refactor-batch02-0522` pins the export list, which is why Avatar, Cell, Chip, Grid, SectionTitle, Stat and useWide are only removed from importers).
- Test: source check that the removed names are gone and `boardGesture.native.js` has no web code.

## Files
NEW: `src/components/notice/InlineNotice.js`, `src/components/notice/inlineNotice.cjs`, `tests/store/audit-fix1-0529.test.cjs`, `tests/app/inline-notice-0529.test.cjs`, this file, `docs/qa/modern-code/NP-QA-0.5.29-fix1.md`.
CHANGED: `store.js`, `Workspace.js`, `TaskSheet.js`, `Menus.js`, `CompactTools.js`, `Board.js`, `Delivery.js`, `Portfolios.js`, `Programs.js`, `Projects.js`, `Management.js`, `boardGesture.native.js`, `automation.cjs`, `model.cjs`, `timelineDisplay.cjs`.

## Install / revert
Copy the ZIP contents over the project on Git `work` (keep your own `package.json`, `package-lock.json`, `app.json`). To revert: restore the 0.5.29 files from the previous ZIP or `git checkout -- .` and delete the four new files listed above. No data format or storage key changed, so no migration and nothing to undo in app data.
