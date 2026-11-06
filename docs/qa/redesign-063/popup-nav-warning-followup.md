# 0.6.3 follow-up plan — native warning, contextual actions and navigation

Before audit (Unslop by Damir Sokolovsky, CC BY 4.0): spacing → retain existing measures; color → retain neutral palette; icons → selected bottom-tab icon must grow without a backing square; copy → confirmation stays in its action context; typography → unchanged; layout → task description immediately after title, remove duplicate Settings tools section; details → confirmation cancel/failure stays in the same popup and duplication preserves the original context; visuals → existing icons; motion → Kanban FadeIn competes with caller opacity under installed Reanimated 4.7.1's entrance-style validator.

Product: precise local-first project workspace.
Character: calm, exact, dependable.
World: focused planning instruments and work.
Moments: readable tasks, deliberate actions and direct Kanban movement.
Signature: Milvayo Board mark, neutral dark/AMOLED and the personal accent.

Controlled scope: native BoardMotion owns its fade/drag opacity in one animated style; keep ref/measurement/responder hierarchy and layout transition unchanged. Shared ActionMenu hosts in-place confirmation, cancellation, busy/error and success; migrate task/project/board/WBS confirm actions. Task duplication stays on the original detail; project duplication keeps selectedId. Confirmed deletion may naturally remove its record/view. Move task description above metadata/planning. Bottom tab selection uses animated icon scale without a highlight background. Remove Settings' duplicate tools controls; More remains the tools entry. No storage/import migration, dependency changes, builds, runtime launch, pushes or parent-app writes.

Validation: focused native pose/style-ownership, popup callbacks/failures/double-tap, task order and copy context, project copy selection/import round trip, nav intent/selection and Settings reachability. JSX/worklet transforms and whitespace checks; phone/Metro warning verification explicitly pending. Version remains 0.6.3/build 63.

Additional before-audit: Board/Home spacing → preserve normal positions; color → unchanged; icons → remove Home date chevrons; copy → swipe date accessibility label; typography → unchanged; layout → sliding week rail and an unclipped drag strip above the board-name ribbon; details → retain date filters, ±52-week bounds, list measurement and drop behavior; visuals → keep current task/list treatment; motion → preserve the approved list levitation, fix only its clipping/ancestor stacking. Header Tools remains the Board filter entry after removing the large duplicate button.

Implementation extension: native active strip overflow is visible, its ancestor is above the ribbon, and a compensated 96px top gutter gives web scroll clipping room without moving list positions or changing horizontal scroll semantics. No portal/reparenting of a held responder. Home uses bounded native paging with no state updates per scroll frame.

## Final engineering results

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Focused regressions (12 files) | Pass — 71/71 | `popup-nav-warning-tests.log`; deterministic source/component harnesses, not a device renderer |
| App source parsing | Pass — 196 files | `popup-nav-warning-syntax.json` |
| Native Reanimated/worklet Babel transforms | Pass — 18 files | Same artifact; source transforms only, no bundle/build |
| Expo install --check | Pass with limitation | `popup-nav-warning-dependencies.log`; offline validation reports dependencies up to date and explicitly warns it is unreliable offline |
| Whitespace / relative imports / file path headers | Pass | `git diff --check` and focused folder-structure tests |
| Release metadata | Pass | package, lock/root-lock, Expo 0.6.3; Android/iOS 63 |
| Parent application integrity | Pass — 761 unchanged baseline files | `popup-nav-warning-parent-check.json` |
| Android/iOS/Web runtime, Fast Refresh and warning disappearance | Not run | No Metro/native/browser automation was launched for this follow-up |
| Full npm test / heavy suite | Not run | Focused checks follow the redesign brief's restriction on large profiling/end-to-end runs |
| Builds, commits, pushes, main integration | Not run | Explicit owner restrictions; edits only in existing redesign/work |

Coverage includes popup cancel/busy/double-tap/error/retry/success, disabled and destructive action behavior; task draft-save rejection and copy/delete context; project copy selection and JSON persistence/import normalization, missing-project and project-limit rejection; day filtering, month boundaries, week paging/resize/bounds/duplicate and nonfinite event handling; web scroll settle; stale tab intent; existing Board placement/rename/auto-scroll rules and active-to-idle drag strip restoration. Updated old WBS expectations to the shared same-popup confirmation contract. Two phone-shell source expectations still referenced pre-redesign copy/project-name presentation; updated those assertions to the existing candidate layout, without changing those controls.

## Root causes and scope

