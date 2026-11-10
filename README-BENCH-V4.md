# Milvayo Firebase v4 Gate 2 — wider cost and 30-user benchmark

**Test-only archive. No app/server/rules modifications. Local `demo-milvayo-083` emulators only.**

There are **two independent scripts**:

1. `tests/cloud/bench-v4-workflows.cjs`: measures **10 currently supported v4 task-patch cases**, including Mark Done with and without a completed dependency, and a forbidden Done transition. It separately measures **18 legacy-v3 workflows**, including task creation/deletion, dates, adding/removing dependencies, Canvas object operations, Canvas threads, sprint creation/assignment, time tracking, and comments. It reports **v4 unsupported operations** rather than claiming those were optimized. Both categories use real Functions/Firestore emulator calls when run on the device.
2. `tests/cloud/bench-v4-gate2.cjs`: measures three simple v4 costs and then **30 separate authenticated accounts concurrently editing 30 different tasks with a mixed workload** (title, description, priority, owner, stage, position, status). It independently checks the 30 changed fields in Firestore. This isolates the shared-workspace bottleneck; it does **not** measure same-task editing conflicts or 30 Canvas collaborators.

### Install (Termux)

Download `Milvayo-v4-Expanded-Workflow-Benchmarks.zip` to Android Downloads, then:

```bash
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v4-Expanded-Workflow-Benchmarks.zip -d .
node --check tests/cloud/bench-v4-workflows.cjs
node --check tests/cloud/bench-v4-gate2.cjs
```

### Run both with one emulator startup

```bash
cd ~/Milvayo
JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" \
firebase emulators:exec \
  --only auth,firestore,database,functions,storage,hosting \
  --project demo-milvayo-083 \
  "node tests/cloud/bench-v4-workflows.cjs && node tests/cloud/bench-v4-gate2.cjs" \
  > "$HOME/milvayo-v4-expanded-bench.log" 2>&1
code=$?
echo '=== BENCHMARK SUMMARY ==='
tail -n 95 "$HOME/milvayo-v4-expanded-bench.log"
echo "Exit code: $code"
```

The second script runs only if the first succeeds. To run either independently, replace the quoted command with that single Node invocation.

Results are saved to:
- `$HOME/milvayo-v4-workflow-costs.json`
- `$HOME/milvayo-v4-gate2-bench30.json`

The workload creates disposable emulator-only workspaces, tasks and accounts. The expanded script includes 500-task and 500-Canvas-object scenarios, so it can use more resources and time on Termux than the narrow three-operation run. It never touches production. It intentionally leaves `npm test` and `npm run test:cloud` unchanged and is not automatically executed by either.

### Interpretation

- **v4 task patches:** currently implemented: title, description, priority, owner, stage, position, status, Done. Some Done operations read prerequisites. The service's `measured` data is used. A blocked dependency transition is verified as rejected, not included as a successful-write measurement.
- **Legacy v3:** due/start dates, dependency edits, task add/delete, Canvas operations, sprint records, time logging, task comments, etc. These **are not currently supported on protocol-4 workspaces**. Legacy measurements identify future optimization targets, not achieved v4 performance. Soft delete is a write, not a Firestore document delete.
- **Still not app-wide benchmarked:** live chat/messaging, file uploads/storage, administration and grants, imports, backup/restore, automation and release workflows, multi-device offline sync, UI render time, and Firebase production billing. The app's correctness tests cover some of these but they have not been included in the cost workload matrix.
- Cost numbers are logical document operations reported by server instrumentation for each request; not full billable Firebase operations. Setup, client SDK accesses, rules-dependent reads, failed/retried attempts, Firebase RTDB, Storage and verification accesses are excluded. Local emulator latency is not production performance.
- The 30-user result is one local emulator run, not a safe production concurrency limit. Distinct-task conflicts are intentionally absent. It does not prove that the server is bottleneck-free under mixed real usage.

### Validation performed before delivery

- Both scripts pass Node syntax checks.
- 8 existing Gate 2 patch unit tests pass locally.
- All 28 workflow fixtures and simulated request paths complete with a lightweight mock backend (not a real emulator). The fixture transformations also passed actual canonical schema validation with the project source.
- No actual Firebase emulator execution in this sandbox. **Device/emulator results must be collected before quoting read/write/delete or throughput figures from this package.**
