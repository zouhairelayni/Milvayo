# v0.8.10 validation

- Pass: changed JavaScript syntax checks; JSON release versions and build numbers agree; current changelog heading exists once.
- Pass (2026-11-14, owner-requested rerun): npm test — 1,122 passed, 0 failed, 8 skipped; npm run test:cloud — 191 passed, 0 failed, 0 skipped. Both commands exited 0. Includes viewer cache/role-change regression coverage and isolated emulator security assertions.
- Not run: Expo compatibility check, Web, Expo Go and Fast Refresh.
- Existing baseline: npm test had one missing-heading failure; cloud had 15 reported failures including failed parent tests. These are pre-fix results, not acceptance of this update.
- No data migration, dependency changes or security-rule changes. Work remains on work; no commit, merge or deployment.
- Reversible update: preserve the existing uncommitted working folder before copying these changed files to Termux. Retain local data. Validate there before a checkpoint. To roll back, restore that saved folder's affected files together, including package/lock/Expo/Functions versions; do not reset unrelated local edits.
