# Gate 3a results (v0.8.21 and v0.8.22)

| Check | v0.8.21 | v0.8.22 |
| --- | --- | --- |
| `npm test` (owner, Termux) | Pass: 1,158 passed, 0 failed, 12 skipped | Not run yet |
| `npm run test:cloud` (owner, emulators) | Pass: 250 passed, 0 failed | Not run yet |
| Sandbox: new feed, reader, writer and two-person session tests | Pass (14) | Pass (feed 15, reader 9, writer 9, session 10) |
| Sandbox: full suite against the untouched tree | No new failures | No new failures (same environment-only failures as before) |
| Deliberate-break checks (tests must fail when the code is broken) | 5 of 5 caught | 6 of 7 caught; the 7th change was redundant (the server also detects it) |
| Two devices in the app UI | Not run | Not run |
| Billing measurement on real Firebase | Not run | Not run |

Reversible: restore the previous zip; no data migration. The Firestore index (projectId, updatedAt) must be deployed before real Firebase.
