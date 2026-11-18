#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
if [[ ! -f src/cloud/server/index.cjs || ! -f firebase.json ]];then echo 'Run this script from the Milvayo repo.' >&2;exit 2;fi
if [[ "$(node -p "require('./package.json').version")" != '0.8.10' ]];then echo 'WARNING: This meter was source-checked against Milvayo v0.8.10. Installer refuses changed server formats.' >&2;fi
out="${MILVAYO_IO_OUTPUT:-$HOME/milvayo-v4-full-io}";mkdir -p "$out"
log="$out/emulator.log"
restore(){ node scripts/patch-io-audit.cjs remove || echo 'IMPORTANT: audit index.cjs still modified; inspect before committing' >&2; }
trap restore EXIT HUP INT TERM
node scripts/patch-io-audit.cjs install || exit 2
node --check src/cloud/server/index.cjs || exit 2
node --check src/cloud/server/ioAudit.cjs || exit 2
printf 'Running the complete existing Firebase emulator cloud suite. Results: %s\n' "$out"
MILVAYO_IO_AUDIT=1 JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:--Xms32m -Xmx192m -XX:ActiveProcessorCount=2}" firebase emulators:exec \
  --only auth,firestore,database,functions,storage,hosting --project demo-milvayo-083 \
  'node src/cloud/tools/runTests.cjs' > "$log" 2>&1
code=$?
echo "Emulator suite exit code: $code"
grep -E '^# (tests|pass|fail|skipped)|^[[:space:]]*[ℹ✔✖].*(tests|pass|fail)' "$log" | tail -15 || true
node tests/helpers/report-firebase-io.cjs "$log" "$out" || exit 2
node tests/helpers/scan-firebase-usage.cjs "$out" || exit 2
printf '\nAttach these files for analysis:\n%s\n%s\n%s\n' "$out/milvayo-v4-io-audit.json" "$out/milvayo-v4-io-audit.csv" "$out/milvayo-v4-io-audit.md"
exit "$code"
