# Milvayo v0.8.10 — I/O audit meter correction

This **test-only** patch fixes the first whole-cloud audit. No business logic,
application configuration, deployment or Git files are modified.

## Fixes

1. A Firestore prototype probe used an invalid odd-segment document path,
   causing the existing collaboration and emulator tests to fail before
   running many actions. The path is now valid and performs no database I/O.
2. The old RTDB wrapper produced zero RTDB operations even when grant and revoke
   used RTDB. This version instruments reference methods on their prototype.
   Its smoke test verifies that interception; actual SDK behavior remains to be
   confirmed by the Termux emulator run.
3. The smoke test checks valid Firestore paths (so the first bug cannot recur).
4. Adds emulator success scenarios for `groupDelete`, `patchCanvas` and
   `latencyProbe`—three action paths the existing suite doesn't positively
   measure.
5. The source inventory no longer classifies generic `list()` calls as Firebase
   Storage operations. The scan remains a **candidate list**, not full client
   Firebase I/O coverage.

## Run in Termux

```sh
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v4-IO-Audit-Meter-Fix.zip -d .
node tests/helpers/io-audit-selftest.cjs
bash scripts/run-firebase-io-audit.sh
echo "exit $?"
node scripts/patch-io-audit.cjs status
```

Expected meter status: `temporary emulator meter not installed`.
The runner is the one installed from the original full audit package.

Share `$HOME/milvayo-v4-full-io/emulator.log` if tests fail; otherwise share
`milvayo-v4-io-audit.json` and `.md` to inspect per-action measured costs.

## Limitations

Even 49/49 successful dispatches is *not* every Firebase I/O path: client-side
RTDB listeners, Auth/Storage, scheduling, rules evaluations, data sizes, denied,
no-op, duplicate and concurrency variants need separate coverage. SDK counts are
not billing; they reflect observed operations within measured requests.

Nothing in this package claims the Firebase emulators have passed.
