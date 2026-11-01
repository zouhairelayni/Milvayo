# Niyarvo Projects v0.3.12 — source audit, evidence and traceability

**Audit performed:** 2026-10-31 · **Source archive:** `NiyarvoProjects-v0.3.12-LOCAL-QA.zip` · **Audit type:** static source/release-note inspection plus Node tests on fresh-extracted source. No modifications to app code were made to produce these documents.

## Product identity and provenance check

**Canonical name: Niyarvo Projects.** No alternate name or code name is established by the audited v0.3.12 source or bundled changelogs. **Do not introduce unverified branding in code, documentation, migrations or handoffs.** Niyarvo Projects is independent from both RIVNA and Niyarvo Control Center.

The release history summarizes source and changelog evidence; assertions about runtime fixes are explicitly limited to user-confirmed outcomes. Proposed work is labeled as future work, never as implemented code.

## 1. Source inventory and test evidence

| Evidence | Observation |
|---|---|
| Archive | `NiyarvoProjects-v0.3.12-LOCAL-QA.zip`, 186 ZIP entries, project-root files at archive root; no `node_modules`/Git history. |
| Package | `name: niyarvo-projects`, `version: 0.3.12`, Expo `~58.0.20`, React Native `0.88.1`; dependencies in `package.json`. |
| Primary UI | `App.js` plus `src/GanttView.js`, `SprintPanel.js`, `SchedulingPanel.js`, `AutomationStudio.js`, `TaskConfigurationPanel.js`, `PowerUpsPanel.js`, `WorkspaceExtensions.js`, platform-specific BrandMark. |
| Domain | `src/*.cjs`: model, work task workflows, Gantt/windowing, planning, scheduling, sprint, board/filter/automation/powerUps, operations, imports, theme/design/viewport. |
| Test suite | `npm test` run directly against a fresh extraction: **297 passed, 0 failed**; see `test-results/NP-v0.3.12-HANDOFF-RECHECK.txt`. |
| Last delivery report | v0.3.12 changelog states 297/297 Node tests and successful JSX/ZIP checks in its original build environment. |
| Runtime | **Not re-run in this audit**: Expo Web Metro, Android Expo Go, iOS, device gestures, browser interaction automation, Firebase Emulator, GitHub auth. |
| User-confirmed QA | After v0.3.11-HOTFIX2, user said “Yes both work on android and web.” This confirms the reported drawer/logo bugs on those platforms, not every v0.3.12 feature. |
| Atlas import | User stated “Alright the imports work” after v0.3.2-HOTFIX2; screenshots show 73-task project and sprint burndown. No raw database reconciliation/profiling was conducted here. |
| Deployment/Git | No commit SHA for current user's `work` branch; archive isn't Git; no Firebase deployment, production Web release or APK build performed in documentation audit. |

## 2. Documentation/source discrepancies worth repairing

1. **README banner:** Current `README.md` starts `# Niyarvo Projects v0.3.11 — cumulative local QA candidate` even though `package.json` is `0.3.12`. It includes multiple historical sections and duplicated headings. Use the handoff pack as navigation until a dedicated documentation maintenance batch updates README.
2. **JSON Schema lag:** `schemas/niyarvo.project.v1.schema.json` does not expose every optional field present in the runtime project/task model (`sprints`, `kanbanViews`, custom schema/task fields, board/sprint IDs). The schema has unspecified `additionalProperties`, so the primary issue is an *incomplete contract*, not necessarily export rejection. Actual validation is done by `src/model.cjs`, `src/taskSchema.cjs`, `src/scheduleProject.cjs`, etc. Add structured schema tests in future work; do not strip new fields from exports.
3. **Release changelog locations:** `docs/CHG-NP-0.2.6.md` and `docs/CHG-NP-0.2.9.md` are the historical records; they are not present as top-level `CHG-NP-0.2.6.md` or `CHG-NP-0.2.9.md`. Also `CHG-NP-SCHED1.md` describes the separate engine foundation. All are deliberately included in the annotated-source bundle.
4. **Cumulative batching:** The source changelogs v0.3.3–v0.3.10 report source testing as part of a cumulative v0.3.10 release; do not infer individual deploy tags/build artifacts.
5. **UI inspection limits:** Node model and JSX/source-contract tests validate data rules/source shapes; actual Android/Web gesture and lifecycle behavior must be manually or interactively tested. Previous failures appeared after apparently passing test suites. Do not label untested behavior “fixed” solely from code inspection.
6. **Docs with older “not implemented” claims:** Some early README/QA text says comments, capacity, multi-board or scheduling UI do not exist; those statements were true at that historical version, **not** current v0.3.12. Consult the chronological map and current source instead.
7. **Local data semantics:** “Workspace” means local persisted state and import/export; there is no synchronized multiuser account. Status/merge/release fields are not validated against remote Git. App color setting stored in separate key.
8. **Brand/icon semantics:** In-app N logo is dynamic, browser favicon can change; platform launcher icons are static orange. `BrandMark.web.js` exists to avoid browser SVG adapter failure for logo, not all Gantt SVG rendering.

## 3. Platform and data safety boundaries

