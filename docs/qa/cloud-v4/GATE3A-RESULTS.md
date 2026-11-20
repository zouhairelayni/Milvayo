# Gate 3a results (v0.8.21 to v0.8.27)

| Check | v0.8.21 | v0.8.22 | v0.8.23 | v0.8.24 | v0.8.25 | v0.8.26 | v0.8.27 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `npm test` (owner, Termux) | Pass: 1,158 passed, 0 failed, 12 skipped | Pass: 1,188 passed, 0 failed, 13 skipped | Pass: 1,191 passed, 0 failed, 13 skipped (1,204 tests) | Pass: 1,195 passed, 0 failed, 13 skipped (1,208 tests) | Pass: 1,202 passed, 0 failed, 13 skipped (1,215 tests) | Pass: 1,212 passed, 0 failed, 14 skipped (1,226 tests) | Not run yet |
| `npm run test:cloud` (owner, emulators) | Pass: 250 passed, 0 failed | Pass: 281 passed, 0 failed | Pass: exit code 0, 0 skipped (counts not shown in the pasted tail; no new emulator tests in 0.8.23) | Pass: 288 passed, 0 failed, 0 skipped | Pass: 296 passed, 0 failed, 0 skipped | Pass: 307 passed, 0 failed, 0 skipped | Not run yet |
| Sandbox: new feed, reader, writer and two-person session tests | Pass (14) | Pass (feed 15, reader 9, writer 9, session 10) | Pass (session 14, writer 9) | Pass (session 15, writer 12) | Pass (move 4, session 17, writer 13, feed 15) | Pass (create 5, session 21, writer 14, feed 15) | Pass (edit 3, session 24, writer 17, feed 15) |
| Sandbox: full suite against the untouched tree | No new failures | No new failures (same environment-only failures as before) | No new failures (64 environment-only) | No new failures (64 environment-only, 997 tests) | No new failures (64 environment-only, 1,004 tests) | No new failures (64 environment-only, 1,015 tests) | No new failures (64 environment-only, 1,022 tests) |
| Deliberate-break checks (tests must fail when the code is broken) | 5 of 5 caught | 6 of 7 caught; the 7th change was redundant (the server also detects it) | Not repeated | Not repeated | Not repeated | Not repeated | Not repeated |
| Two devices in the app UI | Not run | Not run | Not run | Not run | Not run | Not run | Not run |
| Billing measurement on real Firebase | Not run | Not run | Not run | Not run | Not run | Not run | Not run |

Reversible: restore the previous zip; no data migration. The Firestore index (projectId, updatedAt) must be deployed before real Firebase.

## Owner emulator results and what they show (v0.8.21 to v0.8.22)

Measured by the owner in the Firebase emulators (counts of Firestore reads and writes per server call):

| Action | Reads | Writes |
| --- | --- | --- |
| Simple save (title, priority, dates) | 6 (point reads, same at 10, 100, 500 and 2,000 tasks) | 1 |
| Delete a leaf task | 8 | 1 |
| Delete a task with a full cascade (links, dependents, verified downstream, Ready release) | 20 | 13 |
| Delete a task with children and a verified grandchild | 8 | 1 |
| Dependencies: add a predecessor | 9 | 2 |
| Dependencies: replace the set and reset a verified downstream chain | 15 | 7 |
| Dependencies: remove, typed links kept | 7 | 2 |
| Create a task | 9 | 2 |
| Add a comment / log time | 7 | 1 |
| Delete Canvas objects | 9 | 4 |
| Feed poll with nothing new | 3 authorization reads plus the records inside the 30 s overlap | 0 |

Conclusions:
- Reads and writes follow what changed (a task's relations), not the size of the project. This held at 10 to 2,000 tasks.
- The idle cost with a live signal is zero requests; the 5-minute safety poll costs the three authorization reads per project plus the overlap records.
- Without a live signal each poll makes one call per project. This is the main remaining cost to measure on real Firebase.
- Results: 0.8.21 `npm test` 1,158 pass / 0 fail / 12 skipped and `test:cloud` 250/250; 0.8.22 `npm test` 1,188 pass / 0 fail / 13 skipped and `test:cloud` 281/281.
- Not yet verified: two devices in the real app UI, billing on real Firebase, and the `storage.rules` line 8 null-value warning in the emulator log (access was still refused; not investigated).

## v0.8.23
- Dependency edits on v4 use `patchDependencies`. Server cost per call is the one measured above (7 to 15 reads, 2 to 7 writes).
- Owner run: `npm test` 1,191 pass, 0 fail, 13 skipped; `test:cloud` exit code 0. Conclusion: dependency edits on v4 are verified in the real emulators and nothing regressed (3 more passing tests than 0.8.22: 1,188 to 1,191).
- Sandbox: session tests 14 pass (3 new for dependencies), writer tests 9 pass, full suite 993 run, 64 failing, all environment-only UI/native tests that also fail on the untouched tree.


## v0.8.24
- Canvas move/resize/stacking (`patchCanvas`) and Canvas delete (`deleteCanvasObjects`) on v4. Server cost per call is the one measured above (Canvas delete: 9 reads, 4 writes; Canvas move: 5 reads, 1 write at any board size).
- Owner run: `npm test` 1,195 pass / 0 fail / 13 skipped (1,208 tests); `test:cloud` 288/288. Conclusion: Canvas move, resize, stacking and delete on v4 are verified in the real emulators with no regressions. The cloud suite grew from 281 (0.8.22) to 288 because it also runs the new v4 planner and two-person session tests (3 in 0.8.23, 4 in 0.8.24).

## v0.8.25
- Task reorder on v4 with fractional positions (owner decision). New server call `moveTask`: one write, data untouched. Same authorization, stale, duplicate and freeze behaviour as the other v4 writers.
- Limits: one task per change; after about 30 moves into the same gap in a row the move stays in the recovery queue until a tidy-up call exists.
- Owner run: `npm test` 1,202 pass / 0 fail / 13 skipped (1,215 tests); `test:cloud` 296/296. Conclusion: task reorder with fractional positions is verified in the real emulators with no regressions.

## v0.8.26
- Found and fixed a gap in 0.8.24: the app's real Canvas save also rewrites the board record, which v4 refused; the board's revision, update time and viewport are now local bookkeeping. The sandbox tests now use the app's own `changeBoard`/`saveBoard` so this is covered.
- New server calls `createCanvasObject` and `createCanvasConnector`: one write each, canonical validation, caps 1,000 objects and 2,000 connectors per board.
- Owner run: `npm test` 1,212 pass / 0 fail / 14 skipped (1,226 tests); `test:cloud` 307/307, including the new real-emulator test `patch-canvas-create.emulator.test.cjs`. Conclusion: Canvas creates (notes and connectors) and the board-bookkeeping fix are verified in the real emulators with no regressions. Cloud suite grew 296 to 307.

## v0.8.27
- Found and fixed a bug in all earlier v4 client releases: the app's update time on a task or Canvas object (stamped on every edit) disagrees with the server's; edits that carried a changed update time were refused or conflicted. The tests now run consecutive edits with different update times.
- Canvas text, colour and lock edits (`patchCanvas`), connector edit and delete (`patchCanvasConnector`, `deleteCanvasConnector`).
- Sandbox only until the owner runs the emulators; `patch-canvas-create.emulator.test.cjs` now also covers these.
- Lesson: sandbox tests that edit data directly can hide differences the real app produces; the two-device UI check is now the most valuable open item.
