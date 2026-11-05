# NP-QA-0.2.5 — Runtime acceptance plan

**Baseline**: v0.2.4 → v0.2.5 on Git `work`; no main merge / Firebase deployment.
**Environments**: Android Expo Go in Termux / Chrome Web via Metro; portrait and landscape. iOS requires separate device or simulator and is **Not run** here.

## Required cases (record Pass/Fail and screenshot/video if failed)

1. **Workspace backup**: Backups → Export workspace JSON before replacing code; preserve the existing `milvayo-v1` storage key. After patch, restart and confirm workspace/projects/tasks/dependencies remain.
2. **Pinch inward/outward in chart**: Width changes smoothly without an unexpected scroll jump; the date beneath pinch midpoint remains approximately stationary. Verify 6 px/day floor and 96 px/day ceiling. The task rail does not resize; task names stay legible.
3. **Fallback zoom**: `−`, `+`, `Fit`, and Days/Weeks/Months function. At maximum zoom-out, tasks render as small schedule indicators; open them via the left rail. Zoom back in to edit bars.
4. **Vertical scroll in Gantt**: Scroll from top status to last task, while fixed task names remain synchronized vertically with the date grid. Scroll left/right without affecting left rail. No blank/overlapping calendar layers.
5. **Link auto-pan**: Start connector on first visible task, drag while held near right edge. Date grid should continue moving. Repeat left edge; repeat top/bottom edges (in a project with enough task rows). Release over a target task that was initially offscreen: verify the correct predecessor. Repeat with diagonal pan.
6. **No phantom connections**: Cancel link; release over empty space; drag with two fingers accidentally; ensure no dependency appears. Repeat a **first gesture after opening the screen** and compare pointer/yellow preview alignment with later gestures.
7. **Existing dependency management**: Tap a curved link and remove it; use Links list as fallback; confirm no task deletion.
8. **Kanban regression**: Long press full card, drag across several lanes with edge auto-scroll; no handle; no change in gesture anchor and persistence.
9. **Gantt regression**: Move and resize tasks, add milestone, switch status/stage groups, critical path, link/unlink and restart.
10. **Unslop mobile visual acceptance**: Check 360px, 390px, landscape, desktop >=860px: one-line header, consistent button heights, no clipped Gantt controls, legible task rail, balanced page spacing, readable bottom navigation and accessible focus/tap areas on all major screens (Overview, Board, Timeline, Tasks, Releases, Automations, Backups, Settings).
11. **Data checks**: Project create/select/archive/recover, JSON export/import, snapshots and restore. Verify no console errors or regressions.

## Evidence status on delivery

- Node model/UI contract/unit checks: **Pass** (see `NP-v0.2.5-test-results.txt`).
- TypeScript JSX parser on App.js and GanttView.js: **Pass**.
- Expo SDK package installation/bundle on user device: **Not run**.
- Android Expo Go actual pinch and two-axis autopan: **Not run**.
- Web mouse/pointer/trackpad interactions: **Not run**.
- iOS runtime and visual regression: **Not run**.
- Firebase deploy/Git merge: **Not performed**.

## Stop conditions

- Any local data loss; stale tasks after restore; wrong dependency target after pan; stuck scrollEnabled state; unwanted link creation; touch gesture crashes; broken Kanban drag; visual overflow/clipping blocking controls. Do not tag or merge to main if any occurs.