- **Android/Web:** user-confirmed specific 0.3.11-HOTFIX2 drawer/logo fixes; v0.3.12 re-test pending.
- **Android import:** native direct file picker (v0.3.2-HOTFIX2) user confirmed imported Atlas. Older unreadable cache errors were real but should not be reopened without new evidence.
- **Android Gantt:** model Gantt windowing limits initial rendered rows/dates/paths, but no heap trace shows full crash-free behavior across all devices/task volumes.
- **iOS:** app identifier and Expo source are present, but no recorded iOS device QA.
- **Cloud:** `firestore.rules` and `storage.rules` both deny all. No Firebase client dependency. Hosting configuration has headers/SPA rewrite but is not an authorization or storage implementation.
- **GitHub:** `src/powerUps.cjs` supports canonical URL linking and public read-only API previews; no OAuth, private repo read, webhook, GitHub write, GitHub merge validation.
- **Documents:** URL-only external task attachments; do not call these hosted binary files.
- **Automations:** local event/explicit button/due sweep; unattended due rules and notifications do not exist.

## 4. File-to-feature traceability

| File(s) | Source evidence for docs |
|---|---|
| `App.js` | Entire screen map/navigation; local persisted data keys, import/export, modal/Task drawer, status and verification UI, Kanban and lower management routes. |
| `src/model.cjs` | Project/task defaults, `niyarvo.project.v1`, workspace structure, limits, moveTask, dependency validation, snapshots, verification and release guards. |
| `src/boards.cjs` + `src/kanbanUX.cjs` | Multiple boards, membership/rename/delete/return to Main, card filters, per-board display, duplication and labels. |
| `src/agile.cjs` + `src/SprintPanel.js` | Sprint lifecycle, recorded event history and burndown chart. |
| `src/scheduling.cjs` + `src/scheduleProject.cjs` + `src/SchedulingPanel.js` | Working days, typed constraints/lag, audit/preview/apply and snapshot. |
| `src/gantt.cjs` + `src/gantt-window.cjs` + `src/GanttView.js` | Geometry, zoom/range/hierarchy/links, windowed rendering and supported critical path. |
| `src/planning.cjs` + `src/taskWorkflows.cjs` + `src/taskSchema.cjs` | Saved task views, rollup/effort, hierarchy, bulk edit, task types/fields/workflow. |
| `src/automation.cjs` + `src/AutomationStudio.js` | Event matching, validated rule actions, local execution history. |
| `src/powerUps.cjs` + `src/PowerUpsPanel.js` | Per-board Power-Up config, GitHub link URL parsing and public previews, due date/aging/checklist. |
| `src/operations.cjs` + `src/WorkspaceExtensions.js` | Portfolio, resource/time, budget/cost, comments/reminders, velocity, CSV and templates. |
| `src/importFiles.cjs` | Android picker and max import bytes. |
| `src/theme.cjs` + `src/design.cjs` + `src/BrandMark.*.js` | Accent palette and platform-specific mark. |
| `firestore.rules` + `storage.rules` + `firebase.json` | Deny-all Firebase security placeholders and hosting scaffold. |
| `schemas/niyarvo.project.v1.schema.json` | Supplemental documentation of project fields; incomplete relative to model. |
| `examples/ATLAS-MOCK.project.json` | Broad 73-task fixture for import, Gantt, sprint, dependencies and test state. |
| `tests/*.test.cjs` | 297 deterministic unit/source-contract checks. |
| `.opencode/skills/unslop/SKILL.md` + `AGENTS.md` | UI engineering discipline and handoff protocol. |

## 5. Historical evidence file index

- Root `CHG-NP-0.1.0.md`, `CHG-NP-0.2.0.md` through `CHG-NP-0.2.5.md`, and `CHG-NP-0.2.7.md`, `CHG-NP-0.2.8.md`, `CHG-NP-0.3.0.md` through `CHG-NP-0.3.12.md` as available in the full source (with versions detailed in release history).
- `docs/CHG-NP-0.2.6.md`, `CHG-NP-SCHED1.md`, and `docs/CHG-NP-0.2.9.md` are the special historical checkpoints.
- `CHG-NP-0.3.2-HOTFIX1.md`, `CHG-NP-0.3.2-HOTFIX2.md`, `CHG-NP-0.3.2-HOTFIX3.md`; `CHG-NP-0.3.11-HOTFIX1.md`, `CHG-NP-0.3.11-HOTFIX2.md` record both regression cycles.
- `docs/NP-QA-*.md`, `docs/UNSLOP-NP-*.md`, `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md`, `docs/NP-OPENPROJECT-CAPABILITY-MAP-v1.md`, `docs/NP-FIREBASE-READINESS.md` contain more detailed contemporary test plans and comparisons.

## 6. Handoff integrity checklist (for this pack)

- [x] v0.3.12 full archive read and extracted.
- [x] Historical changelog and hotfix records inventoried; special 0.2.6/0.2.9 locations checked.
- [x] Node tests re-run: 297/297.
- [x] Current source modules and 17 navigation names mapped.
- [x] User-confirmed vs source-only status separately represented.
- [x] Local-only/cloud boundaries explicitly documented.
- [x] Future architectural gaps and versioned next-work plan defined.
- [ ] Runtime Expo Go/Web v0.3.12 acceptance — **not performed in this documentation audit**.
- [ ] iOS, Firebase emulator, GitHub OAuth, production deployment — **not performed / not implemented**.

The annotated source ZIP leaves application code and `package.json` unchanged. It only adds the documentation set under `docs/handoff-v0.3.12/` (along with a top-level pointer). Do not describe it as a new app release or assign version v0.3.13.
