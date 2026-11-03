# Niyarvo Projects — engineering instructions

**Product:** Independent project-management app, React Native + Expo SDK 58 for Web/PWA, Android and iOS. It is not RIVNA and is not Niyarvo Control Center.

## Mandatory workflow before EVERY build or UI change

1. Read `.opencode/skills/unslop/SKILL.md` and relevant references. This is the original Unslop skill by Damir Sokolovsky (CC BY 4.0); keep its credit and attribution. Use the skill as a **review standard**, not permission to replace the existing Niyarvo visual language.
2. Identify the exact screen and workflow, write a before-audit (`spacing → color → icons → copy → typography → layout → details → visuals → motion`), and set the skill's five-line product direction. If current UI is good, preserve it; fix only observed defects.
3. Review existing code paths, model constraints, previous change logs, and tests before editing. Design from established architecture and interaction patterns, but implement original code; never transplant third-party source, assets, or branded UI.
4. Plan controlled patch scope; preserve the stable Metro setup, existing data and import format, and existing verified workflows. Record any migration requirements explicitly.
5. Implement model / security invariants first, then UI. Add tests for success, failure, edge cases, and persistence/import round trips. Prefer pure, deterministic functions for scheduling and dependency logic.
6. Run `npm test`, check JSX syntax, and run `npx expo install --check`; test Web and Expo Go with `npx expo start` and Fast Refresh. If device/browser testing cannot be run in this environment, say **Not run**; never claim a source check equals runtime acceptance.
7. Deliver one project-root ZIP with history under `docs/changelogs/legacy-code` (pre-0.4.2) and `docs/changelogs/modern-code` (0.4.2+). Store release QA in `docs/qa/modern-code`, none at root. Preserve local package.json and package-lock.json (exclude both). Record Pass/Fail/Not run and a reversible installation plan.
8. Work on Git `work`. Never force-push, commit, deploy or merge automatically. User validates on Termux before a checkpoint; only merge to `main` after passing acceptance gates.

## Architecture / safety

- Local-first data currently uses AsyncStorage. Do not weaken normalization, backup recovery, dependency-cycle checks, release verification or audit trail.
- Niyarvo Projects will later use **its own separate Firebase project** for Auth, Firestore sync, file uploads and Hosting. No credentials, Firebase IDs, schemas, repos or data from RIVNA/Control Center.
- No automatic import of existing engineering roadmaps; only explicitly user-invoked imports.
- Do not claim real-world GitHub merges, payments or releases from local SHA/status records.
- Phone-only user develops in Android Termux using Metro/Fast Refresh; never require a desktop-only build workflow.
- No additional package dependencies without need and version compatibility checks.

## UI direction, from the existing Niyarvo design

- **Product:** a precise workspace for managing independent projects, tasks, schedules and release gates.
- **Character:** calm, exact, dependable.
- **World:** planning instruments and quiet technical workbenches.
- **Moments:** the Gantt diagram, Kanban task movement and verified progress are the content-rich moments.
- **Signature:** one user-selected accent (default Claude clay orange) and meaningful dependency/status colors.

Keep dark neutral chrome, readable task content, consistent spacing, touch targets and the Niyarvo mark. Do not add glow, gradient text, badges or decorative animation.

## Sprint lifecycle rule
Keep sprint lifecycle and historical burndown semantics inside `src/domain/agile.cjs`, with no remote/security claims. Preserve the frozen history on completion, and do not infer pre-start daily statuses from current task data. UI work follows the bundled Unslop reference and `docs/legacy-code/notes/UNSLOP-NP-0.3.2.md`.

## Timeline rules
- A resize of a task in the Timeline is a duration modification. Dragging the left or right edge of a bar changes how long the task lasts (whole calendar days, both ends included, never below 1 day); the opposite end stays fixed. A move shifts both dates and never changes the duration. History text for a resize says "Changed duration of …". Rules live in `src/timeline/timelineEdit.cjs`.
- While a bar is dragged, its dependency lines stay attached to it on every platform (the dates are previewed live).

## Folder structure
All code is in `src/` (nothing but the Expo entry `App.js`, a 3-line shim, sits in the project root). Put a new file in the folder that matches what it does:
- `src/app/` app root, `ModernApp.js`, `navigation/` (tab and page rules). `src/screens/<feature>/` one folder per screen group (overview, board, timeline, tasks, delivery, workspace, management, governance).
- `src/components/` shared pieces (`shell`, `notice`, `inline`, `charts`). `src/ui/` the shared UI kit and `ui/theme/`.
- `src/domain/` pure business rules (`*.cjs`). `src/timeline/` and `src/board/` timeline/gantt and kanban logic. `src/gestures/` gesture, scroll and viewport code. `src/store/` store, seed data, import and backup. `src/governance/`, `src/diagnostics/`, `src/utils/`.
- Platform pairs (`name.web.js` / `name.native.js` / `name.js`) always stay in the same folder.
- Tests are `*.test.cjs` files in `tests/<group>/` (`app`, `board`, `diagnostics`, `domain`, `gestures`, `governance`, `store`, `timeline`, `ui`); shared test helpers are in `tests/helpers/`. `npm test` runs `node tests/run-all.cjs`, which finds them in any subfolder.
- The first line of every code file is a comment with its own path, like `// /src/domain/model.cjs`. `tests/app/folder-structure.test.cjs` checks this, and checks that no import points to a missing file.
