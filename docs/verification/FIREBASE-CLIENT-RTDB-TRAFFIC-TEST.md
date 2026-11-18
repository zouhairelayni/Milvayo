# Milvayo v4 — Next Firebase emulator test: RTDB client traffic

Targets the actual `src/cloud/client.js` `heads()` and `presence()` logic using the Web Firebase SDK against local Firebase emulators. No application changes, commits, or deployment.

## Install in Termux

```bash
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v4-Client-RTDB-Next-Test.zip -d .
node tests/helpers/bench-v4-client-rtdb.cjs --selftest
```

## Run

```bash
cd ~/Milvayo
JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" \
firebase emulators:exec --only auth,firestore,database,functions,storage,hosting --project demo-milvayo-083 \
  "BENCH_OUT=$HOME/milvayo-v4-client-rtdb.json node tests/helpers/bench-v4-client-rtdb.cjs" \
  > "$HOME/milvayo-v4-client-rtdb.log" 2>&1
code=$?
echo "exit $code"
tail -n 35 "$HOME/milvayo-v4-client-rtdb.log"
```

Attach `~/milvayo-v4-client-rtdb.json` and `~/milvayo-v4-client-rtdb.log` (or relevant tail) for analysis.

## What is measured

- 1 vs 5 actual authenticated RTDB head listeners, initial snapshot events and payload sizes
- 5 active presence sessions, initial writes and at least one real 25-second heartbeat
- Cross-client presence propagation / peer visibility
- Change signal received after a real backend task edit
- SDK-observed listener callbacks, `set`, `remove`, `onDisconnect` registrations, and JSON payload byte sizes
- `login` and `signOut` operations; initialization of Firestore/Storage clients

## Important limitations

* This **does not count billable Firestore/RTDB reads**, download protocol overhead, network frames, rules lookups, Auth billing, or Storage object operations. RTDB listeners have different billing models from Firestore document reads. Values are instrumented SDK activity and JSON payload lengths.
* Changes through the `cloudApi` during fixture setup and task edit are **excluded** from this client-transport report; the preceding 49-action audit covers backend operation counts.
* This tests the app's RTDB transport methods but **not the entire `session.cjs` polling/journal/offline lifecycle**, screen navigation, Auth token refresh, storage file transfer, or production traffic.
* Source loader converts `client.js` named imports to `require()` **only in memory** to run the genuine logic from Node; it does not alter application code. Fails closed if the import structure changes.
* Only local demo emulator endpoints are accepted; generates disposable test identities in emulators.
