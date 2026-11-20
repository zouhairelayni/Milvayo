# Milvayo summary (2026-11-19)

**App version:** 0.8.27 (owner bumps package.json, package-lock.json, app.json and src/cloud/server/package.json). Last owner-verified release: 0.8.23 (npm test 1191 pass/0 fail/13 skipped, test:cloud exit 0).

## 0.8.27 - Canvas edits + update-time fix
- IMPORTANT FIX (affects 0.8.22-0.8.26): the app stamps updatedAt on every task/Canvas edit but v4 servers own it; edits with a changed updatedAt were refused (tasks) or conflicted (second Canvas edit). Now alignOrders keeps the stored updatedAt of existing tasks/Canvas objects; single() ignores updatedAt. Earlier tests missed it because timestamps matched.
- Done: patchCanvas accepts text/color/locked (locked objects only unlockable); new patchCanvasConnector (label/style/arrow/color, empty colour clears) and deleteCanvasConnector.
- Not yet on v4: group/ungroup, linked objects, Canvas comments, board rename/archive/create/delete, projects.
- Files changed: src/cloud/server/patch.cjs, src/cloud/server/feed.cjs, src/cloud/v4Writes.cjs, tests/cloud/patch-canvas-edit.test.cjs (new), tests/cloud/patch-canvas.test.cjs, tests/cloud/patch-canvas-create.emulator.test.cjs, tests/cloud/v4-writes.test.cjs, tests/cloud/session-v4.test.cjs, tests/cloud/feed.test.cjs, docs/changelog/CHANGELOG.md, docs/qa/cloud-v4/GATE3A-RESULTS.md, summary.md.
- Next: group/ungroup, Canvas comments, boards, projects, list tidy-up, legacy `pull` guard, two-device UI check (now more important), billing measurement.
- Open: owner to run `npm test` and `npm run test:cloud` for 0.8.27.

## 0.8.26 - Canvas on v4: real saves, creates
- Done: found that real Canvas saves were refused on v4 (board record revision/updatedAt/viewport change too); those three fields are now local bookkeeping (not sent, acked locally). New server calls `createCanvasObject` and `createCanvasConnector` (canonical validation, per-board caps 1000/2000, connector ends must be live). App sends them, objects before connectors.
- Not yet on v4: object text/colour/lock, group/ungroup, linked objects, connector edit/delete, Canvas comments, board rename/archive/create/delete, projects.
- Files changed: src/cloud/server/patch.cjs, src/cloud/server/feed.cjs, src/cloud/v4Writes.cjs, tests/cloud/patch-canvas-create.test.cjs (new), tests/cloud/patch-canvas-create.emulator.test.cjs (new), tests/cloud/v4-writes.test.cjs, tests/cloud/session-v4.test.cjs, tests/cloud/feed.test.cjs, docs/changelog/CHANGELOG.md, docs/qa/cloud-v4/GATE3A-RESULTS.md, summary.md.
- Next: Canvas object text/colour/lock + connector edit/delete (server field list), Canvas comments, boards, projects, list tidy-up for tiny task gaps, legacy `pull` guard, two-device check, billing measurement.
- Verified by owner: npm test 1,226 tests (1,212 pass, 0 fail, 14 skipped); test:cloud 307/307.

## 0.8.25 - task reorder on v4
- Verified by owner: npm test 1,215 tests (1,202 pass, 0 fail, 13 skipped); test:cloud 296/296.
- Decision (owner): fractional positions. New server `moveTask` (order only, one write). App sends `moveTask` for one moved task; moved+edited = patch then moveTask; several tasks at once or a gap under 1e-9 stays in the recovery queue.
- Files changed: src/cloud/server/patch.cjs, src/cloud/server/feed.cjs, src/cloud/v4Writes.cjs, tests/cloud/patch-move.test.cjs (new), tests/cloud/v4-writes.test.cjs, tests/cloud/session-v4.test.cjs, tests/cloud/feed.test.cjs, tests/cloud/feed.emulator.test.cjs, docs/changelog/CHANGELOG.md, docs/qa/cloud-v4/GATE3A-RESULTS.md, summary.md.
- Next: creating Canvas objects/connectors, projects, list tidy-up for tiny gaps, legacy `pull` guard, two-device check, billing measurement.
- Open: owner to run `npm test` and `npm run test:cloud` for 0.8.25.

## 0.8.24 - Canvas on v4
- Done: Canvas object move/resize/zIndex via `patchCanvas`; Canvas object delete via `deleteCanvasObjects` (cascade left to the server); stale reapply for patchCanvas.
- Files changed: src/cloud/v4Writes.cjs, tests/cloud/v4-writes.test.cjs, tests/cloud/session-v4.test.cjs, docs/changelog/CHANGELOG.md, docs/qa/cloud-v4/GATE3A-RESULTS.md, summary.md.
- Next: task reorder (needs a server `moveTask` call and an order-storage decision), creating Canvas objects/connectors, projects, legacy `pull` guard, two-device check, billing measurement.
- Verified by owner: npm test 1,208 tests (1,195 pass, 0 fail, 13 skipped); test:cloud 288/288.

