# Niyarvo Projects 0.5.33 — QA and measurement notes

## Verified in an isolated synthetic source fixture

- Patch dry-run, application, repeat application: successful; four file changes only on known v0.5.30 shapes.
- Five targeted regression checks: 5 passed, 0 failed.
- Existing Node suite: 574 passed, 1 skipped, 0 failed (575 total), with synthetic manifest/lockfile and HF2 provider fixture; actual installed v0.5.31 source not available to test.
- Source parse: 123 JS/JSX/CJS sources parsed without errors in the fixture.
- Version synchronization: app.json expo.version, package.json version, package-lock.json version, package-lock.json packages[''].version all set to 0.5.33; repeated run unchanged.

## On-device acceptance (not run here)

| Test | Pass criterion |
|---|---|
| Web portrait 390px | Desktop icon rail and compact toolbar retained, task rows fit viewport |
| Web 768px/1440px | Navigation intact; large tasks screen shows aligned column headings only where it fits |
| Overview release card | Both Releases and Testing buttons work; no nested interactive element warning |
| Kanban drag | Long press, auto-scroll, cross-column move, cancel and persistence unchanged |
| Gantt | Weekend shading visible in Days zoom, never intercepts resize/drag/link gestures |
| Timeline first open | No bounce to Overview; collect diagnostics if it recurs |
| Theme | Existing ash-gray light/dark appearance unchanged |
| Data | Workspace and task edits persist after reload, no unexpected reset |
| Native portrait | Original mobile bottom navigation retained |
| Web console | No new JS exceptions or require-cycle warnings |

## Performance expectations (not claims)

UI changes do not modify the domain, gesture, or timeline engine. The new weekend shade renders at most the columns spanning the painted viewport, not the entire chart. The task header is rendered only at widths >=1080. Neither condition proves a speedup. Compare same workspace on the same phone across three cold visits per screen, and compare median plus worst-case Board render times and JS delay with the prior report. Avoid comparing Metro bundling time to screen responsiveness.
