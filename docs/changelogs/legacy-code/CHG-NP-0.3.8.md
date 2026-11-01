# CHG-NP-0.3.8 — Reports, CSV exports and project templates

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Niyarvo Projects (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.8` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `niyarvoprojects`, Android `com.niyarvo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Export task and time datasets as CSV with spreadsheet-formula injection mitigation. Duplicate project structures into clean templates, remap hierarchy and dependency IDs, and clear execution records.

**Files / modules:** src/operations.cjs, src/WorkspaceExtensions.js, App.js.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

CSV is deliberately narrower than full JSON. Template cloning does not clone execution or release history.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.
