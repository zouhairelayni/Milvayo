# Milvayo summary (2026-11-19)

**App version:** 0.8.23 (owner bumps package.json, package-lock.json, app.json and src/cloud/server/package.json). Last owner-verified release: 0.8.23 (npm test 1191 pass/0 fail/13 skipped, test:cloud exit 0).

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
