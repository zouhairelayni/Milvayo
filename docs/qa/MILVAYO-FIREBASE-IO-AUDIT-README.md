# Milvayo v0.8.10 — Firebase I/O audit (emulator-only)

## What this does

This diagnostic runs the **existing complete Firebase emulator test suite** with temporary Firestore/Realtime Database SDK instrumentation. It audits the **full inventory of 49 `cloudApi` actions**, rather than a selected set of task edits. It records every API action the tests exercise and prominently identifies actions without a successful tested execution.

The report does **not** imply that all execution branches, data sizes, UI or Firebase services are covered. A positive response tests only that path. No real deployment is involved.

## On Android Termux

With `~/Milvayo` on version 0.8.10 and Firebase CLI/emulators already installed:

```bash
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v4-Complete-IO-Audit-v0810.zip -d .
node tests/helpers/io-audit-selftest.cjs
bash scripts/run-firebase-io-audit.sh
```

The runner installs a **temporary, marker-guarded** diagnostic wrapper in `src/cloud/server/index.cjs`, starts the emulators, executes every existing cloud test plus the additional organization/billing positive-path test, summarizes the results and **restores the original index.cjs on exit**. The wrapper is activated only with `MILVAYO_IO_AUDIT=1` and a demo emulator project. Do not run this against production.

**Do not use `git add .` or commit the temporary instrumented index.cjs.** The file `src/cloud/server/ioAudit.cjs` remains inert unless explicitly loaded by the temporary diagnostic wrapper.

The output files are written to `$HOME/milvayo-v4-full-io/`:

- `milvayo-v4-io-audit.json`: per-request anonymized metrics and per-action read/write/delete/retry/latency summaries.
- `milvayo-v4-io-audit.csv`: spreadsheet-friendly 49-action table.
- `milvayo-v4-io-audit.md`: human-readable coverage and metrics.
- `milvayo-v4-client-io-inventory.json` and `.md`: candidates for client-side or non-dispatch Firebase operations **not measured** by this server-side meter.
- `emulator.log`: raw test output; **review before sharing**, because arbitrary test messages may contain test data.

Share the **JSON, CSV and Markdown** reports. If the emulator suite fails, share the relevant error excerpt; no need to share the whole log unless required.

Check the temporary wrapper was restored:

```bash
node scripts/patch-io-audit.cjs status
```

Expected: `temporary emulator meter not installed`.

## Counting semantics

The meter intercepts Firestore Admin SDK document and query reads, transaction attempts, document creates/sets/updates/deletes and some direct writes. For queries it counts `max(1, returned documents)` as an observed-read proxy. Aggregation `count()` calls count as one observed unit, but **index entry billing is not measured**. Transaction reads from failed attempts and retries contribute to observed reads; writes are counted after a successful transaction. It also counts Realtime Database `ref().get/once/transaction/set/update/remove` API calls.

**Not Firebase billing counts:** no Firestore index-entry charges, rule-evaluation reads, background triggers outside the handler, SDK/network retries below the API surface, Storage transfer, client listeners, client-side Firebase usage, RTDB listener events or bandwidth, Auth calls, Hosting, or production pricing. No database snapshots are claimed to be exact Firestore billing evidence.

## Coverage: what must happen next

This is **phase 1 of a literal all-workflows audit**, not a claim that all operations are already tested. Use the generated report to identify `NOT_EXERCISED` and `ERROR_ONLY` actions, then create a positive and negative emulator scenario for each. After every action has a success-path measurement, extend coverage to no-op, retry, conflict, denied, abnormal, cascading and large-workspace variants, including tasks/canvas at 10/100/500/2,000 and 1/2/5/10/20/30 users.

Also add a separate client-side browser/Android test harness for direct Firestore, RTDB listener, Storage and offline synchronization, and independent Auth/Storage rules tests. Until they are instrumented, they must remain explicitly **unmeasured** in the total audit.

Source fingerprint: this audit was prepared from the user-uploaded **Milvayo 0.8.10 ZIP**, not the live Termux working tree. The installer checks critical source snippets and refuses unknown layouts.
