# Firebase v4 verification package: what to run in Termux

Evidence labels used everywhere: SANDBOX-FAKE = in-memory fake database in Claude's sandbox; EMULATOR = real Firebase emulators in Termux (only you can produce this); NOT RUN. Nothing here is marked emulator-verified until you send passing output. Do not deploy, commit, push or merge anything.

## 1. Install (from your project root)

```bash
cd ~/Milvayo
git status --short            # note unrelated files; never use git add . or git add -A
unzip -o ~/storage/downloads/Milvayo_v4_verification.zip -d .
for f in src/cloud/server/patch.cjs src/cloud/server/cascade.cjs src/cloud/server/index.cjs \
         tests/helpers/cloud-fake.cjs tests/helpers/cloud-scenarios.cjs \
         tests/helpers/bench-v4-concurrency.cjs tests/helpers/baseline-v4-workflows.cjs tests/helpers/bench-v4-sandbox.cjs \
         tests/cloud/patch-cascade.emulator.test.cjs tests/cloud/security.emulator.test.cjs tests/cloud/patch-create.emulator.test.cjs tests/cloud/patch-canvas-delete.emulator.test.cjs; do node --check "$f" || echo "SYNTAX FAIL $f"; done
firebase deploy --help >/dev/null 2>&1 && echo "reminder: do NOT run firebase deploy"
```

Back up first so every change is reversible: `git stash list` stays untouched; copy the project folder or `git diff > ~/pre-v4-verification.patch`.

## 2. Run the tests (once, in this order)

```bash
# 2a. Whole app suite (no emulators needed)
npm test > ~/milvayo-npm-test.log 2>&1; echo "exit $?"; tail -n 40 ~/milvayo-npm-test.log

# 2b. Whole cloud suite with emulators (includes every emulator test listed in section 4)
JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" npm run test:cloud > ~/milvayo-test-cloud.log 2>&1; echo "exit $?"; tail -n 80 ~/milvayo-test-cloud.log
```

Send back both logs (or the last 80 lines plus the `not ok` blocks). Diagnostics from the new emulator tests print as `# delete "...": N reads, M writes, transactionMs ...`.

## 3. Concurrency investigation (one run, then optionally a second)

The benchmark records, per request, the delay before the Function starts, token verification, handler time, authorization time, transaction wall time and attempts, plus three controls that separate shared-document contention from emulator throughput. It asserts nothing about the cause.

```bash
cd ~/Milvayo
# Run 1: normal transactional authorization (default).
MILVAYO_BENCH=1 JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" \
firebase emulators:exec --only auth,firestore,database,functions,storage,hosting --project demo-milvayo-083 \
  "BENCH_OUT=$HOME/milvayo-v4-concurrency-transaction.json node tests/helpers/bench-v4-concurrency.cjs" \
  > ~/milvayo-v4-concurrency-run1.log 2>&1; echo "exit $?"; tail -n 60 ~/milvayo-v4-concurrency-run1.log
```

Send `~/milvayo-v4-concurrency-transaction.json` and the log tail. Do NOT run anything else for this question; I will read the stage breakdown and the three comparisons first.

Optional second run, only if I ask for it after reading run 1 (experimental mode, security implications not established, never for production):

```bash
MILVAYO_BENCH=1 MILVAYO_PATCH_AUTH_MODE=snapshot JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" \
firebase emulators:exec --only auth,firestore,database,functions,storage,hosting --project demo-milvayo-083 \
  "BENCH_OUT=$HOME/milvayo-v4-concurrency-snapshot.json node tests/helpers/bench-v4-concurrency.cjs" \
  > ~/milvayo-v4-concurrency-run2.log 2>&1
```

Controls in the benchmark: (A) one token instead of 30 users; (B) 30 concurrent read-only probes (no writes); (C) 30 users each editing their own organization (no shared documents). Environment: your earlier run used the same JAVA_TOOL_OPTIONS; the 192 MB Firestore emulator heap and 2 CPUs are themselves candidate limits and are recorded in the report.

## 4. What each test checks

