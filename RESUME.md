# RESUME — Niyarvo Projects performance work (report run mvyh4x0e, v0.5.22)
Say "Continue" or "Resume": read this file, do NOT re-read the chat. Work in patches; zip after every 2 patches; keep going without asking.

## Report numbers
Board 60 renders max 239 ms (8 in a row while hidden) | Timeline 114 / 179 ms | Projects 65 / 142 ms, timer stall 1250 ms | Testing 361 ms | Tasks 29 / 123 ms | Sprints 94 renders avg 11 ms (chart scrubbing, fine) | 0 errors.

## Done (zip: NiyarvoProjects_v0_5_22_patch5.zip, changelog CHG-NP-0.5.23-performance.md)
- P1 Board: hidden page pauses card reveal + column mounting (store.js useScreenActive)
- P2 Testing: 25 per page, Map lookup, one-pass counts
- P3 Projects: ProjectCard memo with own edit state; DocGroups memo
- P4 Timeline: TaskBar memo + stable callbacks (needs phone drag test)
- P5 Tasks/Board: lazy search inputs; Tasks counts one pass
- npm test 492 run / 491 pass / 0 fail. JSX parse 0 errors. Device: Not run.

## Left (in order)
- P6 Overview (68 ms max), Task sheet typing, Costs / Automations / Reports / Settings / Workspace (never audited)
- Open issue: a button tapped <0.3 s after typing in a lazy field acts on unsaved text (now also Tasks search + Board filter). Fix idea: flush pending buffers before any press (shared registry in commitBuffer.cjs).
- Open issue: Timeline "today" line stale after midnight.
- Next report: ask for a new performance report after install; compare Board hidden renders, Projects, Timeline max.

## Rules
Do not bump versions; exclude package.json + package-lock.json from the zip; changelog in docs/changelogs/modern-code; say Not run for device checks.
