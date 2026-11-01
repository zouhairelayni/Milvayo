# CHG-NP-0.3.2 — Local-first sprint planning and burndown

## 0. READ FIRST — technical handoff

| Field | Observed state |
|---|---|
| Project | Niyarvo Projects — independent of RIVNA and Niyarvo Control Center |
| Starting archive | `NiyarvoProjects-v0.3.1-LOCAL-QA.zip` |
| Result | `v0.3.2` local QA candidate, **NOT USER ACCEPTED** |
| Git branch | Intended for user-managed `work`; no Git commands performed |
| Platform | Expo SDK 58, React Native 0.88.1, Web/Android/iOS source, Metro |
| App identifiers | `com.niyarvo.projects` preserved for Android/iOS |
| Firebase | Dedicated `niyarvoprojects` project not connected or deployed |
| Automated checks | **196/196 passed**: 184 pre-existing + 12 added sprint tests |
| Syntax | 6 JSX files parsed successfully by TypeScript; package/app/PWA manifest JSON parsed |
| Web / Android / iOS runtime | **Not run** |
| Installed packages / Expo install check | **Not run** in this environment; no dependencies changed |
| Baseline revision / user Git SHA | Not available; do not invent SHA |

## 1. Features implemented

1. **Sprint lifecycle per project:** create a dated planned sprint with name and goal; one active sprint per project; start/finish transitions are explicit. A sprint spans 1–90 calendar days. Completed sprints preserve scope IDs, final counts and recorded event history.
2. **Task assignment:** optional `sprintId` on tasks, with assignment to planned or active sprints, removal, and prevention of assignment to completed/missing sprints. A task can belong to only one sprint at a time.
3. **Sprints screen:** sidebar and mobile bottom-tab entry, sprint selector, creation form, task assignment and unassignment, task details navigation, bounded/searchable backlog, active sprint progress and explicit completion confirmation.
4. **Recorded burndown:** progress events capture current total and incomplete task counts upon sprint start, assignment changes and subsequent status edits. Plot shows observed remaining-work counts and a separately labeled ideal line; **does not synthesize earlier work history**. Burndown uses calendar days and task counts, not story points or weighted work.
5. **Completing a sprint:** final scope and progress are retained, all task sprint assignments cleared so unfinished work returns to the unassigned backlog. Actual task status, estimate, dates, verification and dependencies are left unchanged. A recovery workspace snapshot is taken before completion and planned-sprint deletion.
6. **Data compatibility:** optional `sprints` array on each project and `sprintId` on each task. Existing `niyarvo.project.v1` format and AsyncStorage key `niyarvo-projects-v1` unchanged; projects without these properties load with empty sprint lists. Project/workspace JSON, snapshots and restore include new fields.
7. **Existing functions preserved:** Gantt geometry and gestures, Kanban drag, custom workflow rules, task types, safe area, selected accent, color-tintable Niyarvo mark and local backups are not replaced.

## 2. Architectural derivation (OpenProject as reference, no code copied)

Conceptual areas reviewed from prior source inventory:
- `modules/backlogs`: backlog/iteration concepts and sprint completion;
- `app/models/work_package.rb`: shared task records independently of presentation;
- `app/services/workflows`: lifecycle transitions and validations;
- `modules/backlogs/app/models/burndown.rb`: burndown as separate projection from status/activity events.

Niyarvo independently authors `src/agile.cjs` for the pure domain operations and `src/SprintPanel.js` for the responsive UI. This is **not** a port, transcription, or line-for-line adaptation of third-party source.

## 3. Business invariants and caveats

- Missing sprint IDs, duplicate sprint IDs, multiple simultaneously active sprints, invalid calendar dates and invalid lifecycle transitions are rejected in project validation.
- Active sprint history is append-only through app actions and capped to 500 records per sprint. Historical counts are *not* tamper-proof: local JSON can be edited; server trust/authorization will require independent Firebase backend rules later.
- Completed sprint snapshots may reference task IDs later deleted, intentionally preserving historical scope. The reported final numbers are frozen at completion.
- Status edits and bulk status operations record an event when the active sprint's counts or membership change. Unrelated edits do not generate artificial progress entries.
- No auto-assign on task creation, sprint task estimates, story points, holidays, team capacity, retrospective, points burndown or sprint velocity forecasts yet.
- User's selected accent preferences remain in a separate AsyncStorage preference; they are **not** serialized into project JSON.
- UI validation is pending: no browser or Android interaction screenshots were captured from the new build.

## 4. Files changed

- `App.js`: Sprints navigation, domain callbacks, sprint-history recording on task edits/bulk actions.
- `src/model.cjs`: sprint task field, normalized per-project sprint collection, validation and agile export.
- `src/agile.cjs`: new independent pure sprint lifecycle and burndown module.
- `src/SprintPanel.js`: new React Native sprint/backlog/burndown UI.
- `tests/agile.test.cjs`: 12 new domain tests.
- `package.json`, `app.json`, `README.md`, `AGENTS.md`, `docs/NP-QA-0.3.2.md`, `docs/UNSLOP-NP-0.3.2.md`.

## 5. Verification evidence

**Passed:** `node --test tests/*.test.cjs` -> 196 passed, 0 failed, 0 skipped. Six JSX files parsed using TypeScript `createSourceFile` (no syntax diagnostics). `app.json`, `package.json`, and `public/manifest.json` JSON parse. ZIP CRC check planned on package creation.

**Not run:** Metro compilation on Termux, Android Expo Go touch interaction, browser runtime UI, iOS runtime, `npx expo install --check`, Firebase emulators, remote security/rules tests.

## 6. Runtime QA acceptance checklist

Read `docs/NP-QA-0.3.2.md`. Export workspace JSON first. Install on user `work` branch; don't merge to main until mobile/Web QA and previous Kanban/Gantt regressions pass. Do not force-push existing repo or change Firebase settings.

## 7. Next batch candidates

- Portfolio dashboard and multi-project saved queries.
- Story points/estimates, sprint capacity and sprint retrospective while keeping measurement provenance clear.
- More configurable workflow action definitions and guard rails; only after confirming current sprint UI acceptance.
