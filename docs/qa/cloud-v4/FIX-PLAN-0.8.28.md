# Milvayo fix plan after the 0.8.27 QA (nothing here is implemented yet)

Owner rule: **no new features until these are fixed.** **Owner rule (2026-11-21): no batches. Each fix is its own version and is delivered on its own: 0.8.28 diagnostics, 0.8.29 FIX-01, 0.8.30 FIX-02 (needs approval), 0.8.31 FIX-06, 0.8.32 FIX-04, then FIX-05, FIX-07, FIX-03, then FIX-11, FIX-09, FIX-08, FIX-10, one version each. The headings below keep the old Batch names only as a grouping.** Findings F1–F11 refer to `AUDIT-0.8.27.md`. Work one fix per version. After each version: summary.md, changed files, full-code zip, and a short real-app checklist for you.

## Decisions needed from Elay before the code starts

| # | Question | Recommended answer |
|---|---|---|
| D1 | A change the server cannot take yet (board rename, groups, etc.): block the queue (today), keep it on this device only with a visible "not shared yet" label, or support it on the server? | Never block. Keep it on this device with a visible label. Support board rename on the server later (it is the one you use). |
| D2 | A task was deleted by someone else and I had edited it. "Keep cloud version" = drop my edit (safe). "Keep my changes" = bring the task back. Allow bringing back? | Drop-my-edit now. Bring-back only through a new, approved restore call later (this touches deletion and data safety, so it needs your explicit approval first). |
| D3 | After refreshing the web page, stay connected? | Decide later; low risk to leave as is for now. Needs a security decision because it stores a sign-in. |
| D4 | Test accounts: can you create two different test users (A and B) for the two clients? | Yes. Needed for presence and for honest conflict tests. |
| D5 | Fallback check interval when the live signal looks fine: 5 minutes today. Is 30–60 seconds acceptable? | 60 s as a safety net, plus the immediate pull when the signal fires. Costs a few extra reads per device per minute. |

## Order of work

### Batch 0: measure first (version 0.8.28, diagnostics only, no behaviour change) — BUILT, awaiting owner test
Goal: stop guessing about F3, F4 and F7.
- **FIX-00a** Add a small "Sync status" readout in the Cloud panel: live signal yes/no, last time the signal fired, last send, last receive, queue length, first blocked item and why. (Where: `session.cjs`, `client.js` `projectHeads`, `CloudPanel.js`.)
- **FIX-00b** Add a "Compare" check that prints, per kind (tasks, canvas objects, connectors, boards), the count and a short ID list for this device and for the cloud. You run it on both clients and send me the two outputs. (Where: `session.cjs` plus a screen button; no emulator needed.)
- Acceptance: with the two clients open, the readout shows "live: yes/no" and timestamps; Compare shows whether the Canvas IDs match.
- Exit: I can say for certain whether F3 and F7 are real. This decides the size of Batch B.

### Batch A (versions 0.8.29 to 0.8.32, one fix each): stop the freezing
- **FIX-01 (F1) Do not let one stuck edit block the rest.** (BUILT in 0.8.29, Planner-tested only, awaiting owner test)
  - Change `drain` so a conflict only holds back later edits that touch the **same records** (and creates that others depend on, such as note before connector). Independent edits keep going.
  - Where: `journal.cjs` `drain` plus a "touches the same keys" helper; test in `tests/cloud/session-v4.test.cjs`.
  - Acceptance: make a conflict on task X, then move a Canvas note and rename task Y. Both reach the other device in under 15 s while X stays flagged.
  - Risk: ordering of edits to the same record must stay strict. Covered by a test with two edits to one record.
- **FIX-02 (F2) Make deleted-record conflicts resolvable.** (BUILT in 0.8.30, Planner-tested only, awaiting owner test; owner approved the scope)
  - `fetchLatest` must keep deleted markers (or look the record up with them), so `resolveConflict` knows the record is deleted.
  - "Keep cloud version" on a deleted record = discard my edit and clear the conflict (D2).
  - "Keep my changes" on a deleted record: hide or disable it with a plain explanation until the restore call exists.
  - Where: `session.cjs` `fetchLatest`, `resolveConflict`; `CloudRecovery.js` wording.
  - Acceptance: device A deletes a task while B has an unsent edit on it. On B choose "Keep cloud version": the conflict disappears, the task is gone, the counter drops.
  - Needs your approval before coding because it concerns deletion.
- **FIX-06 (F6) Honest counter and visible status.** (BUILT in 0.8.31, Planner-tested only, awaiting owner test)
  - Show "N waiting, M need review" instead of one number; the counter reaches 0 when nothing is waiting. Show a banner on the main screen when something needs review, with the reason in plain words.
  - Where: `journal.cjs` `status`, `CloudPanel.js`, one banner component.
  - Acceptance: with one conflict present, the screen says "1 needs review: <reason>"; after resolving it says nothing.
