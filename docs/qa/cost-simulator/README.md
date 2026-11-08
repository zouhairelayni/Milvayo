# Milvayo Firebase v3.0 — cost simulator v1

## Purpose
A small, repeatable calibration pilot using **real requests against local Firebase emulators**, followed by offline projections for 100 / 1,000 / 10,000 / 100,000 monthly active users (MAU). This is **not** a load test or a Firebase invoice. It is meant to improve the prior fixed 30-actions-per-user-per-day extrapolation.

## Install
This patch **adds** three source/test files and this README; it does **not** replace `src/cloud/costModel.cjs`, the application, Firebase rules, package files, or deployment settings. It expects the Milvayo v0.8.5 + Firebase v3.0 Phase 1 source already present and the existing 6-emulator setup.

From native Termux (`~/Milvayo`):

```sh
node --test tests/cloud/cost-simulator.test.cjs
JAVA_TOOL_OPTIONS='-Xms32m -Xmx192m -XX:ActiveProcessorCount=2' \
  firebase emulators:exec --only auth,firestore,database,functions,storage,hosting \
  --project demo-milvayo-083 \
  'node src/cloud/tools/costSimulator.cjs pilot' \
  > "$HOME/milvayo-cost-pilot.log" 2>&1
# inspect output; allow nonzero exit so the report can be reviewed
node src/cloud/tools/costSimulator.cjs project
```

## What the pilot does
Two owners create two *independent* synthetic workspaces of **100** and **500 tasks**. Each invites a distinct contributor (four authenticated accounts in total). Each workspace exercises owner edits (task title and repeat, owner, status, due date, soft delete, restore), contributor edits (title, owner, status), owner cold and resumed pull, collaborator pull, one message and one chat fetch, and final readback verification.

It submits actions sequentially to avoid saturating Termux and does **not** issue more than one request at a time during sampling. It will create considerable ephemeral emulator data but will not access production. Results are checkpointed to `$HOME/milvayo-cost-pilot.json` after each call; a failed run retains a partial report. `pilot.finished` must be `true` for projection.

## Output
- `$HOME/milvayo-cost-pilot.json` — sampled operations; response-instrumented reads/writes/deletes, transaction retries, `allAttemptsReads` if reported by the API, Functions telemetry, request/response JSON byte counts, failures, role and workspace size.
- `$HOME/milvayo-cost-pilot.log` — emulator output and sampled table, if redirected as above.
- `$HOME/milvayo-cost-projection.json` — weighted activity scenarios and per-service **incomplete** infrastructure subtotals.
- `$HOME/milvayo-cost-projection.csv` — four-row scenario summary (opens in spreadsheet applications).

## Scenario assumptions (edit `costSimCore.cjs` if necessary)
MAU cohort: casual 50% (8 active days, 5 edits/day), regular 35% (18 active days, 15 edits/day), power 15% (26 active days, 40 edits/day). Workspace-size mix: 55% 100 tasks, 35% 500 tasks, 10% 2,000 tasks. Mutation mix: 35% title, 15% owner, 20% status, 20% due date, 7% soft deletes, 3% restores. Every user's first monthly pull is treated as cold; later pulls reuse a cursor. Session-based polling uses 5-minute fallback plus assumed remote change pulls. `firstTouchShare = 25%` estimates how often historical-version write overhead occurs.

The 2,000-task bucket is **extrapolated** from 100- and 500-task samples *only if* the two measurements show a constant or linear relation. It is not an emulator measurement at 2,000 tasks in this pilot.

## Critical limitations
- *Only successful owner commits* disclose all read/write instrumentation; contributor operations measure latency and writes but may omit reads.
- Server instrumentation is not billing. Retry attempts, failed operations, security rules, client SDK reads, and index reads are not fully accounted for. `allAttemptsReads` is collected but not added to billable reads.
- Message reads/writes are not instrumented by `service.cjs`; their current model numbers are **explicit assumptions**. Message request latency is sampled.
- Soft deletes are tombstone writes; **physical deletes** (retention, receipts, versions, expired content) are not represented. Seeing zero here does not mean production will have no deletes.
- RTDB actual downloaded bytes, listeners, storage, backups, log volume, hosting, auth, index-entry reads, egress and other costs require additional measurement or assumptions. For an *explicit, unmeasured* RTDB scenario, use `node src/cloud/tools/costSimulator.cjs project --rtdb-kb-per-active-day 250` (250 KB per active user-day); default excludes RTDB rather than silently declaring it free.
- Functions CPU and memory costs use measured per-request wall time with v3.0 **1 vCPU, 512 MiB** settings. Production concurrency can share compute; rates can differ. Partial subtotals are not an invoice or reliable total spend.
- The historical price table `docs/cloud/prices-us-central1.json` is dated **2026-11-07**, and applies a single Firebase project's allowances.
- This is a calibration experiment, not a production-like concurrency benchmark. Previous stress-test findings remain separate.

## Next version
Measure RTDB listener downloaded bytes from a real client; add chat operation counters; audit physical cleanup/delete jobs; sample repeat edit distributions; add device session traces; validate totals against isolated staging billing. None of these are implemented in v1.
