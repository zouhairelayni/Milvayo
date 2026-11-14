# Milvayo v0.8.10 — Control A benchmark fixture fix

Source: user-uploaded `Milvayo 0.8.10.zip`. Only `tests/helpers/bench-v4-concurrency.cjs` is replaced.

**Bug:** Control A reuses `tasks[40+i]` although earlier shared-workspace sweeps change part of that range. This can produce stale-revision conflicts instead of a valid single-token baseline.

**Change:** Reserve non-overlapping tasks for sequential (first 20), sweeps (next 68 by default), and Control A (next 30). Require enough tasks; do not silently wrap the cursor back to previously used tasks. A failing Control A now exits nonzero **after saving the report**. The comparison caption now notes that owner vs contributor roles also differ.

Default allocations (`BENCH_USERS=30`, `BENCH_TASKS=500`): sequential 0–19; sweep 20–87; control A 88–117.

## In Termux

```sh
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v4-Control-A-Fix.zip -d .
node --check tests/helpers/bench-v4-concurrency.cjs
MILVAYO_BENCH=1 JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" \
  firebase emulators:exec --only auth,firestore,database,functions,storage,hosting \
  --project demo-milvayo-083 \
  "BENCH_OUT=$HOME/milvayo-v4-concurrency-control-a.json node tests/helpers/bench-v4-concurrency.cjs" \
  > ~/milvayo-v4-concurrency-control-a.log 2>&1
echo "exit $?"
tail -n 45 ~/milvayo-v4-concurrency-control-a.log
```

Expected: Control A no longer fails due to **reused task fixtures**. The emulator run is still needed to establish actual success and latency. This archive has not been emulator-tested here.
