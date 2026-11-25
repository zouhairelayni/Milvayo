# Milvayo 0.8.27 audit: why the tests said "passed" while real features failed

Written for Elay, in plain words. No code was changed for this audit. Source: the owner's QA pack (161 cases: 33 working, 9 not working, 119 not tested) plus a read of the current code.

## 1. Short answer

The passing numbers were true, but they measured something much smaller than "the app works".

- The tests checked that the **server accepts the right calls** and that the **app's planner builds the right calls**. Those parts do work.
- The tests never ran the **real screens**, **two real devices**, the **real live signal (Realtime Database)** or **real waiting time**. The QA run did, and that is where things broke.
- On top of that, I wrote "works on v4" in the changelog and summary for each release. That was too strong. The honest label was "server and planner tested, not confirmed in the real app". This is corrected in the changelog and in the new status labels (section 6).

## 2. What the owner's QA found (facts)

| Case | Result | What the owner saw |
|---|---|---|
| SYNC05 | Not working | Deleting across devices does not settle; instant conflicts; "Keep cloud version" sometimes does nothing on the device that resolves |
| SYNC08 | Not working | Canvas notes do not show up on the other device |
| SYNC09 | Not working | Connectors do not show up on the other device |
| SYNC10 | Not working | The pending counter does not clear |
| SYNC11 | Not working | False conflicts; no Canvas conflict was ever reported |
| SYNC14 | Conflict | Normal one-after-the-other edits ended in a conflict |
| PRESENCE02, 05, 06, 07 | Not working | No online/typing/editing indicators (note: both clients used the same test account) |
| Other | Slow | Reorder and board rename took 5+ minutes to appear; deleting different tasks from both devices took very long |
| Other | Web | Refreshing Chrome disconnects the cloud session (changes are kept) |

Screenshots: the Expo Go Canvas shows a blue note, a yellow note and a connector that the web Canvas does not show. The "Review conflicts" screen says "No queued conflicts" while the two Canvases differ. The conflict list shows "This record was deleted…" entries, with the buttons "Keep my changed fields" and "Keep cloud version".

## 3. Findings (what is wrong, with proof level)

Proof levels: **CODE** = read directly in the code, certain. **QA** = seen by the owner. **HYPOTHESIS** = fits the evidence, must be measured before we fix it.

### F1. One stuck edit blocks every edit behind it (CODE, matches SYNC10 and the "never settles" notes)
- Where: `src/cloud/journal.cjs`, function `drain`. It stops as soon as the first queued edit has status "conflict". Edits are sent strictly in order.
- Any edit the server refuses for good (an unsupported change, a validation error, a delete conflict) becomes "conflict" and **freezes the whole queue**. Everything the owner did afterwards (Canvas moves, renames, new notes) sits behind it and is never sent.
- This is the most likely reason Canvas "never synced" and the counter never reached zero.

### F2. "Keep cloud version" cannot work when the task was deleted (CODE, matches MIL-QA-001/002 and screenshots 555143/555144)
- Where: `src/cloud/session.cjs`, `fetchLatest` (full read that leaves out deleted records) and `resolveConflict`.
- When the other device deleted the record, the app looks up the cloud copy, finds nothing, and refuses **both** choices with "Deleted records require the authorized recovery workflow; your original edit is retained". The conflict then stays forever and (through F1) blocks the queue.
- For "Keep cloud version" this is wrong: the correct result is simply to throw away my edit, because the cloud version is "deleted". There is also no v4 way to restore a deleted record, so "Keep my changed fields" has no safe path yet.

### F3. Receiving device waits up to 5 minutes (HYPOTHESIS supported by constants, matches the "5+ minutes" reports)
- Where: `session.cjs`, `nextDelay` and `SIGNAL_FALLBACK_MS = 300000`.
- When the app believes the live signal works and nothing is pending, it only checks the cloud every 5 minutes (10 if the window is hidden). If the live signal says "connected" but its change notices never trigger a pull, every receiver is 5 minutes late. Without a live signal the app would poll every 60 s at most.
- Supporting hint: presence also runs on the same Realtime Database and also did not show up.
- Not proven. We need to measure: is the signal "live", and does the head-change callback fire in the real clients?

### F4. Most edits are not sent immediately (CODE)
- Where: `src/store/store.js` line 77 only queues the edit (`capture`). Only the task sheet Save / Verify / Record merge buttons call `syncNow`. Reorder, board, Canvas and other edits wait for the background round, which sends only if 45 s passed since the last send and the window is visible (`session.cjs`, `tick`).
- Result: a sender delay of up to about 50 s, **on top of** F3 on the receiver. Together this explains "minutes".

