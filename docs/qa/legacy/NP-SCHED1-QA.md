# NP-SCHED1 QA — engine-only acceptance

1. On `work`, preserve any uncommitted Sonnet redesign and export workspace JSON. Verify `git status --short` and use a clean checkpoint before extracting.
2. Extract the additive-only patch at the project root. It must not overwrite `App.js`, `src/GanttView.js`, or `src/model.cjs`.
3. Run `npm test` — expected **103 passing** on the original v0.2.5 baseline plus this patch. If tests differ on Sonnet's revised model, investigate before changing expected results.
4. Run `node scripts/schedule-smoke.cjs` — expects `ok:true`, moved `B` to 2026-11-10..11 and milestone `C` to 2026-11-12, `conflicts:0`.
5. `npx expo start` / Web and Android sanity check must confirm no regressions after additive integration. This batch has **no new scheduling UI** to inspect.
6. Future UI acceptance (after Sonnet source arrives): preview and Cancel; explicit Apply; task dependency-type editor; lag and working-calendar settings; backup and restore; project JSON roundtrip; typed-link Gantt rendering and conflict/critical path semantics; multi-project isolation; stale preview; verified/merged flags; appropriate undo; automated tests.
7. Do **not** merge into `main`, claim v0.2.6 release, or deploy to Firebase merely because model tests pass.
