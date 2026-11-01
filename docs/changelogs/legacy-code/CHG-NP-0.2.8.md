# CHG-NP-0.2.8 — Task hierarchy, bulk workflows, bounded list rendering

## 0. READ FIRST — handoff

| Field | Observed fact |
|---|---|
| Product | Niyarvo Projects — **independent** Expo SDK 58 project management app |
| Baseline | Complete v0.2.7 source (with v0.2.6 scheduling engine) |
| Release | v0.2.8 **local-QA candidate**, not production-accepted |
| Git | No branch creation, commit, push or merge performed |
| Firebase | User reports creating Firebase project `niyarvoprojects`; Android ID is `com.niyarvo.projects`. No connection/deploy/config credentials added. Confirm actual project ID in Firebase Console before backend setup. |
| Existing app storage | `niyarvo-projects-v1` in AsyncStorage; unchanged |
| Existing import format | `niyarvo.project.v1`; **unchanged**; optional task `parentId` added |
| Runtime QA | **Not run** on Web, Expo Go or iOS |

## 1. What changed

1. `src/taskWorkflows.cjs`: original independent model for task hierarchy, descendants, view queries, 40-row incremental pages, and all-or-nothing bulk status/priority/stage/owner operations. No OpenProject code was copied.
2. `src/model.cjs`: optional `parentId` persists on tasks; validates hierarchy on import and workspace normalization (missing parents, self-parent, cycles, depth >40); deleting a parent detaches immediate children while preserving them; downstream verification and release consistency reconciled.
3. `App.js` Tasks screen: status/priority filters, search, select-visible/clear, multi-task status and priority changes, 40-row progressive loading. Only rendered rows are initially mounted; **this is bounded rendering, not full FlatList virtualization**.
4. `App.js` Task editor: change/remove parent, find parent, inspect children, create subtask. Supports multiple nesting levels; candidate list is capped to 30 matches.
5. `App.js` Board: initially renders a maximum of 60 cards per lane. **Show more** loads another 60 without modifying saved tasks or the existing drag mechanics.
6. `schemas/niyarvo.project.v1.schema.json`: documents optional `parentId` for portable exports.
7. `package.json` and `app.json`: version 0.2.8; Android package stays `com.niyarvo.projects`; no dependency changes.

## 2. Design and architecture basis

- Studied **concepts** in the supplied OpenProject 17.9.6 archive: hierarchical work packages, work-package relationship separation, and query filters. Independently designed and wrote all implementation code. No source files, fragments or UI assets transplanted.
- Reviewed original Unslop guidance (`.opencode/skills/unslop/SKILL.md`); applied a focused Tasks-screen treatment: 44px touch-sized selection, consistent neutral panels, horizontal filter rails, short labels, progressive lists instead of massive rows, and no new decorative effects. See `docs/UNSLOP-NP-0.2.8.md`. **Not a full-screen redesign.**

## 3. Validation run in delivery environment

| Check | Result |
|---|---|
| Existing regression tests | 118/118 Passed |
| New task-workflow tests | 15/15 Passed |
| **Total** `npm test` | **133/133 Passed** |
| App/Gantt/Scheduling JSX syntax parse | Passed (TypeScript parser, JSX mode) |
| JSON validation of app/package/schema | Passed |
| `npx expo install --check` | Not run (node_modules unavailable in delivery workspace) |
| `npx expo start` and real Web/Android runtime | Not run |
| iOS device | Not run |
| Actual 10,000-task visual UI performance | Not measured on a device; 10,000-record query/page model test passed |
| Firebase/GitHub sync or deployment | Not run / not implemented |

## 4. Known limits and deferred work

- Parent/child hierarchy is project-local; it does not automatically infer dependency links or roll up schedule durations, progress, completion, or ownership. Gantt hierarchy folding is not implemented yet.
- Tasks page renders a finite 40-row page; Board finite 60 per lane. Gantt still renders its own chart rows; no Gantt virtualization in this batch.
- Bulk changes intentionally invalidate verification and merge records of changed tasks and affected successors. They may demote Ready/Released local checkpoints to Testing; **they do not perform Git operations**.
- Bulk selections and filters are ephemeral app UI state, not stored saved queries.
- Firebase auth, secure Firestore sync, user permissions, uploaded binary attachments and conflict resolution remain future separate stages.

## 5. Local installation + QA gate

On Android/Termux: export workspace JSON, preserve uncommitted work on `work`, then unzip the **full source ZIP** at the project root. Run `npm test`, `npx expo install --check`, `npx expo start`. Perform `docs/NP-QA-0.2.8.md`. Do **not** merge into `main` or deploy until user accepts runtime behavior. No full build or Firebase deployment is required just to test the model.

## 6. Merge notes for another implementation/design branch

Primary files changed: `App.js`, `src/model.cjs`, `src/taskWorkflows.cjs`, JSON schema and versions. When merging redesigned `App.js`, preserve the task selection handlers and `taskWorkflows` calls, and reconcile rather than overwriting accepted Gantt/Kanban gesture behavior. Keep all backup/import/typed-dependency model behavior from v0.2.7 intact.