SANDBOX-FAKE, executed by Claude (all passing unless noted):
- security-regress (7): revoked admin does not regain the role; operation ID bound to actor and edit; chat blocked during write freeze while revocation still works; platform security role cannot assign or remove owners; internal errors become generic and `history` on a missing record is handled; invitations need an active workspace and are capped at 100; RTDB ACL writes retry 3 times and surface the third failure.
- acl-signal (4), heads grant matrix, revocation ACL, fail-closed grants.
- patch (8), patch-fields (3), patch-canvas (3): one-write budget, authorization, seat, protocol, freeze, stale/duplicate/tombstone, and equivalence with canonical validation over 784 task-field and 26 Canvas combinations.
- patch-cascade (5): delete and dependency edits end in exactly the state produced by the domain functions (8 delete and 12 dependency scenarios), read counts independent of project size, permission, stale, idempotent, and size-cap fallbacks.
- patch-canvas-delete (4): removing Canvas objects ends in exactly the state of the domain remove cascade (7 selections: plain object, frame with children, children with comment and connector, several objects, two frames, object plus its frame), refuses locked objects, stale revisions and missing objects, is idempotent, keeps cost independent of board size (9 reads, 1 write at 100 to 999 objects), and honors permission and the 50-object limit.
- patch-mode (4): experiment mode off by default and equal results when on; stage timings and latency probe are instrumentation only; bench timings for non-administrators need MILVAYO_BENCH=1 plus an explicit request; service-reported counts equal the independent fake-database counts.
- Full repository run in the sandbox: 915 tests, 835 pass, 71 fail, 9 skipped; the 71 failures are the same environment failures as the untouched 0.8.5 source (missing node_modules, assets, public); the 7 skipped are baseline skips plus the 6 emulator suites in this package.

EMULATOR, waiting for your Termux run (NOT RUN, therefore NOT VERIFIED):
- patch-cascade.emulator: delete (leaf; relations with release, comments, time entries, reminders, typed links; children with verified grandchild) and dependency edits (add, replace with verified downstream reset, remove with typed links kept, cycle refused) compared with the domain functions on real Firestore documents; bounded reads; stale revision writes nothing.
- security.emulator: S1 re-invite as admin, operation-ID reuse, chat during freeze, unauthenticated request returns 401 with no internal text, history on a missing record has no internal text, no telemetry for non-administrators, invitation to a missing workspace refused.
- patch.emulator (from the previous package) and heads-rules.emulator (already verified by you, 12/12).
- Index build: the three new composite indexes (projectId with data.dependsOn, data.parentId, data.taskId) are not enforced by the emulator; their first real use is NOT RUN.

## 5. Before and after operation counts (all SANDBOX-FAKE; no emulator-measured numbers exist for these yet)

| Workflow | 100 / 500 / 2,000 tasks, before | after |
| --- | --- | --- |
| Title, priority, dates, labels, estimate | 109 / 509 / 2,009 R (6 W) | 5 R, 1 W |
| Status change | 8 R, 7 W | 6 R, 1 W |
| Canvas move or resize (1,000 objects) | 1,012 R, 6 W | 5 R, 1 W |
| Delete a task (no relations) | 110 / 510 / 2,010 R, 7 W | 8 R, 1 W |
| Add a dependency | 109 / 509 / 2,009 R, 8 W | 9 R, 2 W |

Baselines for every other workflow: docs/qa/cloud-v4/WORKFLOW-BASELINES.md. Still on the old path and scaling with project size: create task, add comment, log time, Canvas add, Canvas text edit, Canvas delete (about N reads each). Reproduce: `node tests/helpers/baseline-v4-workflows.cjs --write` and `node tests/helpers/bench-v4-sandbox.cjs` (no emulator needed).

## 6. Unresolved risks and owner decisions

- The 10-minute RTDB ACL expiry after a failed revocation write is unchanged (decision D7); retries only lower the odds.
- The concurrency cause is unknown. The shared-document contention explanation is a hypothesis; the controls are designed to confirm or reject it.
- Cascades are proven against the domain functions in the fake database only; real Firestore query and transaction behavior is NOT RUN.
- Decisions D1, D2, D4, D5, D6, D9, D10, D11 are in `docs/Milvayo-Handoffs/firebase v4.0 gate 3 design.md`.

## 7. Revert

Every file in this package is a new or replaced file. To revert: `git checkout -- <file>` for modified files you track, delete new files, or restore the backup patch from step 1. No stored data format changed.