- The installed Reanimated entering-animation checker compares caller style keys with entering/exiting keys. Both caller drag style and entering FadeIn supplied opacity on BoardMotion. The fix keeps a single animated opacity = arrival × caller opacity, preserving the measured/responder root, arrival fade, lift/tilt and LinearTransition. Strict warning logging stays enabled.
- A list's own zIndex cannot escape its scroll viewport/ancestor ordering. The active strip ancestor now stacks above the board-name ribbon. Native overflow is visible while held, clipping-based child removal is disabled, and a 96px top padding is offset by a -96px margin so list positions stay fixed. This also provides headroom within the web scroll viewport without removing horizontal scrolling. Release/cancel restores the idle layer, clipping, padding and scrolling. No portal, gesture migration or responder reparenting was introduced.
- Shared ActionMenu keeps one Sheet mounted while its content changes between choices, confirmation and feedback. False/null/throwing actions remain in context; model/store validation and existing async persistence remain authoritative. This does not add new durability guarantees to synchronous store callbacks. Confirmed deletion can naturally remove the record/view hosting the menu.
- Home keeps only three seven-day pages and updates React state after a completed page change, not every scroll event. Native momentum end or debounced web scroll completion commits one week. Week changes recenter without animation, clear date focus and respect the existing bound. Screen-reader increment/decrement preserves access without chevrons.

No dependencies, schemas, import formats, scheduling semantics, Metro config or main-app files changed for this follow-up. No migration is required. Earlier PNG fixtures and independent finish review predate this follow-up; they do not verify its new interactions.

## Owner Fast Refresh acceptance

1. Keep Metro rooted in `~/Milvayo/redesign`. Open Board, hold a list header and check its lifted top/shadow draws above the board-name ribbon. Reorder, release, cancel a hold, scroll normally, then drag a card across lists. Verify no duplicate drop or changed duration/data behavior.
2. Confirm the opacity warning no longer appears after mounting/navigating Board. Check lift/fade and reduced-motion behavior on the phone; source checks alone cannot certify this.
3. Swipe Home dates in both directions, tap a day, swipe again, and rotate/resize if available. Check calendar/chart dates agree and the day filter clears after week change. Use screen-reader Next/Previous week actions when applicable.
4. Task description is first after its title. Duplicate/Delete must ask within the same Task actions popup; Cancel and rejected mutations keep it open. Copy success keeps the original task and menu; confirmed deletion removes its record view. Repeat project/board/WBS contextual confirmations.
5. Bottom selected icon grows without a square. More → Manage tools works; Settings has no duplicate entry. Board header Tools opens filters with no large Filter board button below the title.

Reversible review: keep using this isolated candidate until approved; returning to the parent app leaves the existing application intact. Do not uninstall or clear storage. Preserve any new candidate data via the existing explicit export before switching copies. Main integration remains a separate owner decision; no automatic merge/copy-back is performed.

## Task description edit icons — before audit and scope

Unslop review standard by Damir Sokolovsky (CC BY 4.0). Spacing → replace text actions with 44×44px targets and retain 8px gap; color → selected theme accent for save, semantic red for cancel; icons → check and X as simple SVG strokes; copy → retain descriptive accessibility labels; typography → unchanged; layout → retain inline description editor; details → cancel makes no edit, rejected save retains draft; visuals → no new artwork; motion → reuse existing PressSurface feedback.

Product: precise local-first project workspace.
Character: calm, exact, dependable.
World: focused planning instruments.
Moments: task content and deliberate editing.
Signature: selected accent and Milvayo Board mark.

Controlled scope: TaskSheet description edit actions only, using installed react-native-svg and existing PressSurface. Save previews after an accepted or unchanged edit; Cancel discards the local draft. No global button changes, dependencies, schema/import migration, builds or parent writes. Keep 0.6.3/build 63; validate focused task behavior and JSX syntax, with runtime acceptance explicitly pending.


## Board list lift adjustment — before audit and scope

Spacing → no layout change; color → unchanged; icons/copy/typography → unchanged; layout → retain list measurement and drag strip stacking above ribbon; details → leave card lift and pointer/drop geometry unchanged; visuals → reduce list shadow height/elevation proportionally; motion → retain spatial feedback with 60% of the list lift excursion (40% less). Same five-line product direction above; Unslop by Damir Sokolovsky, CC BY 4.0.

Use existing native Reanimated worklet/CSS motion, unchanged timings and reduced-motion support. List lift only: native vertical rise 5→3px, scale increment .025→.015, native tilt limit 2→1.2 degrees, web tilt 1.2→.72 degrees. List shadow offset/elevation 8→4.8; opacity/radius remain. Card motion defaults remain unchanged. No model or migration changes.


### Edit icons / smaller lift — delivery checks

