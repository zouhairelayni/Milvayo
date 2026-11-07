# Milvayo application audit

Milvayo is a local-first project-management app. Expected workload: one person, up to the model's project/task/board limits, on an Android phone; Web is a secondary surface. This is a source, lightweight test and host-CPU audit. It does not establish Android frame rate, heap stability, cold-launch latency or physical gesture acceptance.

## Confirmed findings and disposition

| Priority | Reproduction / consequence | Fix / evidence |
| --- | --- | --- |
| P1 | Paste awaits clipboard IO while retaining an older `draft`; an intervening edit is discarded by the eventual restore command | Build pasted content from `current.current` after IO and stop after unmount; deferred-clipboard integration regression |
| P1 | Template a project containing a Canvas: new project ID disagrees with `board.projectId`; normalization rejects it | `rehomeBoards` in the Canvas domain rebinds full-project ownership and task/project/roadmap/diagram links; snapshot origins stay frozen. Original-HEAD reproduction and copy/import round-trip tests |
| P1 | Import a project whose ID already exists: project ID is changed but its Canvas ownership is not, causing a valid import to fail | Use the same full-project rehoming rule in the existing import transaction. Standalone cross-project board restrictions remain intact |
| P2 | Leave an inline edit by selecting a different object: draft stays associated with the previous selection and can be lost | Finish current inline edit before selection/tool changes; repeated save remains one transaction |
| P2 | Native drag reselects one object out of an existing selection; Web drag of an unselected object leaves stale visible selection | Retain selected IDs during group drag; report new Web drag selection once; gesture simulations preserve final-transaction semantics |
| P2 | Ungroup is unavailable when the selected object is the group frame itself | Domain ungroup detaches children, retains the frame and refuses locked-member mutations; UI/domain tests |
| P2 | Send to back at z=0 or bring to front at capped z=100000 ties other layers and can leave the object in the wrong order | Validated layer command assigns dense ordered layers; tied/capped cases and backup round trips tested |
| P2 | Text color has no visual effect; frame appearance does not affect its outline | Apply text ink/frame border colors in canonical scene/export generation; geometry regression |
| P2 | The source picker hides every match after the first 50 | Full searchable/filterable virtualized source list; distinct scoped keys and 220-task test |
| P2 | Tiny automatic diagram fit can produce unreadable nodes or show an empty corner | Keep explicit whole-content fit, use actual root geometry and scene scale for readable new-diagram framing; preserve saved viewports |
| P2 | Common Canvas tools require a collapsed control and a series of large sheets | Persistent dock, direct undo/redo, contextual type-specific actions/swatches and grouped anchored Add menu; screenshot and callback coverage |
| P2 | A nested virtualized list in the former sheet ScrollView would have unbounded/nested scrolling and swipe conflicts | Add opt-in `scrollable=false`, safe optional scroll reset and header-only swipe dismissal for that mode; default-sheet and source-sheet tests |

No additional confirmed P0/P1 issue remained in the inspected flows. This is not a claim that the entire application is free of defects.

## Screen-by-screen review

