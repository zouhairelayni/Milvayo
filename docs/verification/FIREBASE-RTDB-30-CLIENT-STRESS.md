# Milvayo v4 — 30-client RTDB presence scaling audit

This is an **emulator-only** stress test of the existing `src/cloud/client.js` `heads()` and `presence()` implementation. It does **not** modify the application's production runtime.

## Prerequisites

- Milvayo v0.8.10 project including the previously installed 5-client `tests/helpers/bench-v4-client-rtdb.cjs`
- Local Firebase emulator CLI, dependencies, and `tests/helpers/cloud-emulators.cjs` already installed
- Termux on Android; run from `~/Milvayo`
- No production Firebase credentials required. The script refuses missing/non-local emulator hosts and uses project `demo-milvayo-083`.

## Run

```bash
cd ~/Milvayo
node tests/helpers/bench-v4-client-rtdb-scale.cjs --selftest

MILVAYO_CLIENTS=30 MILVAYO_IDLE_MS=80000 \
JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" \
firebase emulators:exec \
  --only auth,firestore,database,functions,storage,hosting \
  --project demo-milvayo-083 \
  'BENCH_OUT=$HOME/milvayo-v4-client-rtdb-scale.json node tests/helpers/bench-v4-client-rtdb-scale.cjs' \
  > "$HOME/milvayo-v4-client-rtdb-scale.log" 2>&1
code=$?
echo "Audit exit: $code"
tail -n 40 "$HOME/milvayo-v4-client-rtdb-scale.log"
```

Outputs: `~/milvayo-v4-client-rtdb-scale.json`, `~/milvayo-v4-client-rtdb-scale.md`, `~/milvayo-v4-client-rtdb-scale.log`.

## Workload

- Provision 30 distinct authenticated users in a local organization; fixture is granted 30 **simulated local-only** licensed seats (one owner, 29 viewer roles).
- Open 30 `heads()` listeners and 30 `presence()` sessions, each with `onDisconnect` cleanup and informational connection listeners.
- Verify every client observes all 29 other users in the same project resource.
- Remain idle for 80 seconds, passing at least two 25-second heartbeat cycles.
- Perform one real backend task edit and require 30 `heads()` listeners to observe a change.
- Stop all listeners, remove all sessions, cancel `onDisconnect` operations, and check listener counters for leaks.

## What the counters mean

- `databaseSets`, `databaseRemoves`: client SDK calls (not necessarily separate chargeable writes).
- `presence_events`, `heads_events`: listener callback deliveries; callbacks may be coalesced.
- `presence_downloadPayloadBytes`: number of UTF-8 bytes when *re-serializing* listener snapshots with `JSON.stringify`; **not actual wire bytes or billed transfer**.
- `verification.idleEventsPerHeartbeatWrite` and `idleBytesPerClientPerMinute`: derived only from the measured idle phase.
- The 30-client load tests the behavior of one subscribed room, not 30 independent rooms.

Firebase RTDB cost is not comparable to Firestore per-document read/write counts. This test does not measure exact RTDB billing, simultaneous-connection limits, Cloud Functions setup costs, Auth billing, TLS overhead, or entire journal/offline synchronization. Additional 5-vs-30 matching-duration benchmarks and full lifecycle tests may follow.

If the run fails due to emulator pressure, keep the JSON and log as evidence; do not assume an app defect. Limitations: Node Web SDK clients on one device, 192MB emulator JVM setting, local host. No source changes, deployment, or Git modifications are performed by the script itself.
