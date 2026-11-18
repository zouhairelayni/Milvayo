# Emulator and device results received from the owner

## Termux, Firebase emulators (demo-milvayo-083), owner run after v0.8.10

| Run | Result |
| --- | --- |
| `npm test` | 1,122 pass, 0 fail, 8 skipped (the skipped ones are the emulator-only suites that run under test:cloud) |
| `npm run test:cloud` | 191 pass, 0 fail (the cloud emulator suites, including the Gate 2 patch, deletes, dependencies, create/comment/time, Canvas delete and the security fixes) |

Status: the Firebase v4 Gate 2 patch handlers, the cascades and the security fixes are emulator-verified on this device. Earlier 15 failures came from test helpers and were fixed in v0.8.10 by the owner (see CHANGELOG v0.8.10).

Still NOT verified (no owner run yet): Web and Expo Go behaviour (v0.8.10 notes say acceptance is pending), the concurrency investigation output (run the benchmark once and send the JSON), the aggregation count on real emulators (it falls back safely if unsupported), and any real two-device collaboration.

Owner decisions applied by Claude (see docs/Milvayo-Handoffs/firebase v4.0 decisions.md). Nothing deployed; nothing committed.

## Concurrency investigation, owner run (Termux, 2026-11-11), transaction mode and experimental snapshot mode

Facts from the two JSON reports (all waves: 0 transaction retries, every request ran at an in-flight count of 1 inside its Function process):

| Wave | Median | 95th percentile | Per second |
| --- | --- | --- | --- |
| One edit, one user (sequential x20) | 41 ms | 55 ms | |
| 30 different users, one workspace, first time (c=30) | 5.8 s | 19 s | 1.6 |
| 30 different users, each own organization (control C) | 0.78 s | 1.06 s | 28 |
| One user, 15 simultaneous edits, one workspace (control A, c=15) | 0.22 s | 0.30 s | 49.5 |
| One user, 15 simultaneous edits, 15 workspaces (control D) | 0.28 s | 0.37 s | 40 |
| 30 read-only requests (control B) | 1.45 s | 4.0 s | 6.7 |

Snapshot (experimental) mode gave no improvement (shared c=30: 7.1 s median vs 5.8 s), so shared-document reads inside transactions are not the cause; that mode should stay off and can be deleted.

What the facts rule out: transaction retries (0 everywhere), a hardware or emulator throughput ceiling (30 simultaneous edits finish in under a second in controls A, C and D), and contention on the workspace or organization documents by themselves (control A and D are fast). Control A at c=30 reported 15 of 30 failures because my benchmark reused tasks it had already edited (a script bug, fixed).

Hypothesis (not yet proven): the slow waves are the Functions emulator starting new worker processes the first time it sees overlapping requests (every request showed an in-flight count of 1, the delay occurs before our handler starts, and the fast waves ran later, after the emulator had already served 30 concurrent requests). A one-time cost like that exists only in the emulator and says nothing about production. The decisive test is in the next benchmark version: the same 30-user wave repeated twice after warm-up. If the repeats are fast, the hypothesis holds and nothing needs fixing in our code.

## Client-side RTDB measurement (owner run, Termux; a script from an earlier round, status PASS, 0 errors)

| Measurement | Result |
| --- | --- |
| One client opens the change-signal listener | 1 event, 4 bytes |
| Four more clients open it | 4 events, 16 bytes |
| One task edit reaches 5 clients | 5 events, 220 bytes in total (44 bytes per client) |
| 5 clients attach presence | 25 events, 10,975 bytes downloaded, 365 bytes uploaded |
| 5 clients idle for 28 s with the presence heartbeat | 25 events, 18,275 bytes downloaded (about 731 bytes per event, 131 bytes per second per client) |

Reading (facts first, then arithmetic that is an estimate, not a bill):
- The change signal works end to end in the emulator and is almost free: 44 bytes per client per edit. This supports the Gate 3 design. Caveat: only the old commit path (and grant/revoke) writes the signal today; the v4 patch handlers do not, so Gate 3 must add a scoped signal to every v4 writer.
- Presence grows with the square of the people in a room: every heartbeat of every client is delivered to every client (5 clients: 25 events per cycle; 30 clients: 900). The 731 bytes per event is the size of the room snapshot the client sees; the wire traffic RTDB bills is probably smaller because it sends changes, so the cost figures are an upper estimate. Estimated at 731 bytes per event and a 25 s heartbeat over an 8-hour day: 5 people 21 MB/day, 10 people 84 MB/day, 30 people 758 MB/day (about 23 GB per month for one busy room). This is the measurement that justifies the planned presence redesign: a longer heartbeat (the disconnect hook already removes people who leave), and a listener per resource instead of per project. It moves from the Phase 2 backlog into Gate 3/4.


## Concurrency investigation, round 4 (owner run, Termux): hypothesis confirmed

| Wave (30 different users, one shared workspace) | Median | 95th percentile |
| --- | --- | --- |
| First time | 5.67 s | 18.2 s |
| Repeat 1, after warm-up | 0.46 s | 0.66 s |
| Repeat 2, after warm-up | 0.46 s | 0.54 s |

Same code, same data, same 30 users: the only change was that the emulator had already served concurrent requests. Controls A (one user, same workspace, 15 and 30 edits: 0.26 s and 0.44 s), C (30 organizations: 0.67 s) and D (15 workspaces: 0.31 s) agree. 0 transaction retries throughout. Conclusion: the 26 second figure was the emulator starting Function workers on the phone the first time it saw overlapping requests; it is a one-time emulator warm-up cost, not contention in the patch code, Firestore documents, or the device. No backend change is needed or made for it. The experimental snapshot authorization mode did not help and is not needed (to be deleted in a later cleanup). A benchmark warning "Unexpected rules runtime error: Picked up JAVA_TOOL_OPTIONS" in the log is the Java launcher printing the option line, not a rules error.
