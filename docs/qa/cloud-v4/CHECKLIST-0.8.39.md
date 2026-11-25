# Check for 0.8.39: storage rules warning

Status of this version: rule written, not yet run on emulators. Nothing counts as working until your emulator run shows it.

1. Run `npm run test:cloud` (or `node scripts/qa-evidence.cjs`). The new "storage rules" test must pass (the cloud total goes up from 396).
2. Look in the emulator log for the old warning "Null value error ... storage.rules line 8". It should be gone.
3. If either fails, send the cloud log. Nothing in the app depends on this rule yet.
