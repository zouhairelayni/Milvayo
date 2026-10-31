# CHG-NP-0.3.12 — Kan-informed Kanban workflow and UI

> **Release status:** Local-QA candidate; Android Expo Go and browser acceptance **Not run** in this environment. User confirmed v0.3.11-HOTFIX2 worked on both Android and Web before this branch began. Do not treat this release as accepted until device QA.

## 0. Handoff — read first

| Field | Observed value |
|---|---|
| Product | Niyarvo Projects (independent Expo + React Native local-first project-management app) |
| Release | `v0.3.12` |
| Based on | `NiyarvoProjects-v0.3.11-HOTFIX2-LOCAL-QA.zip` |
| Code baseline | v0.3.11-HOTFIX2, including scrollable in-tree sidebar and Web-native brand mark |
| Source reference | Uploaded `kanban.zip` (Kan monorepo; 738 ZIP entries; extracted source read) |
| Code reuse | **None**. Independently implemented behavior and visuals in Niyarvo React Native; no copied Kan components/styles/assets |
| Storage | Existing local AsyncStorage `niyarvo-projects-v1`; JSON `niyarvo.project.v1` |
| Migration | Optional project-level `kanbanViews` object. Legacy projects default to `{}`; new preference is stored per board |
| Firebase / remote | Not introduced. Existing local GitHub Power-Up references unchanged |
| Tests | `npm test` **297 passed, 0 failed** (286 prior + 11 focused new tests) |
| JSX parser | App.js plus existing JSX modules parsed with TypeScript JS/JSX parser — PASS |
| Metro / Web / Expo Go / APK | **Not run**, no dependencies installed in verification environment |

## 1. Exact scope

### Board presentation and interaction

- Reworked task cards around scannability: ID, concise title, optional description, meaningful labels, due date, checks, comments, attachments, GitHub reference count and assignee initials.
- Elevated urgent priority with a small dot, not a bright panel; overdue due dates use semantic warning color.
- Continued top-aligned independent column heights, held-card movement and progressive card loading from v0.3.11.
- Added a dedicated 44-ish px contextual action target via ellipsis on each board card, without replacing full-card hold-drag.
- Added a card actions sheet: open details, duplicate as unfinished Backlog work, move to a status (through existing validated `moveTask`), move to another board, open label/date editing and execute enabled local card-button automations.
- Added editing of task labels in task drawer, including individual removal. Changes invalidate verified/merged checkpoints.

### Filters and board preferences

- Board filter panel: assignee, label, priority, due-date bucket (overdue/today/tomorrow/next 7d/next 30d/no date), clear, current match counts; existing task search retained.
- These controls filter only the visible board; tasks are not deleted or reassigned when filtered.
- Drop-position resolution accounts for cards hidden by a filter, preserving the full lane's relative ordering.
- Optional descriptions are persisted **per board** under `kanbanViews[boardId].showDescriptions`, with normalized JSON import/export and cleanup when a board is deleted.

### Domain safety

- `src/kanbanUX.cjs` is a pure, independently written domain helper: real ISO dates, validated filters, full-lane drop positioning, safe duplicate, labels, per-board view normalization.
- Duplicated cards are new unscheduled/unverified backlog work; predecessor links and sprint membership are not copied. Duplicates do not claim GitHub synchronization or completed tests.
- Duplicates preserve relevant context (labels, assignee, description, estimate, start/due, notes, attachment URLs), while clearing verification, merge evidence, individual checklist evidence, branch/SHA and GitHub references. The source task is unchanged.
- Existing status workflow checks, dependency guards, local automation triggers and safe import/export were retained.

## 2. Grounded comparison with Kan source

Inspected paths from user-provided Kan ZIP:

- `apps/web/src/views/board/components/Card.tsx`: compact title, label badges, due date, comments, attachments, checklist count and avatars.
- `apps/web/src/views/board/components/Filters.tsx`: owner/member, labels, lists and due-date buckets, including clear filters.
- `apps/web/src/views/board/components/CardContextMenu.tsx`: move, labels, due, duplicate and delete card actions.
- `apps/web/src/views/board/components/List.tsx`: independent fit-content columns and per-list add actions.
- `apps/web/src/views/card/components/Checklists.tsx`, `ActivityList.tsx`: richer card context.

**Intentionally not transplanted:** Kan's backend/tRPC and database, remote permissions/roles, multi-user avatars, its specific dnd-kit interactions, HTML/NextJS components, public share URLs, card soft deletion, custom list/status schema. Kan ZIP's board code does not establish a complete Trello-style automation engine. Niyarvo's existing status, card-button, board-button and due-date local automation engine remains authoritative.

## 3. Changed files

- `App.js` — card UI, per-board filters, contextual card-action sheet, task label editor, board settings.
- `src/kanbanUX.cjs` — new domain layer.
- `src/model.cjs` — normalize/persist/validate `kanbanViews`, expose the helper.
- `src/boards.cjs` — remove board-specific preferences on board deletion.
- `tests/kanban-ux.test.cjs` — 11 new deterministic tests, including 73-task Atlas JSON round-trip.
- `package.json`, `app.json` — version increment to 0.3.12.
- `README.md`, `docs/NP-QA-0.3.12.md`, `docs/UNSLOP-NP-0.3.12.md`, this changelog.

## 4. Verified and unverified

| Check | Result |
|---|---|
| Pre-existing regression tests | PASS 286/286 |
| New Kanban domain tests | PASS 11/11 |
| Full Node tests | PASS 297/297 |
| Existing Atlas import / 73-task project | PASS in Node test |
| Board preference JSON import/export | PASS in Node test |
| Duplicate/reset/label safeguards | PASS in Node test |
| JSX syntax parsing | PASS |
| Archive extraction/integrity | PASS after packaging |
| Expo `npx expo install --check` | Not run (node_modules absent) |
| Metro, Web render, Android Expo Go gestures | **Not run** |
| Android memory/performance measurement | Not run |
| Firebase and GitHub integration tests | Not run/not in scope |

## 5. Risks and acceptance checks

1. Verify the ellipsis action tap does **not** also open the task on Android or initiate drag.
2. Verify long-press and drag behavior both before and after filtering and horizontal autoscroll.
3. Verify `Backlog` duplication adds a new item without changing release evidence or sprint history.
4. Verify status actions respect configured workflow restrictions, prerequisites and automations.
5. Verify owner/priority/label/date filters on Atlas and clear; verify all matching cards can still be reached with **Show more**.
6. Verify per-board description switch survives restart and JSON export/import.
7. Verify the v0.3.11-HOTFIX2 sidebar scroll and Web BrandMark do not regress.
8. Test Web, Expo Go, mobile portrait, and larger board datasets before merging.

## 6. Rollback / restore

This is a complete source release based on v0.3.11-HOTFIX2. Return to that tested ZIP or Git checkpoint if native acceptance fails. Export your workspace before deploying. New optional `kanbanViews` metadata may be discarded by an older binary on reimport; task data remains in the original `niyarvo.project.v1` format. Do not merge this candidate into `main` without QA.
