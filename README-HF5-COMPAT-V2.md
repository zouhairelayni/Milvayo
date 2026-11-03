# Niyarvo Projects 0.5.33 — HF5 installer compatibility v2

This ZIP replaces **only** `scripts/apply-np-0533-hf5.cjs` in the user's existing Niyarvo Projects checkout. It requires the previously extracted HF5 Compatibility ZIP (including `src/ui/theme/rivnaPalette.cjs` and `docs/qa/np533-hf5-hunks.json`). It does not include or replace app files.

## Cause addressed

Two additional variations prevented the installer from running:
- Timeline `Page` toolbar action markup differed in its third hunk. The installer now locates the `Segmented` zoom control within the scoped Timeline `actions` expression, verifies that only the three known navigation chips are being relocated, and refuses other controls.
- The diagnostics test had a different or absent `Items` assertion. The installer now rewrites a single matching old assertion or leaves a non-obsolete diagnostics test alone.

The source changes are still applied atomically only after all hunks pass. App data, desktop/mobile mode logic, theme exports, gesture engines and dependency routing are not edited by this compatibility update itself.

## Commands

```sh
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NP-0.5.33-HF5-COMPAT-V2.zip
node scripts/apply-np-0533-hf5.cjs --dry-run
node scripts/apply-np-0533-hf5.cjs
node --test tests/ui/np533-hf5-interface.test.cjs
npm test
```

If dry-run still refuses, **stop**. Do not force edits. Supply the exact `Timeline.js` `Page` header and `diagnostics-048.test.cjs` task-row assertion to diagnose the remaining mismatch.

## Validation in isolated checkouts

- Original HF4 checkout: successful apply; targeted checks passed.
- Reordered Timeline chips: successful apply; targeted checks passed.
- Alternative diagnostics regex: successful apply; targeted checks passed.
- Unknown Timeline action: refuses with no source files written.
- Re-running after apply: zero source files to write.
- Full synthetic fixture regression after apply: 581 passed, 1 skipped, 0 failed.

These are source-level checks only; the exact Termux working tree and runtime remain unverified.