- **Pass:** 30/30 focused checks across task/editor behavior, native/web list/card motion, measured Board layering restoration, lazy inputs and folder/import structure. Evidence: `task-edit-icons-list-lift-tests.log`. Earlier editor-only attempt was superseded after adding the missing PressSurface harness mock; no app import was missing.
- **Pass:** JSX transforms for TaskSheet, Board and both BoardMotion platform files; native worklet transform under installed Reanimated 4.7.1; `git diff --check`.
- **Pass with limitation:** offline Expo install --check reports dependencies up to date and warns offline validation is unreliable (`task-edit-icons-dependencies.log`). No dependencies changed.
- **Pass:** 0.6.3 versions remain synchronized; Android/iOS build 63. All 761 baseline parent files remain unchanged. Edits remain in redesign/work.
- **Not run:** Metro/Fast Refresh, native/web runtime, hardware motion evaluation, full heavy suite, builds, commit/push or parent integration. Previous composition fixtures predate these changes.
- Review on the phone: edit a description, save with its theme-colored checkmark, cancel another draft with its red X, then long-press a list and a card. Confirm the list's gentler lift, unchanged card lift, and list visibility above the board ribbon. No storage/import migration. Reversal remains opening the untouched parent app; preserve candidate edits through explicit export, without clearing app data.


## Project edit / More scheduling placement — before audit

Unslop by Damir Sokolovsky (CC BY 4.0), used as a review standard. Spacing → remove the separate Edit project button; color/icons → reuse menu styling and edit icon; copy → retain Edit project; typography → unchanged; layout → place Edit project in Project actions, and Scheduling first in More's Project tools group instead of a separate Plan group; details → preserve the inline editor, save/cancel behavior and always-available Scheduling route; visuals/motion → unchanged. Product: precise local-first project workspace. Character: calm, exact, dependable. World: planning instruments. Moments: project context and deliberate actions. Signature: selected accent and Milvayo Board mark.

Controlled patch: Projects.js action placement and moreGroups presentation only. Keep the wide NAV map, tool switches, routes, model/store validation and project-selection behavior. No schema/import migration, dependencies, builds or parent changes. Verify current navigation reachability and editor callbacks with focused checks; runtime remains pending.

Additional requested detail: remove More's small header Manage tools action above WorkspaceSwitcher; retain its card and existing ProjectToolsSheet. Preserve the screen intro text, workspace selector and search.


## More workspace button — before audit / controlled scope

Spacing/color/icons/copy/typography → retain workspace row and existing compact manager; layout → replace More's separate left slide-over with the same Projects/Workspaces popup used by the header; details → start on Workspaces, preserve create/rename/delete safeguards and project-pick/new-project navigation; visuals/motion → reuse existing Sheet, no new animation. Same five-line direction above; Unslop by Damir Sokolovsky, CC BY 4.0.

Reuse ProjectSwitcher with a workspace-row trigger. WorkspaceSwitcher becomes its thin entry wrapper, removing the phone-only side modal. Forward the shell's existing project-pick callback through More so task selection resets and new-project Board navigation remain centralized. Desktop persistent navigation remains as established. No model, store, schema, import-format or dependency changes; no migration/builds/main-app writes.


### Project actions / More placement / shared workspace popup — delivery checks

- **Pass:** 35/35 focused navigation, project-tool switch, popup confirmation, inline error and workspace-manager regressions (`project-actions-scheduling-tests.log`). Includes the new More entry starting on Workspaces with no separate side modal, switching tabs, existing/new project callbacks and dismissal; existing workspace create/rename/delete and failure recovery checks also pass.
- **Pass:** deterministic project-card and More interaction checks (`project-actions-scheduling-source.log`): Edit project is a menu item; original populated fields, save success/rejection and Cancel remain wired. More has one Manage tools card; Scheduling remains present and navigates even when all optional tools are off. Five final changed app files parse/transform. No device renderer or bundle/build is involved.
- **Pass with limitation:** offline Expo compatibility check reports dependencies up to date; offline validation explicitly remains unreliable (`project-actions-scheduling-dependencies.log`). No package changes.
- **Pass:** whitespace check, work branch and synchronized 0.6.3 metadata. Parent integrity rechecked against 761 baseline files; no parent writes. No schema/import changes or migration.
- Updated legacy expectations for prior owner-approved Settings tools removal and Overview shortcut presentation; tool enable/disable, core Scheduling availability and all-19-screen reachability invariants remain tested.
- **Not run:** full heavy suite, running Expo/Fast Refresh, Android/iOS/web runtime acceptance, builds, commit/push or main integration. Earlier screenshots predate these edits. On the phone, open More's workspace row, use both tabs, switch/create a project and try workspace management; verify project picks use the existing shell behavior. Review the new Project actions placement and Scheduling/Manage tools cards there too.
- Reversible plan: keep reviewing only the isolated redesign/work folder. Returning to the untouched parent app reverts the candidate experience; export any new candidate work explicitly before switching copies. Do not clear storage or reinstall. Main integration requires separate approval.