- **FIX-04 (F4) Send every edit soon.** (BUILT in 0.8.32, Planner-tested only, awaiting owner test)
  - After any queued edit, request a send within about 1–2 s (small delay so quick edits group). No more waiting for the 45 s round.
  - Where: `session.cjs` `capture` (schedule a drain), not only task sheet calls.
  - Acceptance: reorder a task on A; the cloud has it within 5 s (Sync status shows "last send").

### Batch B (next versions, one fix each): catch-up speed and Canvas
Content depends on Batch 0 results.
- **FIX-05 (F3) Receiving latency.** (BUILT in 0.8.33, Planner-tested only, awaiting owner test; cause of a silent signal still unknown, no rules change) If the signal is not firing: fix why (rules, `acl` entry, listener error not surfaced, emulator host). In any case lower the safety-net interval (D5) and make a failed listener visible as "polling mode" in Sync status. Where: `session.cjs` `nextDelay`, `client.js` `projectHeads`, `database.rules.json` if rules are the cause (needs your approval, security rules).
  - Acceptance: edit on A appears on B within 10 s (signal mode) or within the polling interval (polling mode), and Sync status says which mode it is in.
- **FIX-07 (F7) Canvas end to end.** (BUILT in 0.8.34 as F12: stale open Canvas overwrote the other person; Planner-tested only; may not be the whole cause, Compare will tell) From the Compare output decide: delivery bug (fix feed or sender) or only lateness (already solved by FIX-04/05). Acceptance: add, move, recolour, connect and delete a note on A; B shows the same IDs and positions within 10 s; Compare matches on both.
- **FIX-03 (F5) Unsupported changes.** (BUILT in 0.8.35, D1 approved, Planner-tested only, awaiting owner test) Implement D1: keep on device with a visible label, never block. Optionally add board rename/title/archive to the server (one new call) if you want it.
  - Acceptance: rename a board; nothing else stops syncing; the screen says "not shared yet" until supported.

### Batch C (later versions, one fix each): test reform and the rest
- **FIX-11 Test reform (the real fix for "passed but broken").** (BUILT in 0.8.36, Planner-tested only: contract test + SUPPORT-MATRIX.md + two-user scenarios; they found and fixed 3 bugs. Evidence script: `scripts/qa-evidence.cjs`. Two-real-device QA stays the gate.)
  - New emulator test (owner-run) with **two clients using two users**, real Realtime Database listeners and real timers, asserting: other side matches within N seconds, **queue empty, pending 0, no conflicts** at the end.
  - A "contract" test that lists every record kind and field the screens can produce and requires each one to be either supported, or local-only with a label, and never blocking.
  - A delete-conflict test that uses real deleted markers.
  - Status labels (audit section 6) in every changelog entry.
- **FIX-09 (F10)** (BUILT in 0.8.37 as a retest plan; no code change; rules Server-tested, client Planner-tested, awaiting your two-account test) Presence retest with users A and B; check `acl` entries and `heads`/`presence` rules.
- **FIX-08 (F9)** (BUILT in 0.8.38, message only, Planner-tested only, awaiting your test) Web reload behaviour per D3.
- **FIX-10 (F11)** (BUILT in 0.8.39, approved; rule + emulator test written, not yet run) Trace the `storage.rules` line 8 warning.

### Not before all of the above is owner device-verified
Group/ungroup, linked objects, Canvas comments, board create/delete, projects, legacy `pull` guard, tiny-gap tidy-up, billing measurement on real Firebase.

## The real-app checklist the owner runs after each batch (split screen, Expo Go + web)
Use two different test users once D4 is done.
1. Edit a task title on A, check B within 10 s.
2. Drag one task to a new place on A, check B within 10 s.
3. Delete a task on A while B has it open with an edit; resolve on B with "Keep cloud version".
4. Add a note and a connector on A, move and recolour them; check B, then reload both and compare.
5. Rename a board on A.
6. Make a conflict on purpose, then do three other edits; those three must still arrive.
7. After all of the above, wait 60 s: counter is 0 on both, no conflicts, Compare equal.
8. Presence: A opens a task, B sees A as viewing/editing.

## Release gate
A batch is done only when its items reach **owner device-verified** (audit section 6) and `npm test` and `npm run test:cloud` still pass. Test counts alone never close an item.

- **Approved additions after the freeze (2026-11-23 "yes to all")**: 0.8.40 restore a deleted task (BUILT), 0.8.41 board rename/archive (BUILT), 0.8.42 board create/delete + new sign-in screen (BUILT, Planner-tested only). Remaining: group/ungroup and linked objects, Canvas comments, projects and governance on v4.
- 0.8.43 group/ungroup + linked objects (BUILT, Planner-tested only). Remaining: Canvas comments, projects and governance on v4.
- 0.8.44 Canvas comments (BUILT, Planner-tested only).
- 0.8.45 governance records: risks, work breakdown, budget lines, documents (BUILT, Planner-tested only). Remaining: 0.8.46 to 0.8.50 (see PLAN-projects-governance.md).
- Projects and governance: planned as six builds 0.8.45 to 0.8.50, see `PLAN-projects-governance.md` (4 decisions needed from the owner).
