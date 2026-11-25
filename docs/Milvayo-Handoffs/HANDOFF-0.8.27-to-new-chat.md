# Milvayo handoff: 0.8.27 QA stop, audit and fix plan (move to a new chat)

Owner: Elay (not a developer: plain words). App: Milvayo (Expo / React Native + web, Firebase emulators only, demo project `demo-milvayo-083`). Date: 2026-11-21.

## 1. Situation in three lines
- Releases 0.8.21–0.8.27 moved the app to Firebase v4 (field-level writes, per-project change feed). Tests passed.
- The owner's real two-client QA of 0.8.27 found 9 cases not working (sync of deletes, Canvas objects and connectors, pending counter, false conflicts, presence), 119 not tested, 33 working.
- Owner instruction: **stop all features, fix what is broken, no code until the plan is approved.** This handoff and the two audit files are the result. Nothing was changed in the code.

## 2. What to attach to the new chat
1. `Milvayo-v0.8.27.zip` (full code, from this chat; `credentials.json` and logs excluded on purpose).
2. `summary.md` (inside the zip too).
3. `docs/qa/cloud-v4/AUDIT-0.8.27.md` and `docs/qa/cloud-v4/FIX-PLAN-0.8.28.md` (inside the zip too).
4. The QA evidence pack `Milvayo_v0.8.27_Claude_QA_Evidence_Pack.zip` (read-only).
5. Your answers to D1–D5 in the fix plan (a few words each is enough).

## 3. First message to paste in the new chat
> Updating Milvayo. Attached: Milvayo-v0.8.27.zip, summary.md, the QA evidence pack, AUDIT-0.8.27.md and FIX-PLAN-0.8.28.md. Read summary.md, then MemoryRelay, then only the files the next task needs. Do NOT reread the old chat. No new features until the fixes are owner device-verified. Start with Batch 0 (measure) from the fix plan, but first ask me D1–D5 if I have not answered them below. My answers: D1 …, D2 …, D3 …, D4 …, D5 ….

## 4. What is done (honest labels)
Labels: Planner = sandbox planner tests; Server = emulator tests run by the owner; Flow = two real clients with timing (none yet); Device = owner saw it work on two real devices.

| Area | Status |
|---|---|
| Change feed, per-project signal, cheaper presence (0.8.21) | Server (owner-run). Real live signal in the real clients: **unproven** |
| App reads/writes v4 (0.8.22): task edit, delete, create, comment, time | Planner + Server. QA: some task edits work; delete across devices does not settle |
| Dependencies (0.8.23), task reorder (0.8.25) | Planner + Server. QA: reorder reaches the other device after 5+ minutes |
| Canvas move/resize/delete (0.8.24), real-save fix and create (0.8.26), text/colour/lock/connectors and the update-time fix (0.8.27) | Planner + Server (0.8.27 tests not reported by owner). QA: Canvas objects and connectors **do not appear** on the other device |
| Owner test results | 0.8.23: 1204 / 1191 pass / 13 skipped, cloud OK. 0.8.24: 1208 / 1195 / 13, cloud 288/288. 0.8.25: 1215 / 1202 / 13, cloud 296/296. 0.8.26: 1226 / 1212 / 14, cloud 307/307. 0.8.27: **not reported** |
| QA pack | 161 cases: 33 working, 9 not working, 119 not tested |

Nothing in 0.8.22–0.8.27 is **Device**-verified except what the QA pack lists as working.

## 5. What is left
1. Run the 0.8.27 `npm test` and `npm run test:cloud` and report numbers (still owed).
2. Answer D1–D5.
3. Batch 0: Sync status readout and Compare check (diagnostics only).
4. Batch A: FIX-01, FIX-02, FIX-06, FIX-04.
5. Batch B: FIX-05, FIX-07, FIX-03 (scope depends on Batch 0).
6. Batch C: test reform (FIX-11), presence retest, web reload, Storage warning.
7. Then the 119 untested QA cases.
8. Only after that: group/ungroup, linked objects, Canvas comments, board create/delete, projects, legacy `pull` guard, tiny-gap tidy-up, billing measurement on real Firebase.

