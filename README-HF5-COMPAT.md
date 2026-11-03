# Niyarvo Projects v0.5.33 — HF5 compatibility installer

This archive replaces **only the HF5 installer**, supplies its existing patch payload and targeted test, and adds an RIVNA theme palette module used without deleting any additional exports from the existing theme.cjs.

## Install (from NiyarvoProjects project root on Termux)

```
unzip -o ~/storage/downloads/NP-0.5.33-HF5-COMPAT-FIX.zip
node scripts/apply-np-0533-hf5.cjs --dry-run
node scripts/apply-np-0533-hf5.cjs
node --test tests/ui/np533-hf5-interface.test.cjs
npm test
```

The installer still refuses unexpected files or missing desktop/HF4 prerequisites, and preflights every change before writing any file. If it refuses, do not force the update; collect the three source files and diff for a source-specific fix.

If `npm test` still reports a root changelog, move `CHG-NP-0.5.33-WEB-MOBILE-LINK-COLORS.md` to `docs/qa/release-notes/` using `mv -n` and rerun.

## Adaptations

- Timeline state hunk: accepts the legacy `showUnscheduled` declaration even with extra trailing content, without touching the Gantt gesture or connection logic.
- Theme.cjs: preserves all existing exports, overlays the RIVNA palette as additional exports, and includes precise Dark, AMOLED, Light colors.
- Diagnostics check: accepts whitespace variants in the legacy `Items` assertion; preserves the rest of the test file.
- All other HF5 hunks remain exact-match guarded.

## Tested

- Standard HF4 representative checkout: 589 passed / 1 skipped / 0 failed.
- Modified checkout with extra theme export, alternate Timeline state line and diagnostics whitespace: 589 passed / 1 skipped / 0 failed; extra theme export retained.
- Repeated dry run: zero changes.

Tests are source-level only. Web and Android runtime checks not performed in the user's Termux environment.
