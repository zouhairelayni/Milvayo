# Niyarvo Projects v0.5.33 — regression-suite reconciliation

## Why the full suite failed after the successful 5/5 merge checks

Niyarvo Projects v0.5.31 Desktop HF1 and Sonnet's independently produced v0.5.32 redesign both used 0.5.31-style file and test names, but they implemented **different, incompatible UI contracts**. Extracting the HF1 ZIP with `unzip -o` replaces common paths but **does not remove files created only by Sonnet's ZIP**. The recursive `tests/run-all.cjs` therefore runs Sonnet-only assertions against HF2/v0.5.33 source:

- `tests/app/shell-redesign-0531.test.cjs` expects Sonnet's sidebar, `layout.boardColumnWidth`, `visibleMonths.map`, Sonnet accent token names and additional UI features deliberately *not* transferred into v0.5.33.
- `tests/ui/layout-0531.test.cjs` expects Sonnet's theme `accentTokens`, `LIGHT/DARK` export and its separate breakpoint module, not our retained theme.
- `tests/ui/desktop-mode-0531-hf1.test.cjs` expects the old **700px** automatic Web desktop threshold. HF2 correctly changed it to **320px**; its regression assertions must now reflect portrait desktop mode.
- `tests/app/single-app-migration-051.test.cjs` rejects root-level release markdown, but the cumulative release ZIPs introduced several `CHG-NP-` / `NP-QA-` files at the root. These should live in `docs/qa/release-notes`.
- Source inspection showed the old Board renders the priority indicator as a color dot with no accessible priority label. The tiny indicator gets an accessibility name without any geometry/drag changes.

These are **mixed-baseline test failures**, not evidence that the five targeted 0.5.33 changes failed. They do not prove that Web/Android works, nor do they prove all accessibility checks pass on device.

## What the guarded patch does

1. Requires the approved desktop `LayoutProvider`, HF2 portrait selector and direct `uiBase` store import, and an already applied v0.5.33 merge. Refuses other baselines.
2. Archives **only recognized** Sonnet-specific 0.5.32 test sources to `docs/qa/historical-sonnet-0532/` (their content is retained, not discarded). Tests of the actual v0.5.33 code, including `selective-merge-0533`, remain active.
3. Archives the existing HF1 desktop test and edits only its old `700px` and literal Web-automatic assertions to match the 320px contract. Other assertions are preserved. Adds an independent, executable `desktop-portrait-0533.test.cjs` validating 319/320/390/768/1440 Web and native separation.
4. Relocates root `CHG-NP-*.md` and `NP-QA-*.md` to `docs/qa/release-notes/`, matching the app repository's documented release-note placement rule. No notes are deleted.
5. Adds an accessibility label to the existing Board priority dot. Adds `board-priority-a11y-0533.test.cjs` to guard the fix; no board drag logic changes.
6. Uses a dry-run and preflight checks to avoid modifying unrelated checkouts. Re-running after a successful application is a no-op.

**Not touched:** app entry/shell, Web portrait routing, theme tokens, UI Controls buttons, Gantt/board engines, domain model, storage/schema, manifests and dependencies. No APK, deployment or Git operations.

## Install (inside the existing working checkout)

```sh
cd ~/NiyarvoProjects
# Your prior backup patch remains in ~/storage/downloads/NP-before-0533-recovery.patch
unzip -o ~/storage/downloads/NP-0533-TEST-RECONCILIATION.zip
node scripts/reconcile-np-0533-tests.cjs --dry-run
node scripts/reconcile-np-0533-tests.cjs
node --test tests/ui/selective-merge-0533.test.cjs tests/ui/desktop-portrait-0533.test.cjs tests/ui/board-priority-a11y-0533.test.cjs
npm test
```

After tests, run `npx expo start --clear` to inspect portrait/landscape Web, Board drag and Timeline on the device. **Do not commit** until those pass and project data persistence is checked. If the script refuses unknown source markup, leave it stopped and provide the message; do not force it.

## Verification in the supplied environment

Simulated the reported mixed checkout by adding the two original Sonnet v0.5.32 test files, an older HF1-style breakpoint test, and a root changelog to the existing **synthetic** v0.5.33/HF2 fixture. Applied the reconciliation and re-ran the recursive Node runner:

- Dry-run: expected changes listed without modifying files.
- Apply: completed; second dry-run: zero changes.
- Targeted new/adjusted suites: 5 tests passed.
- Full synthetic Node suite: **579 pass, 0 fail, 1 skip** (580 total).

**Limit:** The exact installed HF1 application files and user's working tree are not available here. The old desktop test's formatting may differ from the test fixture, in which case the script can leave another outdated assertion; the next user-run test output is authoritative. The synthetic suite proves the reconciliation script functions on the representative conflict, not that the actual physical device passes. We did not run Metro Web or Android/iOS instrumentation.