## 0.8.23 - dependency edits on v4
- Done: task dependency add/remove/replace goes out as `patchDependencies` (own call; links and downstream resets are the server's). Other field edits of the same task go as a separate `patch`. Stale base: automatic reapply if nobody else changed `dependsOn`, else conflict. Planner fix: missing `dependsOn` no longer counts as a change.
- Files changed: src/cloud/v4Writes.cjs, tests/cloud/v4-writes.test.cjs, tests/cloud/session-v4.test.cjs, docs/changelog/CHANGELOG.md, docs/qa/cloud-v4/GATE3A-RESULTS.md, summary.md.
- Next: reorder, Canvas, projects on v4; legacy `pull` guard; two-device check; billing measurement.
- Verified by owner: npm test 1,204 tests (1,191 pass, 0 fail, 13 skipped); test:cloud exit 0.

## 0.8.22 - the app speaks v4 (Gate 3a, app side)
- NEW `src/cloud/changeFeed.cjs` (reader), `src/cloud/v4Writes.cjs` (queued edit -> v4 calls, order alignment, automatic reapply). Changed: `session.cjs` (v4 mode, per-project signal, safety poll), `journal.cjs` (feed state, dropped projects, order alignment), `client.js` (`projectHeads`), `server/feed.cjs` (`directoryV4`).
- Works on v4: task field edits, task delete with cascade, new task, comment, time entry. Kept in the queue with a clear message: dependencies, moving a task, Canvas, projects, others. Legacy `pull` guard NOT added (emulator tests still read via `pull`).
- Tests: change-feed-client (9), v4-writes (9), session-v4 (10 incl. seeded two-person random run), feed.test (+directory), feed.emulator (+directory), session.test fixture answers `directoryV4`.
- Open: run `npm test`, `npm run test:cloud`; two-device check in the real app; cost per poll when no signal is live is one call per project; billing measurement.

## 0.8.21 (verified) (Milvayo_v4_gate3a_feed.zip)
- NEW `src/cloud/server/feed.cjs`: `pullV4` (project change feed) + per-project signal `heads/{org}/{ws}/{project}` written after each accepted v4 edit (bounded 1.5 s, errors swallowed, not on conflict/no-op; a replayed duplicate re-signals).
- `src/cloud/server/service.cjs` wired; `firestore.indexes.json` + composite index (projectId, updatedAt); `tests/helpers/cloud-fake.cjs` (+RTDB `set`).
- Tests: `tests/cloud/feed.test.cjs` 14/14 in sandbox (S1 ties + 30 s late visibility, S2 cascades, S4 access, S5/S6 cursors, S7 cost, every writer signals, 2-replica random convergence); 5 deliberate code breaks were all caught. `tests/cloud/feed.emulator.test.cjs` (new, NOT run in sandbox).
- Sandbox full suite vs untouched copy: no new failures (64 fail vs 66 before; the same environment-only failures remain, none in cloud feed/presence).
- NOT in this batch: RTDB rule so the app can read the per-project signal (needs your approval), app-side change applier, offline queue rules, legacy `pull` guard. Nothing in the app calls `pullV4` yet, so behavior is unchanged for users.


## Verified on your Termux (your report, 2026-11-18)
- Presence/session tests 26/26; `npm run test:cloud` 219/219 (after the Carol fixture fix); 5-client and 30-client RTDB benchmarks PASS, 0 listener errors.
- 30 clients, attach + 80 s idle + cleanup: 15,115,765 B -> 152,190 B of callback payload (about 99% less). Event counts at attach and cleanup are unchanged (900 and 435); idle events 2,700 -> 0. Callback sizes, not billing.

- 150 s run (30 clients, your Termux): PASS, 0 listener errors, 30 heartbeat writes (exactly one per client), 900 events / 102,600 B for the round, 2,190 B uploaded, 1,368 B per client per minute. Cleanup 435 events / 49,590 B, all 90 listeners and 30 disconnect hooks released. Callback sizes, not billing.

## Done in the second patch (Milvayo_v4_structure_fix.zip, sandbox-checked)
- Own-path header added to the 7 I/O audit files; `folder-structure.test.cjs` import scanner now ignores `require(...)` text inside string literals (new regression test); `npm test` structure failures should be gone (folder-structure 6/6 in sandbox; `patch-io-audit.cjs` install/remove still restores index.cjs byte-for-byte).

## Done in the first fix patch (Milvayo_v4_presence_fixes.zip)
- Carol fixture fix rolled into `tests/cloud/presence-rules.emulator.test.cjs` (same change you applied by hand: remove her test entry after the read).
- Own-path header added to `tests/helpers/bench-v4-client-rtdb.cjs` and `bench-v4-client-rtdb-scale.cjs` (these were two of the nine files failing `folder-structure.test.cjs:41`).

## Open issues (in priority order)
1. Re-run `npm test` on your device to confirm the two structure failures are gone (expected 0 fail).
2. (closed) 150 s heartbeat round measured, see above.
3. Two-device/UI checks (background, reconnect, typing) not done. Billed bytes unmeasured.
4. Gate 3a batch 2 (rule for the project signal, app applier, offline queue, legacy pull guard), remaining N-read workflows, retire legacy code, disaster recovery, open security items, indexes (see handoff).
5. Changelog: file `docs/qa/cloud-v4/CHANGELOG-ENTRIES.md` by hand (no merge helper in your tree).

## Decisions
- Online state stays on Realtime Database presence, 2 min heartbeat. FCM only later for offline notifications (assignments, mentions).
