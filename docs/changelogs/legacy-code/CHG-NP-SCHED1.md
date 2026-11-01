# CHG-NP-SCHED1 — Scheduling foundation batch

## 0. READ FIRST

| Field | Observed value |
|---|---|
| Project | Niyarvo Projects — independent of RIVNA / Niyarvo Control Center |
| Baseline | v0.2.5 local QA source |
| Batch | NP-SCHED1 (additive engine-only patch; app version unchanged) |
| Work branch | `work` (user-owned; not modified by this session) |
| Status | **Engine QA candidate**; not UI-integrated, not released |
| Scope | Dependency scheduling / calendar / guarded cascade |
| UI ownership | Claude Sonnet 5.5 High redesign in parallel; protected |
| Firebase | Not connected, deployed or modified |
| Existing project imports | No imports performed; schema unchanged |

## 1. Files created

- `src/scheduling.cjs` — pure calendar and dependency scheduling module.
- `tests/scheduling.test.cjs` — 37 new automated regression tests.
- `scripts/schedule-smoke.cjs` — executable isolated sample (no user data).
- `docs/NP-SCHED1-INTEGRATION.md` — API, explicit limitations, subsequent UI wiring contract.
- `docs/NP-SCHED1-QA.md` — follow-up QA / merge checklist.
- `CHG-NP-SCHED1.md` — this release-handoff file.

**Files deliberately not touched:** `App.js`, `src/GanttView.js`, `src/gantt.cjs`, `src/model.cjs`, `src/design.cjs`, `package.json`, `app.json`, `schemas/*`, `.opencode/skills/*`, Firebase configuration, application storage.

## 2. Implemented capabilities

- Four typed link semantics, positive/negative lag with bounded inputs.
- ISO date-only UTC calculations and calendar/working-day modes, with weekends and exception dates.
- Validation of IDs, cycles, unknown or duplicated edges, malformed dates, off-calendar endpoints.
- Graph-based push-only rescheduling of descendants of explicit anchors; handles multiple predecessors, due-only milestones, preserves duration.
- Read-only audit + preview, explicit apply with stale-state guard. No mutation before confirmation; moved task verification/merge flags invalidated.
- Legacy link representation (plain `dependsOn`) works unchanged. No persistent typed links yet.

## 3. Tests executed

| Check | Result |
|---|---|
| Existing v0.2.5 tests + new tests (`npm test`) | **Pass, 103/103** |
| Scheduling test module new cases | **Pass, 37/37** |
| Script syntax (`node --check`) | **Pass** |
| Isolated smoke scenario | **Pass** (2 successors shifted, 0 conflicts) |
| ZIP structural integrity | **Verified** |
| Web Metro / Android Expo Go / iOS | **Not run** |
| Existing user workspace import/restore on device | **Not run** |
| Actual UI reschedule controls | **Not implemented** (deferred to merge) |
| Git commit/merge/push | **Not performed** |
| Firebase deployment | **Not performed** |

## 4. Unslop and OpenCode implementation discipline

Read the checked-in `.opencode/skills/unslop/SKILL.md` and reviewed the application engineering rules in `AGENTS.md`. This batch changes **no UI components**, so UI before/after assessment is **not applicable** and no visual-design improvement is claimed. Sonnet owns the active redesign. The UI integration batch must apply the nine Unslop passes to actual controls and verify them on device.

## 5. Known gaps / future migration

- No persistent per-link type/lag values or per-project calendar configuration; add in a coordinated v2 schema migration after receiving Sonnet's accepted source.
- Existing Gantt link rendering and critical path still assume FS/calendar days.
- No resource leveling, conflict solver, manual task locks, multi-user transaction, or new cloud service.
- Scheduling engine is not wired to UI and therefore does **not** create new user-visible functionality in this patch.

## 6. Reversible installation and next model handoff

Use the *additive-only* `NiyarvoProjects-NP-SCHED1-ENGINE-PATCH.zip` on `work`, after a Git checkpoint/backup. It contains no existing UI files; overwriting the current Sonnet redesign is unnecessary. Run `npm test` and `node scripts/schedule-smoke.cjs` before integrating.

For a later integration, provide this changelog plus Sonnet's latest source ZIP / commit and the patch ZIP. Validate project-model differences before wiring the preview/apply path.
