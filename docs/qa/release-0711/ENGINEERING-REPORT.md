# Milvayo 0.7.11 — creation and control cleanup

The preceding performance repair is recorded as **0.7.10**. Current package, lockfile and Expo version are **0.7.11**, Android versionCode **81**, iOS buildNumber **81**. Original handoff: applied in place on `work`; no Git tag, commit, push, merge, dependency addition, build, prebuild, Gradle, EAS or Playwright. The owner subsequently authorized committing/pushing this completed checkpoint only to `work`: `074a734`. Owner ZIP changes and the earlier uncommitted performance work are preserved.

## Skills and review

The [before audit and five-line direction](PLAN.md) follow bundled Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0. It is a review standard for the existing calm, exact workspace, not a new visual direction. Impeccable polish identified duplicate controls and preserved the palette, hierarchy, shared sheets and touch treatment. Ponytail and React Native best practices favored existing store transactions, confirmation menus, status mapping and nested scroll components over new packages or model rewrites. No skill substitution was needed.

## Findings and implementation

| Workflow / finding | Result and principal files |
| --- | --- |
| Board had separate board creation and vertical list creation | `src/screens/board/Board.js` places the named plus before the board ribbon. `BoardManagement.js` provides one BoardCreateSheet with New board / New list choices. Lists target the current board and retain status mapping. Blank names cannot submit; failures retain drafts; only successful board creation selects the new board. |
| Board deletion was only exposed through the manager | Board tools → Board actions reuses the existing confirmation menu and store delete transaction. Copy states that tasks move to Main. Main has no delete entry and remains protected in the domain. Failed deletion keeps the popup context; success selects Main. Existing backup, history and task relocation are preserved. |
| Advanced tasks could hide already-organized task planning | `src/screens/tasks/TaskSheet.js` always exposes Activity & files / Planning & delivery. `src/screens/more/ProjectToolsSheet.js` omits the retired switch. `src/domain/projectTools.cjs` retains the legacy ID and true/false values for import compatibility. No task data is rewritten. |
| Timeline duplicated its preset selector next to header search | `src/screens/timeline/Timeline.js` registers no extra header control. `src/components/shell/Bars.js` removes the unused cycling branch. Timeline options pills, Today focus, pinch/zoom, calendar painting and dependency rendering remain covered by existing tests. Gesture engines are unchanged. |
| List duplicated search and organization | `src/screens/tasks/Tasks.js` keeps the header controls and removes their body duplicates. Applying a saved view synchronizes search back to the header through `src/app/ModernApp.js`; `pageRetention.cjs` includes the callback in the active-page comparison while preserving hidden-page freezing. |
| Due soon used expansion buttons and silently truncated results | `src/screens/tasks/DueSoon.js` shows three scalable rows in a fixed-height nested scroll region, with a trailing scroll hint when more exist. Additional three-row batches require scroll intent or accessibility navigation; programmatic and hidden-screen events cannot grow the window. Remove descriptive copy and See more/less. Remove the separate 30-item caps in `dueSoon.cjs` and `src/domain/powerUps.cjs`; retain date horizon, status, calendar-enabled board and archive rules. |
| Sprint creation was a trailing text button | `src/screens/delivery/Delivery.js` places an icon-only plus first in the selector row, named New sprint for accessibility. Preserve the creation form, validation and historical sprint semantics. |

There is no schema/storage migration. Legacy Advanced tasks values survive imports and backups; they simply no longer gate the task sheet. No changes to `src/gestures/`, `src/timeline/`, `src/domain/agile.cjs` or the model/backup formats. README, DESIGN, the single cumulative changelog and usage guides describe both release designations.

## Validation

| Check | Result |
| --- | --- |
| `npm test` | **Pass — 853 tests, 0 failures, skips or cancellations.** Includes all existing startup, five-card mounting, Timeline, dependency, sprint, import, backup/security and packaging tests. |
| JSX/source binding checks | **Pass** through the full suite and explicit source syntax check. Source checks are not native runtime acceptance. |
| `npx expo install --check` | **Pass with offline limitation:** dependencies are up to date; Expo explicitly warns that offline validation is unreliable. No dependency or Metro change. |
| Creation / deletion edge cases | **Pass:** empty/trimmed names; rejected board/list drafts; current-board status mapping; confirmation and cancellation; retry after failure; success selects Main; Main protected; tasks/dependencies/dates survive deletion/import. |
| Search / planning / scrolling | **Pass:** saved search synchronization; legacy false preference with planning available; no retired switch; initial three rows; user-only growth; hidden-screen guard; accessibility navigation; more than 30 eligible tasks retained. |
| Static visual review | **Pass within fixture limits:** inspected ten Chromium screenshots of actual source at 320px and 390px: Board, List, Sprints, creation sheet and Due soon. Neutral chrome, scalable task rows and shared controls retained. |
| Live Expo Web / Expo Go / Fast Refresh / Android / iOS | **Not run.** No running Metro/client or physical device was used for acceptance. |

Full output: `full-tests.txt`. Dependency output: `dependency-check.txt`. Static fixtures: `source-review/manifest.json`, HTML and PNGs, reproduced with `tests/helpers/release-0711-review.cjs`. These use bundled/synthetic data and inert effects/handlers, with visible modal content projected in place instead of a server-side portal. Header registration is inert in these fixtures; handler tests verify header actions. Screenshots do not certify runtime scrolling, keyboard/modals, FPS or native gesture behavior.

## Preserved 0.7.10 performance evidence

The [startup repair report](../startup-repair/ENGINEERING-REPORT.md) records the confirmed explicit startup sequencing delay, native layout/final-frame lifecycle repairs, eager Projects mounting and missing production profiling. Its logs were collected with a 0.7.9 source label before the owner named that work 0.7.10; they have not been presented as new device runs.

- Cold-only playback contract: 3.7 seconds plus a forced 1-second hold → 1.1 seconds and one final frame, with shell preparation concurrent. This is a source timing contract, not a measured Android launch time.
- Native Projects initial policy: 20 cards → 2, with preserved drafts. Historical paired host source-render medians: 306.66 → 42.20 ms for the native-policy fixture. Web 321.55 → 327.23 ms. These are Node/React DOM wall times, not device CPU/FPS or Android latency claims.
- Restored bounded startup/commit/work diagnostics and five-card demand mounting remain covered. No new Android startup/Projects measurements were collected for 0.7.11; the user's one-second Projects stalls and continuous N-to-Board frame pacing still require device evidence.

## Owner verification and reversible update

Use the existing Termux/Metro session. Test creation in two boards, rejected/blank submissions, deletion cancel/confirm on a disposable board with tasks, saved header search, Planning & delivery with an older backup, seven or more due tasks, sprint creation, Timeline preset/Today/pinch and Board cross-list dragging after scrolling. Check cold launch, resume/backgrounding, themed/reduced-motion branding and the updated diagnostics. Retain app storage/signing material; no uninstall or data clearing.

The [usage guide](../../instructions/release-0711.md) provides the update and rollback procedure. Preserve a backup and local diff before restoring any selected checkpoint; this working tree includes earlier repair work and owner file changes. Keep package/lock/Expo versions together. No data conversion needs reversing. User acceptance remains pending; no native crash-free or no-lag claim is made from source checks.
