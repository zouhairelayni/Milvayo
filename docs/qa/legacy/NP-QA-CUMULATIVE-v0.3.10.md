# Niyarvo Projects — cumulative v0.3.10 QA

## Install safely

1. From v0.3.2-HOTFIX3, export **workspace JSON**. Commit or stash any uncommitted changes on `work`.
2. Inspect the full ZIP root and extract into `~/NiyarvoProjects` while on `work`.
3. `npm test` → `npx expo install --check` → `npx expo start` (Metro/Fast Refresh).
4. Do not merge to `main` until the Android and Web passes are complete.

## Functional acceptance

- **v0.3.3 Portfolios**: create two projects and a portfolio; add/remove membership, test project health and archived projects; export/reimport workspace.
- **v0.3.4 Agile reports**: complete a sprint with real recorded events, inspect velocity and compare retained sprint burndown; do not expect invented prior history.
- **v0.3.5 Resources**: create contributor, log hours on tasks, change/remove contributor, verify historical rate snapshot and over-capacity indicator.
- **v0.3.6 Costs**: configure currency/budget, compare logged labor and planned cost; restore snapshot, inspect negative budget remainder where appropriate.
- **v0.3.7 Collaboration**: post comment, add reminder, mark done, delete and restore, delete task with linked items in demo project only.
- **v0.3.8 Reports/templates**: export tasks CSV, time CSV, JSON. Verify formula cells are neutralized. Duplicate Atlas as a clean template, confirm dependency and hierarchy mapping and no copied evidence.
- **v0.3.9 Boards**: create a second board, move task into it, confirm columns have independent heights. Delete custom board and verify tasks return to Main. Open a task with Boolean/select custom field and confirm no raw-text crash.
- **v0.3.10 Automations**: create status rule with two actions, move card into target status; configure card button, open task and run; configure board button, run from selected board; due check twice on same date yields no duplicate run. Verify history and export/import.

## Regression / performance

- Atlas 73-task import, selection, Kanban drag, long list and Gantt opening on Android. **Android native crash regression requires device evidence**.
- Gantt scroll/pinch, resize, dependencies, Tree mode, sprints and offline persistence after force-close.
- Verify app shell top and bottom safe area in portrait/landscape; responsive Web desktop has no bottom tabs.
- No unauthorized requests to other Firebase projects or external APIs.

## Not performed in delivery container

- Metro Web bundle, Android Expo Go UI, physical iOS, APK build, accessibility traversal and performance measurement on real hardware.
- Firebase deployment, authentication, cloud synchronization and security-rule emulator tests.

## Rollback

Restore your last known-good Git `work` checkpoint, then restore the pre-patch workspace JSON if data is affected. Do not perform an irreversible archive/delete test on a real project.
