# CHG-NP-0.3.9 — Multi-board Kanban and Android task-screen reliability

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Niyarvo Projects (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.9` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `niyarvoprojects`, Android `com.niyarvo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Add independently named project boards with membership separate from task status, create/delete/assign flows, protected Main board, independent-height lane layout; fix raw whitespace in task custom-field choice View; include embedded Atlas test fixture.

**Files / modules:** src/boards.cjs, src/model.cjs, App.js, tests/operations-boards.test.cjs.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

Every board currently uses the same four status lanes. Native gesture performance still needs physical-device QA.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.