## 6. Issues to resolve (mapped to the QA bug list)
| QA id | Plain issue | Audit finding | Fix |
|---|---|---|---|
| MIL-QA-001 | Task deletes do not settle across devices | F2, F1 | FIX-02, FIX-01 |
| MIL-QA-002 | "Keep cloud version" does not apply on a deleted record; conflict stays | F2 | FIX-02 |
| MIL-QA-003 | Canvas objects and connectors differ between clients | F1, F3, F4, F7 | FIX-01, 04, 05, 07 |
| MIL-QA-004 | Pending counter never clears; conflicts not visible | F1, F6 | FIX-01, 06 |
| MIL-QA-005 | Reorder and board rename take 5+ minutes | F3, F4, F5 | FIX-04, 05, 03 |
| MIL-QA-006 | Web refresh disconnects | F9 | FIX-08 (needs D3) |
| MIL-QA-007 | No presence indicators | F10 (invalid test) | FIX-09 (needs D4) |
| MIL-QA-008 | False conflicts on normal sequential edits | F8 | Re-test after FIX-04/05 |
| MIL-QA-009 | Storage rules startup warning | F11 | FIX-10 |

## 7. Facts the next chat must not re-derive
- Architecture: Firebase HTTP function `cloudApi` (`src/cloud/server`); Firestore `orgs/{org}/workspaces/{ws}/records/{key}` with per-record revision and deleted markers; Realtime Database for access list, presence and change signals `heads/{org}/{ws}/{project}`.
- v4 server calls: `patch`, `moveTask`, `patchCanvas`, `patchCanvasConnector`, `deleteCanvasConnector`, `deleteCanvasObjects`, `deleteTask`, `patchDependencies`, `createTask`, `addComment`, `logTime`, `createCanvasObject`, `createCanvasConnector`, `pullV4`, `directoryV4`.
- Client files: `changeFeed.cjs` (reader), `v4Writes.cjs` (planner/sender), `journal.cjs` (strict-order queue), `session.cjs` (connect, signal, polling, conflict resolving), `polling.cjs`, `client.js` (Realtime Database listeners).
- Key lines to start from: `journal.cjs` `drain` (stops on a conflict head); `session.cjs` `nextDelay` and `SIGNAL_FALLBACK_MS = 300000`; `session.cjs` `tick` (45 s send interval); `session.cjs` `fetchLatest` and `resolveConflict`; `store.js:77` (only queues); `TaskSheet.js:81, 392, 393` (the only `syncNow` calls).
- Decisions in force: fractional task positions (owner option 1); the server owns `updatedAt` of tasks and Canvas objects; board `revision`, `updatedAt` and `viewport` are local-only bookkeeping.
- MemoryRelay entry `b98b38e46253` (v4 client rules) is **outdated**: it says dependencies, reorder and Canvas are unsupported. It is corrected in this chat.
- Both QA clients used one synthetic account: do not conclude anything about presence from that.

## 8. Rules that stay in force
- Never edit `.env`, `package.json`, `app.json`; never install packages: give Elay the exact line or command.
- Version bumps are done by Elay (package.json, package-lock.json, app.json, src/cloud/server/package.json).
- Anything about deletion, overwriting, rules or data safety needs Elay's explicit approval first (fix plan marks these).
- Emulators cannot run in the sandbox; emulator suites are run by Elay on Termux (`npm test`, `npm run test:cloud`, ports such as 4400 must be free, no other agent running emulators).
- Deliver after each batch: summary.md, changed files, full-code zip `Milvayo-vNN.zip` (excluding node_modules, .env, dist, android, ios, .git, credentials.json and logs). Plain words. No pass counts presented as proof.
- Security note: `credentials.json` in the project root holds the Android keystore details. It is left out of the zip. Keep it out of any chat attachment.
