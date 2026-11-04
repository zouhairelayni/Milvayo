# NP-QA-0.5.30 — Audit fixes

## Automated (this environment, Node, no node_modules)
Command: `node tests/run-all.cjs` with temporary stub `app.json` (`{"expo":{"version":"0.5.29"}}`, the baseline version at test time) and `package.json` (`{"version":"0.5.29"}`). Both stubs were deleted before zipping.
- **570 run, 566 pass, 3 fail, 1 skipped.** Baseline was 564 run, 560 pass, 3 fail, 1 skipped; the difference is 6 new tests, all passing.
- The 3 failures are the expected stub-only ones: `version-source` (service worker cache name), `native-animation-contract` and `native-worklets-hotfix`. They read the real `package.json`/`app.json` (versions, reanimated dependency); the stubs lack them. **Not re-run with the real files.**
- New tests: `tests/store/audit-fix1-0529.test.cjs` (4: findings 1, 2, 3, 5) and `tests/app/inline-notice-0529.test.cjs` (2: finding 4). Findings 2, 4 and 5 are source-pattern tests; finding 3 also runs the pure automation engine for match and no-match.
- Two existing tests constrained the edits and were not changed: `workspaces-0529` (pins `writer.current.flush()))throw` in `swapTo`) and `management-screen-separation-054` (requires the `projectRelations.cjs` reference in `Projects.js`). `native-animation-contract` asserts `SPAN`, so it was kept.
- Syntax: `tsc` parse (JSX preserved, no type check) of every edited and new `.js` file: 0 syntax errors. A broken sample file was flagged, so the check does detect errors. `node --check` on edited `.cjs` and new tests: ok.
- Undefined names: `tsc --checkJs` "cannot find name" diagnostics on the edited screens: 0 before, 0 after.
- `npx expo install --check`, `npx expo start`, Fast Refresh, Expo Go, web, Android: **Not run**.

## What the tests do not cover
The store and the screens run inside React components and no renderer is available here. Findings 1–4 were checked by reading and by source-pattern tests, not executed. In particular, that the inline strip is actually visible above the Task Sheet footer and inside the phone side menu on Android has not been seen on a device.

## Android acceptance checklist (all Not run)
1. Open the app and background it immediately during startup, and also while it is opening: no "Cannot read properties of null (reading 'flush')". — Not run
2. Automations: "Flag overdue" button sits beside "Due checks" and "Card aging". — Not run
3. Tap "Flag overdue" with a past-due open task: it gets the Overdue label; tap again: "No overdue tasks." — Not run
4. Tap "Flag overdue" with no past-due tasks: "No overdue tasks." appears. — Not run
5. Tap "Due checks" and "Card aging" with nothing that matches: "No tasks matched." appears; with a matching command they still apply. — Not run
6. Task Sheet: attach a GitHub reference while the GitHub Power-Up is off: the error shows in the sheet footer, readable and dismissable. — Not run
7. Task Sheet: change progress on a Done task, and try Verify and Record merge when not allowed: refusal is visible in the sheet. — Not run
8. Scroll the Task Sheet to the bottom before triggering a refusal: the message is still visible (footer). — Not run
9. Open a task right after an earlier error, with that error still on screen: the sheet does not show that old error. — Not run
10. Side menu: open Workspaces, create a workspace with a duplicate name (different case): refusal shows inside the drawer. — Not run
11. Side menu: open Projects drawer, trigger a refusal: it shows inside the drawer; dismiss clears it. — Not run
12. After closing the sheet or menu, the island notice is not stuck on screen once the inline message was dismissed. — Not run
13. Wide layout (tablet or web): side bar drawers show the island notice only, no duplicate strip. — Not run
14. Board drag and drop on Android (hold, drag, drop, cancel, scroll while dragging): unchanged after the `boardGesture.native.js` cleanup. — Not run
15. Screens touched by import cleanup open without error: Board, Sprints/Delivery, Portfolios, Programs, Projects, Management, Timeline, Workspace. — Not run
