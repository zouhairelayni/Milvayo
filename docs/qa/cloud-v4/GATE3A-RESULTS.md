# Gate 3a results (v0.8.21 to v0.8.23)

| Check | v0.8.21 | v0.8.22 | v0.8.23 |
| --- | --- | --- | --- |
| `npm test` (owner, Termux) | Pass: 1,158 passed, 0 failed, 12 skipped | Pass: 1,188 passed, 0 failed, 13 skipped | Pass: 1,191 passed, 0 failed, 13 skipped (1,204 tests) |
| `npm run test:cloud` (owner, emulators) | Pass: 250 passed, 0 failed | Pass: 281 passed, 0 failed | Pass: exit code 0, 0 skipped (counts not shown in the pasted tail; no new emulator tests in 0.8.23) |
| Sandbox: new feed, reader, writer and two-person session tests | Pass (14) | Pass (feed 15, reader 9, writer 9, session 10) | Pass (session 14, writer 9) |
| Sandbox: full suite against the untouched tree | No new failures | No new failures (same environment-only failures as before) | No new failures (64 environment-only) |
| Deliberate-break checks (tests must fail when the code is broken) | 5 of 5 caught | 6 of 7 caught; the 7th change was redundant (the server also detects it) | Not repeated |
| Two devices in the app UI | Not run | Not run | Not run |
| Billing measurement on real Firebase | Not run | Not run | Not run |

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