### F5. Changes the server cannot take yet block instead of staying local (CODE, matches the board-rename slowness)
- Where: `v4Writes.cjs` (`notYet`) raises "not available in v4 workspaces yet", and `journal.cjs` treats that as a permanent conflict, so by F1 it blocks the queue.
- Affects: board rename, title, archive, create and delete; group/ungroup; linked objects; Canvas comments; moving several tasks at once; a move into a gap smaller than 1e-9; projects.
- The owner was never told this on the main screens. The message only appears in the recovery area.

### F6. Pending counter is not honest (CODE)
- Where: `journal.cjs`, `status()`: `pending` counts every queued item, including conflicts. A single stuck conflict keeps it above zero forever, and nothing on the main screens says why.

### F7. Canvas divergence cause is unknown (HYPOTHESIS, needs a direct check)
- Candidates in order of likelihood: (a) Canvas edits are queued behind a stuck conflict (F1); (b) they were sent but the other device has not pulled yet (F3/F4); (c) a Canvas record kind or field is not delivered by the change feed; (d) Canvas objects were created on both devices while the devices were out of step.
- "No queued conflicts" on the Expo Go screen does not exclude (a), because a blocked queue can sit behind a conflict on another record or behind a pending item.
- Check needed: after a fresh reload of both clients, compare the list of object IDs on each. If they match, it is latency; if not, it is a delivery or send bug.

### F8. Many "false" conflicts probably are consequences, not separate bugs (HYPOTHESIS)
- Chain: a device is late (F3) → the owner edits the same record on the other device → the base version is stale → real conflict on the same field → F1 blocks the queue. Both clients also used one account, which gives no information about who changed what.
- Cannot be confirmed until F3/F4 are fixed or measured.

### F9. Web refresh disconnects (CODE, probably by design, needs a decision)
- `connect()` needs explicit credentials and nothing stores them, so reloading the page asks to reconnect. Changes are kept (good). Persisting a sign-in is a security decision for the owner.

### F10. Presence test was not valid (QA design)
- Both clients used the same synthetic account, and presence ignores your own entries by design. This needs two different test users before any conclusion.

### F11. Storage rules warning (open, untraced)
- Emulator warning about a null value in `storage.rules` line 8. Low priority.

## 4. How the findings connect

```
Edit on device A  ->  queued only (F4: no immediate send)
        |
        v
A sends later; if the server refuses ANY edit for good (F5/F2)
        |
        v
That edit becomes "conflict" and blocks everything behind it (F1)  ->  counter never clears (F6)
        |
Device B only looks every 5 min (F3?)  ->  edits on B use old data  ->  more conflicts (F8)
```

Fixing F1 and F2 first stops one bad edit from freezing the rest. Fixing F4 and F3 makes the other device catch up in seconds.

## 5. Why the tests did not catch it

| Gap | What the tests did | What the real app does |
|---|---|---|
| G1 | Tested the planner and the server calls separately | The real screens produce different records and field combinations (board bookkeeping, update times, groups) |
| G2 | Used a fake in-memory database and a fake signal | Real Realtime Database listeners can be slow, denied by rules or never fire |
| G3 | Used a fake clock that jumps ahead | Real waiting times (5 min fallback, 45 s send interval) were never waited |
| G4 | Edited data directly or through one helper | Real edits come from many screens, most of which do not trigger a send |
| G5 | One test user or two scripted people with perfect timing | Real use: both devices edit at once, one is late |
| G6 | Checked "the other side ends identical" after calls were forced | No test asked "does it settle by itself within N seconds with nothing pending?" |
| G7 | Delete tests used records that still existed in the cloud copy | Real deletes leave deleted markers that the conflict screen cannot resolve (F2) |
| G8 | Counted passes | Counts only prove what is covered; unsupported actions were never listed as "will block everything" |

The sandbox cannot run the emulators, so the emulator suites were only ever run by you on Termux. Neither side drove the real UI.

## 6. Status labels from now on

Every item in the changelog, summary and handoffs will carry one of these, never a bare "works":
1. **Planner-tested** (sandbox): the app builds the right calls.
2. **Server-tested** (emulator, owner-run): the server accepts and rejects correctly.
3. **Flow-tested** (two clients, real timing, owner-run): the other device shows it within the stated seconds and nothing stays pending.
4. **Owner device-verified**: you saw it work on the real app on two devices.

Only level 4 counts as "working". All of 0.8.22–0.8.27 are at levels 1–2 only, except what the QA marked as working (33 cases, listed in the QA pack).

## 7. What the audit could not decide

- Whether F3 is real (needs a measurement of the live signal).
- Whether Canvas divergence is a delivery bug or only lateness (F7).
- Whether the QA environment (Expo Go on a phone reaching the emulators) lets the phone reach the Realtime Database emulator at all. If it cannot, the signal never works on the phone.
