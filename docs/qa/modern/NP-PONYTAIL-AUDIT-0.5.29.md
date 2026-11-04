# NP-PONYTAIL-AUDIT-0.5.29

Method: MemoryRelay `select_skills` returned Ponytail and Ponytail Audit; both followed.

What this repo does: Niyarvo Projects is a local-first project manager (Expo React Native) that keeps one saved workspace in AsyncStorage. Load assumed: one person on one phone, up to ~30 projects and a few MB of data.

Scope read: `src/store/` (store, workspaces, latestWriter, backupBudget, importFiles), `Backup.js`, `Menus.js`, `ModernApp.js`, test runner. Not read: Timeline, Board gestures, domain modules beyond what the store calls, `niyav*.js` internals.

## Must fix (all fixed)
1. **Import lands in the wrong workspace** (`src/screens/workspace/Backup.js` `readPicked`/`runImport`, `store.js` `importProject`)
   - What this is: Picking a file decodes it first (seconds for a password file on Android), then adds its projects.
   - Problem: The add used whatever workspace was open when decoding ended. Pick in A, switch to B, wait: projects appear in B.
   - Fix: `importProject(text, workspaceId)` refuses with a notice if the open workspace changed.
   - If we skip it: Projects silently end up in the wrong workspace.
2. **Late GitHub preview writes into the new workspace** (`store.js` `refreshGithubLink`)
   - What this is: Fetches a link preview, then saves it on the task.
   - Problem: Task IDs repeat when one backup is loaded as two workspaces, so a switch during the fetch saves the preview on the same-ID task in the other workspace.
   - Fix: a switch counter is checked after the fetch.
   - If we skip it: Wrong task is edited.

## Should fix (fixed)
3. **Retained pages and task sheet keyed by project ID only** (`ModernApp.js`)
   - Problem: Same project ID in two workspaces keeps the old page, search text and state alive after a switch.
   - Fix: keys use workspace + project; request state resets on a workspace change.
4. **Index reconcile returned a new object every start** (`workspaces.cjs`)
   - Problem: caused a needless list write on every launch. Found by the new test.
   - Fix: return the same object when nothing changed.

## Open
5. **Typed text lost during a switch (low).** Lazy fields commit 300 ms after typing (`commitBuffer.cjs`); a commit during a switch is refused by `trans`. Needs several taps inside 300 ms; not reproduced. Fix idea: flush buffers before opening the switcher.
6. **Complete backup holds one workspace.** `backupText(all)` exports the open workspace only. Not a bug in 0.5.29 scope; planned 0.5.30.
7. **No executed test of the store's switch code** (no renderer here). One small test with a mocked AsyncStorage would close it once node_modules exists.
8. **Serialization cost per edit, measured on desktop Node only:** `fitBackups` 2.1 ms, `JSON.stringify` 10.3 ms for a 3.5 MB workspace. No change made; phone timing Not run. Not a confirmed bottleneck.

Verdict: the new workspace code is sound by reading and by the tests that could run; run the Android checklist before trusting it.
Lean: no dependencies added; 1 new source file (~95 lines), 1 component pair (~110 lines). 0 lines removable found in the touched code.
Not checked: Timeline, Board, domain rules, `niyav*` internals, import/export round-trips beyond the guard, brief items A, B, D, E (not started).