| Screen / flow | Performance and state review | Bugs / architecture review | Changes made | Remaining acceptance / limits |
| --- | --- | --- | --- | --- |
| Overview / Dashboard | Status/schedule selectors memoized; visible focus is bounded; chart calculations stay in pure domain helpers | Navigation callbacks reach tasks/testing/releases/backup; empty and attention states have real actions | None; preserve existing composition | Actual chart mount/scroll and startup timing Not run on Android |
| Board / Kanban | Existing progressive card mounting, visible-column batching, hidden-screen activity guard and drag-time auto-scroll | Model status/dependency checks, full-order drops, cancel/listener cleanup and edit retention covered by existing suites | None; stable gesture path retained | Large-board frame pacing and drag reversals Not run on hardware |
| Timeline / Gantt | Existing visible rows/range calculations, retained primary tab, active-gesture interval guard, UI-thread pinch and viewport rebasing | Duration/move logic remains in timelineEdit; live dependencies and frozen scheduling invariants remain tested | None; no Timeline source changes | Device pinch, scroll, resize and dependency-line acceptance required |
| Tasks / task detail | Existing memoized query/sort/rollups, bounded page sizes, native deferred view preparation | Shared detail editor, dependency/parent checks, task-check routing, explicit evidence/export paths | None | Low-end Android list/IME/TalkBack acceptance; layout remount timing not measured |
| Sprints | Existing bounded backlog and domain historical calculations | Lifecycle remains in agile.cjs; completion freezes history; no inferred pre-start statuses | None | Native rendering and interaction Not run; domain/regression tests pass |
| Releases / Testing | Gate calculation and acceptance-test IDs traced; selectors and empty state callbacks inspected | Local records do not assert remote merges/releases; report/evidence actions remain real | None | Actual native file sharing and large evidence panels Not run |
| Projects | Existing native FlatList batches, deferred query, retained drafts keyed by workspace | Template and collision import failed with Canvas ownership mismatch | Repair full-project Canvas rebinding and round trips | Project templates intentionally reset sprint/release state; links to removed canonical records become unavailable; capture snapshots before templating if history is needed |
| WBS Outline / Diagram | Bounded semantic layout/primitive cache; only selected scene generated; native viewport-sized camera and batch visibility retained | Outline mutation, full-screen orientation, export validation and unavailable-scene fallback inspected/tested | None | Tree top-down touch responsiveness and native SVG mount/heap measurements Not run |
| Portfolios | Small model-bounded collection; shared relationship/health selectors | Membership deduplicates by project ID; delete removes portfolio links without deleting projects | None | No evidence justifying a store rewrite; physical scroll Not run |
| Programs | Shared relationship summaries, bounded portfolios/projects; date-window work is per program render | Legacy direct memberships remain; program relationships and date constraints tested | None | Roadmap date sort is repeated per row; P3 staged optimization only if a device trace shows cost |
| Project artifacts / risk / documents | Existing shared governance store and lazy fields; WBS geometry separate from document text | Save/cancel, matrix filtering, risk score, draft controls, document/source links traced | None | Actual long-form editing and document export sharing Not run on hardware |
| More / Project Tools | Derived menu groups; optional tool switches preserve data; Canvas route lazy-loads editor | Navigation destinations matched to screen registry and project feature rules | None | Search leaves utility actions available by design; no redesign outside Canvas |
| Settings / themes / launcher | Stable theme tokens and independent icon application; backup remains explicit | Flush-before-icon restart, confirmation and disabled web launcher path retained | None | Actual launcher restart and large-font native layout Not run |
| Backup / workspace switching / persistence | One in-flight writer plus newest queued snapshot; recovery budget checked each edit; import validates before state mutation | Workspace-bound writers, epoch guards and failure retry inspected; collision project import repaired | Full-project Canvas rebinding only | AsyncStorage disk latency and abrupt process death Not run; export backups before rollback |
| Startup / navigation shell | Shell preparation concurrent with preserved N-to-Board animation; first heavy tab prepared without artificial timeout; hidden tabs freeze subscriptions | Project-keyed retention and back/navigation queue tests retained; Canvas not retained in primary tab cache | None | Live Web reached first-run tour, but its retained log includes an unclassified SVG/TourArtwork console error; native launch/Fast Refresh Not run |
| Diagnostics | Bounded breadcrumbs, batched writes, startup/work/render measurements, foreground timer-delay sampling | Warnings/errors still forwarded to original console; crash handler and Fast Refresh cleanup tested | None; no error suppression | Timer drift is not native FPS/ANR proof; native-exit hooks require hardware |
| Canvas | Geometry reuse, pure gesture projection, native UI-thread previews and Web direct SVG transforms retained; sources now virtualized | Full control matrix and confirmed fixes in CANVAS-CONTROLS.md | Dock/context/Add UI, framing and reliability repairs | Hardware gestures, native screen-reader/IME, device FPS/heap, disk/sharing remain Not run |

## Repository architecture

The static audit covers every src JS/CJS module for bindings and dependency edges. `source-audit.json` records zero unbound identifiers, zero unused named imports and zero forward worklet captures. `architecture-audit.json` records zero cycles in the resolved static graph, including delayed requires and platform alternatives; runtime-dynamic module loading remains outside this check.

The three empty UI callback candidates are intentional: controlled/selectable diagnostics text; a disabled risk-draft header; a fixed single-option workspace export selector. Empty catch blocks were traced to noncritical diagnostics/fallback/cleanup paths; main workspace mutations and imports surface failures. No catch was removed or added to disguise errors.

The largest modules remain Timeline (~1,004 lines), Board (~691), TaskSheet (~356) and ModernApp (~346). Their size alone is not a performance defect. CanvasEditor remains a coordinator; shared tools, swatches, contextual actions, Add composition and source browsing now live in separate feature components. Business rules remain deterministic domain/Canvas modules. No large global refactor was justified by the measured evidence.

Potential staged work: if physical traces identify stalls, first measure a single navigation/gesture/edit with existing diagnostics; then isolate the specific selector or view; add a fixture reproducing it; finally refactor that boundary and repeat the same measurement. Do not rewrite Timeline/Board gestures or replace store architecture without that evidence.

## JavaScript / JSX / TypeScript assessment

The installed Expo/Babel pipeline supports JSX in .js files, as confirmed by the real Metro Web compilation and complete-source parse. No src TypeScript files or tsconfig are present. Changing suffixes does not improve runtime execution.

Keep existing .js/.cjs organization. A separately scoped improvement could add JSDoc/checkJs contracts for Canvas commands, source links and store API results, where incorrect IDs/async result handling caused real bugs. First test compatibility with the installed toolchain, then enable checking on those modules, then expand only as errors justify. A full TS migration adds conversion/configuration cost and can disrupt Metro/platform resolution; it is not part of this release.
