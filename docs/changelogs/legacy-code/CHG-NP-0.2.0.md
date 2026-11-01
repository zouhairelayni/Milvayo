# CHG-NP-0.2.0 — Local-first Kanban & Roadmap QA Candidate

**Date:** 2026-10-30  
**Product:** Niyarvo Projects (independent app — NOT RIVNA/Control Center)  
**From:** v0.1.0 source archive  
**To:** v0.2.0 local QA candidate (NOT user-accepted or deployed)  
**Suggested branch:** `feat/np-v0.2-boards-roadmap` (not created in user's Git repo)  
**Git SHA / merge:** Not available / not performed  
**Firebase deployment:** Not performed (new standalone project required)

## READ FIRST — 60-second handoff

- This ZIP contains project-root source files directly; there is **no enclosing folder** and no `node_modules` or `.git` data.
- User develops on **Android + Termux** with `npx expo start` and Fast Refresh. Prefer Expo Go and Web testing first. Do not use Python/static servers as the everyday dev flow.
- **The app was NOT executed in Expo Go, a full browser, or iOS in this environment.** Model tests + JSX syntax passed; platform workflow acceptance is pending.
- **Do not import real engineering roadmaps or production-sensitive data yet.** Keep the fictional Northstar fixture.
- Export/backup the user's v0.1.0 workspace before overwriting files; while data is intended to migrate via the same AsyncStorage key `niyarvo-projects-v1`, runtime migration is unverified.
- No connections to RIVNA / Niyarvo Control Center. Firebase settings are deny-all scaffolding only.

## Scope completed in source

| Area | Implemented change | Evidence |
|---|---|---|
| Branding | Supplied centered Niyarvo ribbon `N` rendered as app launcher, adaptive, PWA (192/512/maskable) and favicon assets; sidebar symbol | Generated images under `assets/` and `public/icons/`, app.json/manifest |
| Kanban | RN PanResponder grab handles, target lane measurement, within-lane ordering using task `position`; status edit remains accessible via task editor | `App.js:Board/DraggableCard`, `src/model.cjs:moveTask` |
| Dependencies | `dependsOn` graph; missing IDs/cycles/self-dependencies rejected; cannot move blocked task to Done | `src/model.cjs`, 2+ tests |
| Timeline | 14/30/90-day horizontal task timeline; scheduled vs unscheduled tasks; date bar opens task; shift arrows; editable task dates | `App.js:Timeline` |
| Automation | Per-project enabled/paused local rules on entering a lane; actions: set priority, stage, owner or due-date offset | `src/model.cjs:moveTask`; `App.js:Automations` |
| Attachments | Add/open/remove HTTP(S) attachment **links**, stored in task JSON | App task editor / import tests |
| Native import/export | Expo SDK 58 document picker, file system and OS share sheet added, preserving Web path | App.js; requires on-device testing |
| Persistence | Serialized AsyncStorage writes; corrupt stored workspace raises a recovery screen instead of overwriting data | App.js load/save hooks |
| Import guard | Preserve imported backups/activity alongside pre-import recovery snapshot; reject duplicate project/task IDs and excessive collections instead of silent truncation | src/model.cjs and tests |
| CRUD | Task delete with pre-delete snapshot, release delete with automatic workspace snapshot + unassign; project CRUD remains | App.js |
| Release truth | Display a changed-after-release warning when a recorded Released release no longer passes current gate; dependency readiness required | model.canRelease / UI |
| Cloud prep | `firebase.json` + deny-all Firestore/Storage rules, explicit-project-ID guarded Hosting script | scripts/deploy-hosting.cjs |

## Test evidence (this environment)

| Check | Result | Detail |
|---|---|---|
| Node data-model tests | **PASS 16/16** | `npm test`; baseline 9 + 7 new tests |
| JSX parser | **PASS, 0 diagnostics** | TypeScript JSX syntax parse for `App.js` |
| Project/manifest/schema JSON | **PASS** | Parsed during asset generation and schema edits |
| Deploy script Node parse | **PASS** | `node --check scripts/deploy-hosting.cjs` |
| Android Metro bundle | **NOT RUN for v0.2** | Dependency installation unavailable in review container |
| Expo Go Android runtime | **NOT RUN** | Must be performed on user's Android device |
| Desktop/mobile Web runtime | **NOT RUN** | Must use Metro browser QA in user environment |
| iOS build/runtime | **NOT RUN** | iOS build/test requires Apple-capable environment or remote build |
| Firebase Hosting deployment | **NOT RUN** | Separate Firebase project not configured |
| Drag-and-drop real pointer/touch QA | **NOT RUN** | PanResponder + measureInWindow must be field tested on Web and Android |
| Native JSON picker & share QA | **NOT RUN** | SDK-compatible APIs selected from Expo documentation; not tested on device |

## Explicit limitations / known risks

1. **Attachments are URL references only**, not local/cloud binary uploads; secure Firebase Storage requires Auth, ownership rules and upload size/type enforcement.
2. Drag handles are a **first iteration**: no auto-scroll during drag to off-screen Kanban lanes, multi-card drag, virtualized thousands-of-cards performance or keyboard DnD. Status chips in task modal are the fallback.
3. Timeline is **interactive via bars and shift controls**, not continuous freeform resize/drag or critical-path dependency connector rendering; a full Gantt implementation is a later batch.
4. Automations execute **locally on status transitions only**; no scheduled reminders, notifications, webhook actions, background processing or cloud action orchestration.
5. No users, teams, comments, calendar integrations, per-board permissions or realtime sync yet.
6. Existing edits still commit per keystroke to state; disk writes are serialized but not debounced. Stress testing is needed.
7. Workspace and attachments are **not end-to-end encrypted**; these are local client records. No cloud authentication or Firestore data sync has been enabled.
8. v0.2 Web, Android, iOS behavior remains unverified; do not merge/deploy or import real data until tested.

## Required first runtime acceptance passes

1. Save a `.project.json` and a `.workspace.json` from v0.1.0 **outside the device**. Capture original project/task counts.
2. On separate dedicated Git branch, extract v0.2.0 source into repo (project root), run `npm install`, `npm test`, `npx expo install --check`, then `npx expo start`.
3. Check desktop Web (4 Kanban lanes visible), mobile browser, and Android Expo Go. Confirm Niyarvo icon crop and sidebar logo.
4. Drag card from Backlog to In progress; reorder cards within one lane; reload and ensure order/status persists. Test all four lanes and rapid repeated drags.
5. Add A -> B dependency; verify B cannot be marked Done before A; finish A and move B. Try B -> A circular dependency; expect an error and unchanged graph.
6. Schedule a task, shift dates in Timeline, check bar position after reload, edit start/due, inspect 14/30/90 scaling.
7. Create an automation rule (enter Validation -> priority High); move a Medium task; check priority. Pause rule and repeat; check no action. Ensure release verification cannot be faked by automation.
8. Add attachment HTTPS link, open it, remove it; export/import project and verify link metadata persists.
9. On **Android Expo Go** import a JSON via system picker and export via OS share sheet; repeat on Web with file chooser and browser download.
10. Test project create/rename/switch/delete, task create/edit/delete, release create/edit/delete, recovery snapshot after delete and workspace import with backups/activity.
11. Deliberately test corrupt imported JSON / duplicate IDs / >30 projects in a **throwaway** workspace only. Never use real data to test destructive cases.
12. Record screenshots, device logs, failures and version info; **only commit and merge to main after verified fixes**.

## Separate Firebase deployment gate

- Create NEW Firebase project (distinct Google account/project from any other products); choose Hosting domain.
- User confirms project ID; set `NIYARVO_PROJECTS_FIREBASE_PROJECT_ID` in Termux, then `npm run deploy:hosting`.
- Script builds Web and deploys **Hosting only**, never silently Firestore/Storage; explicit ID and prohibited-name guard.
- Firestore and Storage rules are **deny-all placeholders**, not a configured sync backend.
- No Firebase deployment before local Web + Android acceptance, no sensitive roadmap imports until app acceptance.

## Files / change footprint

- Changed: `App.js`, `src/model.cjs`, `app.json`, `package.json`, `firebase.json`, `public/manifest.json`, `public/service-worker.js`, `public/icons/*`, `schemas/niyarvo.project.v1.schema.json`, `README.md`.
- Added: `assets/*`, `scripts/deploy-hosting.cjs`, `firestore.rules`, `storage.rules`, `tests/board.test.cjs`, `CHG-NP-0.2.0.md`, `docs/CHG-NP-0.2.0.md`.
- Not included: external engineering roadmaps, Firebase credentials, user account data, APK/IPA, node_modules, Git history.

## Recommended follow-up batch

`NP-QA2`: fix observed UI pointer/gesture/scroll defects, validate native JSON import/share, verify local persistence and recovery. After QA acceptance, `NP-FIREBASE1`: isolated Auth + Firestore ownership rules + emulator tests, private Storage attachments, sync conflict handling and migrations. Then `NP-ROADMAP2`: draggable/resizable Gantt, dependency arrows, critical path, calendar and richer automation.
