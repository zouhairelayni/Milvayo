# CHG-NP-0.4.6 — MockDesign Kanban interaction recovery

## 0. READ FIRST — handoff

| Field | Observed status |
|---|---|
| Application | Niyarvo Projects (independent project-management app) |
| Baseline | Full v0.4.5-MOCK-BOARD-DRAG-RESTORED source |
| Candidate | v0.4.6-MOCK-KANBAN-INTERACTIONS |
| Status | **QA candidate; not accepted on device** |
| User request | Restore every original mock task/list interaction, especially tap task to open sheet, double-tap title to edit, long-press drag, and any missing mock controls |
| Source-level regression tests | **349 passed / 0 failed** (343 prior + 6 new) |
| JavaScript/JSX | TypeScript transpile syntax checks for touched JSX/native JS: **0 errors**; see validation section |
| Android Expo Go / iOS / Expo Web interactive acceptance | **Not run here** |
| Persistence | Existing AsyncStorage workspace key and schema unchanged |
| Dependencies | No additional native or npm dependencies from v0.4.5 |
| Timeline | **Unchanged** from working v0.4.5 baseline |
| Deployment and git | No push, merge, APK build or deployment |

## 1. Original mock behavior inventory and wiring

| Original MockDesign action | Code path / current status |
|---|---|
| Single tap on a task card | `Board.js` `TaskCard` → `openTask(t.id)` → `ModernApp` `TaskSheet`, same task ID |
| Double tap task **title** | `TaskCard` → `beginTitleEdit` → inline `Input`, commit on submit/blur |
| Stationary hold on card, then drag | `boardGesture.native.js` 350 ms hold, 8 px pre-hold swipe cancellation, `BoardMotion.native.js` UI-thread shared transform |
| Move card within a lane or to another lane | measured insertion indicator → existing `placeTask` bridge, preserving canonical IDs and validation |
| Scroll from task, before the hold | movement cancels pending lift; original mock PanResponder logic retained |
| Scroll while dragging near edges | original mock X/Y scroll compensation and edge auto-scroll retained |
| Double tap list title | `ListColumn` → inline name editor with commit on submit/blur |
| Hold list header | reorders list through existing `moveListTo` bridge |
| Tap board chip / hold or double-tap board chip | select board / open board manager |
| New board, new list, and add card | original mock buttons/sheets/input and canonical store wired; unsuccessful create leaves form intact |
| Rename board, archive/restore/delete board | board manager; Main stays protected; renames staged until commit |
| Confirm list deletion | original confirmation, now counts all cards in the lane (including filtered-out cards); existing bridge moves cards safely |
| Title/priority/labels/owner/due/progress visuals | original mock card composition, spacing and colors unchanged |
| Card filters | original text/priority filters retained |

## 2. Repairs and why they matter

1. `src/boardGesture.native.js`: native task title hit-testing uses **both X and Y** instead of just Y, checks measured bounds and uses `tapSerial` to reject out-of-date measurement callbacks. Clearing the delayed single-title tap when another touch starts prevents a sheet from opening underneath an in-progress hold or scroll. A true double title tap enters editing. Unexpected native responder cancellation releases the drag without persisting a drop.
2. `src/screens/Board.js`: title hit views now set `collapsable={false}` so React Native Fabric keeps a native measured view for hit testing. The layout, margins, card dimensions and list geometry are not changed.
3. `src/screens/Board.js`: task, list and board renaming use a **local input draft** and call the persistent store only once on submit/blur. This avoids normalized/trimmed writes on each character, allows internal spaces, rejects invalid blanks/overlong titles without corrupting existing data, and prevents duplicate submit+blur commits. Main board name is noneditable as required by the model.
4. `src/screens/Board.js`: task creation clears the draft only on success; new list and new board forms remain open when the canonical store declines the action. List-deletion confirmation counts hidden tasks too.
5. `src/boardInteractions.cjs`: small pure helpers for native title rectangle hit testing, double-tap timing and safe name commit. No changes to persisted schema.
6. `src/boardMotion.native.js` and `src/boardMotion.web.js` **unchanged**; native transforms still use Reanimated. Web continues using the **original mock** responder via `boardGesture.web.js` and `gesture.js`.
7. `src/screens/TaskSheet.js`, `ModernApp.js`, `src/modernBridge.cjs`, local storage, timeline and domain validation **unchanged**.

## 3. Verification and limits

- `npm test`: **349/349 pass** (6 interaction math, source wiring and canonical workspace checks added).
- TypeScript transpile parser: zero diagnostics on edited JSX/native JS and app navigation source. Full `src` syntax checked separately for package QA.
- ZIP integrity: checked after packaging.
- **Not run:** actual Android/iOS gesture timing, ScrollView arbitration, hardware FPS/memory tests, native UI confirmation, fresh Metro bundling, APK build and Web browser tests. The reported first-open board snap has **not** been reproduced or proven resolved; if present, collect Metro and native crash logs.
- Gesture recognizer for Kanban still uses the mock's PanResponder on the JS thread, with Reanimated UI-thread **visual** transforms (not a fully worklet-native gesture pipeline). This is intentional to recover the user's confirmed working mock behavior.

## 4. Data safety and install

Before replacing v0.4.5, export a project/workspace backup and keep the previous source checkpoint on the `work` branch. The ZIP is a **full project-root archive**, no outer folder and no `node_modules`/`package-lock.json`.

```bash
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NiyarvoProjects-v0.4.6-MOCK-KANBAN-INTERACTIONS.zip -d .
# Existing v0.4.5 dependencies are enough; install only if missing.
npm install
npm test
npx expo start --clear
```

Do not merge to `main` until the attached `NP-QA-0.4.6.md` checks pass on Expo Go.

## 5. Next model instructions

- Treat v0.4.6 as the source candidate, not a confirmed Android runtime fix.
- Do not replace the original mock margins/card structure or change Timeline while testing Board interactions.
- Diagnose any remaining tap/snap/scroll issue with the actual Android error; avoid speculative animation or dependency rewrites.
- Preserve Niyarvo Projects separate from RIVNA and Niyarvo Control Center. Preserve canonical model, project imports and task identity/history.
