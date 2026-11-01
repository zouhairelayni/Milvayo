# NP 0.2.4 — Android/Web manual QA checklist

**Setup:** Run on the `work` branch, after exporting an app workspace backup and installing SVG dependencies. Do not commit/merge/deploy until device/browser verification succeeds.

1. **Startup/regression:** `npm install`, `npm test`, `npx expo install --check`, `npx expo start`. Load the same workspace as v0.2.3 without losing tasks or deps.
2. **Layout portrait:** Open Timeline on Android portrait. Check toolbar, `Links N`, Help, collapsed schedule issues, task names, date labels and bar height. No overlapping controls.
3. **Layout landscape:** Rotate to landscape. Scroll dates sideways. Confirm fixed task names, grouped lanes, and no clipped dialogs.
4. **Relative gesture:** Hold a connector on a scheduled bar, drag it 2–5 rows down/up, verify the yellow preview tip stays aligned to the finger. Release on target bar and confirm a link to the intended successor. Repeat with the Android status bar visible and with different zoom levels.
5. **Path selection:** Tap a curved line (not a task bar). Confirm predecessor/successor names, Cancel, and Remove link.
6. **Fallback list:** Use `Links N`. Select a relationship, remove it. Count decreases and curve vanishes. Close/reopen Timeline and app; relationship stays deleted.
7. **Crossing paths:** Link one predecessor to multiple distant successor rows. Observe separate channels, arrowheads, dashed red conflicts and ability to identify each relationship. Report ambiguous crossings with a screenshot.
8. **Model safeguards:** Attempt self-link, duplicate, and circular dependency. Should reject or offer existing-link dialog, never corrupt graph.
9. **Critical path:** Toggle critical path, inspect amber chain; graph calculations use calendar days only.
10. **Regressions:** Move Gantt tasks, resize right edges, tap task edit, use predecessor editor/align, drag whole Kanban cards across columns with edge-scroll, switch projects, archive/restore, export JSON, restart app.
11. **Web:** Repeat core pointer linking/deletion in Metro Web at desktop and narrow width. Check SVG path selection and horizontal scroll.
12. **Acceptance:** Record each as Pass / Fail / Not run and attach screenshot + reproduction steps for failures. iOS remains Not run until available.
