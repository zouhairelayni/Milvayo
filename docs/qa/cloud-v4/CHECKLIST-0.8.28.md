# Real-app checklist for 0.8.28 (diagnostics only, run in split screen: Expo Go + web)

Nothing is fixed in this version. The goal is to get facts. Use two different test users if you already have them (decision D4); if not, one account is fine for this check.

1. Open the Cloud panel on both clients and connect to the same workspace. Open **Sync status** on both and leave it open.
2. Write down for each client: **Live signal** (YES or NO), the **Why** line if NO, and **Mode**.
3. On client A change one task title. Watch client B's Sync status and write down: how many seconds until B shows the new title; whether "changes heard" went up on B; the "Last send" age on A.
4. On client A add a Canvas note and a connector, move the note. Wait 60 seconds. If B still does not show them, look at A's **Queue** lines: is there a BLOCKED line?
5. On both clients open **Compare with cloud** and press **Compare with cloud now**. Use "Share this result as text" (or select and copy) and send me both results.
6. Reload the web page, connect again, run Compare again on both and send me those two results too.

What I will read from your results:
- Live signal NO on the phone: the phone cannot reach the live database (audit finding F3 / section 7).
- Live signal YES but "changes heard" stays 0 on B: the signal exists but does not fire (F3).
- BLOCKED line on A: the stuck-queue problem (F1).
- Compare on both clients lists the same Canvas IDs in the cloud but different IDs on one device: lateness or delivery on the receiving side. Different IDs in the cloud: the sender never delivered (F7).

Status label for 0.8.28: Planner-tested only.
