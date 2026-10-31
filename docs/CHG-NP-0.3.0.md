# CHG-NP-0.3.0 — Task configuration + safe-area correction

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Application | Niyarvo Projects (independent of RIVNA / Niyarvo Control Center) |
| Base | `NiyarvoProjects-v0.2.9-LOCAL-QA.zip` |
| Candidate | `0.3.0` — **LOCAL QA, NOT ACCEPTED** |
| Git branch | User's `work` branch — no remote changes made |
| Firebase | No connection or deployment; dedicated project `niyarvoprojects` reserved for future work |
| React Native | Existing Expo SDK 58 / Metro retained |
| Native package ID | `com.niyarvo.projects` |
| Source tests | 175/175 passing (163 baseline + 12 new) |
| UI syntax | `App.js`, `GanttView.js`, `SchedulingPanel.js`, `TaskConfigurationPanel.js` parse correctly |
| Web/Android/iOS interactions | **Not run / not verified** |
| Source baseline integrity | Complete archive with project-root contents, no enclosing folder or Git metadata |

## 1. Changes

- Added `src/taskSchema.cjs` with per-project custom task types, five typed custom-field formats, strict schema validation, and explicit allowed status transitions. Defaults keep imported v0.2.x projects backward compatible; workflows are OFF unless explicitly enabled.
- Added `src/TaskConfigurationPanel.js` to manage types, fields and workflow paths. Available from Tasks and Settings. In-use types cannot be removed; removing a field deletes associated values after a recovery snapshot.
- Updated `src/model.cjs` for schema persistence and transition enforcement when moving Kanban tasks; updated `src/taskWorkflows.cjs` so atomic bulk status edits respect the same rules.
- Updated `App.js` with task-type creation and editing, custom-value editing (explicit save for text/numeric/date to support mobile typing), task configuration entry points and verification checks. No task field data is sent to external services.
- Wrapped application shell and modal presentation with `SafeAreaProvider`/`SafeAreaView`, so Android status-bar and gesture-navigation insets are respected. Updated `src/SchedulingPanel.js` modal accordingly.
- Updated package/application version `0.3.0`. Added dependency `react-native-safe-area-context: ~5.10.1` (Expo-recommended version; run `npx expo install --check` in Termux).
- Added 12 regression tests and updated a previously hard-coded version assertion in `tests/gantt-ui-contract.test.cjs`.

## 2. Business rules and safety

- Each project carries its own `taskTypes`, `customFields`, `workflow`; tasks carry `taskTypeId` and `customValues`.
- Legacy JSON without these keys is normalized to `Task`, no fields, and non-enforced workflow.
- Duplicate IDs, unsupported types, invalid dates and numbers, unknown task types, unknown field keys, duplicate workflow paths, and missing required values are rejected rather than silently discarded.
- When enforcement is enabled, disallowed status changes are blocked in both Kanban and bulk updates. Existing dependency blocking remains.
- Changes to populated custom values or task types invalidate affected verification and dependent release readiness. Field deletion creates a workspace recovery snapshot first.
- No access control, multi-user role engine or Firebase backend is claimed. Workflow rules are local process rules, **not security authorization**.

## 3. Test evidence

Run: `npm test`. All 175 tests passed.

JSX parse: TypeScript compiler parser (`ScriptKind.JSX`) reported zero syntax diagnostics across the changed UI and Gantt components. `package.json` and `app.json` parse as JSON. These checks do not replace an Expo Metro bundle.

## 4. Not verified / known limitations

- **Android and iOS safe-area inset measurements are not runtime tested**; inspect on devices with gesture navigation and rotated displays.
- Web and Android presentation of the configuration editor is not device verified.
- Custom fields currently support simple scalar values and a per-project definition. Field-level permissions, formulas, custom statuses, conditional validations and workflow role permissions are outside this batch.
- Required custom fields are rejected if existing tasks lack values; create fields optional first and populate them before future required-field UI support.
- Manual field editing currently persists each accepted value as a local workspace update, matching the previous task-editor persistence behavior.

## 5. Installation / QA

1. Export a JSON workspace backup before changing versions.
2. Confirm `work` branch and preserve any uncommitted files. Extract the full ZIP at `~/NiyarvoProjects` root, not inside a nested folder.
3. Run `npm install`, `npm test`, `npx expo install --check`, then `npx expo start`.
4. Test margins on Android portrait/landscape, dropdowns and every modal above the status/gesture bar. Test keyboard-open forms.
5. Create a project-specific type, add a numeric and select field, edit task metadata, export/reimport JSON, archive/restore, verify release invalidation.
6. Enable a workflow with permitted `Backlog → In progress`; confirm forbidden moves fail in Board and Tasks bulk actions. Disable workflow and verify previously accepted dragging.
7. Re-test Gantt drag, resize, dependency selection/creation/removal; Kanban hold-to-drag; releases; backups.

No Git commit, merge, push, Firebase deploy, or app-store package was created.
