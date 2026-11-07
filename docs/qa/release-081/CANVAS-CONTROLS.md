# Canvas control audit

Every editor/library/Add-to-Canvas control was traced to its callback and domain/storage path. “Pass” below means the named automated domain, callback, gesture simulation or source check ran; it does not mean physical Android acceptance. All native gesture feel, Android Back/IME, TalkBack and file-sharing interactions remain **Not run** on hardware. Web screenshots are static actual-JSX projections unless explicitly labelled live startup.

| Control / feature | Previous behavior / finding | Implementation / fix | Verification result |
| --- | --- | --- | --- |
| Library New/Create canvas; blank, brainstorm, strategy, risk, roadmap templates | Existing durable creation and retry | Preserve, lazy-load editor only on entry | Pass: canvas-library, domain round trips |
| Library search; Active / Archived | Existing project-scoped filtering | Preserve canonical boards and timestamps | Pass: source trace and library harness; pointer runtime Not run |
| Open board / Back | Existing close guards and viewport save | Preserve failed-save guard, centered title; allow a readable two-line title | Pass: editor save failure/retry/viewport; header harness |
| Manage → Preview | Existing bounded thumbnail | Preserve; separate preview/export sources | Pass: source trace; visual fixture |
| Manage → Duplicate / Archive / Restore / Delete archived | Existing validated duplicate, archive and recovery snapshot deletion | Preserve; deletion remains confirmed and archived-only | Pass: domain/storage/library tests |
| Import board | Validated explicit import only | Preserve schema/ID remap/live-link restrictions; no automatic import | Pass: domain/schema/import tests; file picker hardware Not run |
| Select | Collapsed pill → mode sheet | One direct dock action, active state, V shortcut | Pass: toolbar/editor harness |
| Add | Pill → Add → inspector | One dock action opens anchored menu; creation closes menu without inspector | Pass: two-action note integration and responsive screenshots |
| Draw | Mode sheet before switching | Direct dock action; brush configuration separate; D shortcut | Pass: tool transitions and drawing harness |
| Connect | Mode sheet before switching | Direct dock or contextual action; C shortcut; tap source and target | Pass: editor connector creation; native/web surface simulations |
| More | Hidden tools entry | Always available; substantial grouped inspector | Pass: callback trace, integration and screenshot |
| Undo / Redo | Nested Tools actions | Direct compact controls; disabled when history empty; remove redundant Tools copies | Pass: integration/history byte budget; Ctrl/Cmd-Z, Shift-Z source trace |
| Zoom percentage | Header view sheet | Compact top-bar viewport menu; visible current percentage | Pass: source trace; pure zoom tests; screenshots |
| Fit all | Open view sheet first | One header tap; 0 shortcut; bounds-based fit inside supported 5–100% fit range | Pass: pure fit/hit tests and header callback trace |
| Fit selection | Missing | Fit recursive selected group content | Pass: selectionBoard/fit tests and callback trace |
| Zoom in / out; reset; Left/Right/Up/Down viewport pan | Existing advanced controls | Preserve focal zoom and button alternatives | Pass: pure interaction tests; callback trace |
| Saved viewport | Saved on explicit close/source navigation | Preserve exact saved pose; newly inserted diagrams use content/root-based readable framing | Pass: close/reopen persistence and large-root framing tests |
| Tap selection | Single selection | Preserve; selection change now commits pending inline text | Pass: editor regression |
| Select multiple / Done selecting | Object list only | Accessible surface multi-selection and clear exit; list alternative retained | Pass: deterministic selection + grouping integration; hardware Not run |
| Drag selected object/group | Native reselected hit object and collapsed multi-selection; Web dragged unselected objects without updating selection | Preserve selected groups, select newly dragged objects; commit once at release | Pass: native/web gesture simulations and editor group tests |
| Resize handle | Existing direct resize | Preserve whole object geometry, drawing point scaling and diagram aspect ratio | Pass: interaction/domain/surface tests |
| Connector handles on four sides | Existing direct connection preview | Preserve UI-thread native / direct SVG web preview; lines follow live object changes | Pass: compiled-worklet and route simulations; hardware Not run |
| Double tap/click text or local diagram node | Existing direct local editor | Preserve focused overlay; switching selection/tool saves the draft; outside tap/blur saves and Escape cancellation remains | Pass: local-editing/editor regressions; keyboard/IME hardware Not run |
| Context Edit | Previously nested inspector | Direct inline text/node editing; omitted for linked cards and strokes | Pass: editor integration and type-dependent source trace |
| Context swatches: Theme / Clay / Sage / Blue / Paper | Text-only color rows | Real color previews, checked state and immediate patch; locked controls disabled | Pass: both-theme swatch tests; scene identity/export tests; screenshots |
| Text / frame appearance | Text color ignored; frame appearance ineffective | Color text ink and frame border respectively | Pass: geometry/export regression |
| Context Duplicate | Nested selection action | Direct validated recursive duplication; internal links/comments/groups remapped | Pass: editor/domain grouping/duplicate tests |
| Context Connect | Nested mode selection | Start from selected object in one action | Pass: editor two-object connection test |
| Context Source | Generic controls previously | Only linked objects; disabled for unavailable or foreign-origin snapshots | Pass: source restrictions and snapshot-origin tests; source navigation traced |
| Context Layout | Generic inspector path | Diagram-only layout/branches entry | Pass: local/live diagram layout integration |
| Context Width | Generic inspector path | Stroke-only width entry; remove ineffectual stroke text editor | Pass: drawing integration and type-dependent source trace |
| Context Group / Delete for multi-selection | Nested actions | Direct actions; lock validation retained | Pass: group/remove/undo/domain tests |
| More → Pan mode | Mode sheet | Accessible dedicated pan option; H shortcut | Pass: state rules; gesture source trace |
| More → Objects; search; row toggles; Select all; Edit selected | Existing bounded list | Preserve list selection/search alternative and disabled empty state | Pass: source trace; selection/domain tests. First 100 matches shown; search reaches other objects |
| More → Connections; row edit | Existing list | Preserve real connector IDs and empty guidance | Pass: source trace and connector integration |
| More → Comments; Add / Reply / Resolve / Reopen / More comments | Existing persistent threads, 20-thread paging | Preserve real thread mutations and anchors | Pass: editor callback integration and serialization round trips |
| More → Board settings; Rename | Existing rename | Preserve revisioned board rename | Pass: editor integration |
| Invite/share | Intentionally unavailable without authenticated backend | Remains disabled, with local/private explanation | Pass: disabled-state integration; remote sharing Not run/unavailable |
| More → Export and backup | Existing complete-board exporter | Preserve explicit on-demand geometry | Pass: canvas-exports and DiagramExports tests |
| Selection → Align left | Existing restore transaction | Preserve multi-object/lock checks | Pass: domain restore/lock coverage and handler trace |
| Selection → Copy / Paste | Existing board JSON clipboard | Paste now merges with latest board after awaited clipboard read; stops after unmount | Pass: concurrent-edit regression and domain import validation |
| Selection → Duplicate / Group / Delete | Existing advanced actions | Preserve same domain paths as context controls | Pass: editor/domain regressions |
| Object properties / Save text / Edit on canvas | Existing advanced editor | Preserve, remove stroke text action; locked edit action disabled | Pass: text/domain/local-editing tests; callback trace |
| Open canonical source / Capture snapshot | Existing linked inspector | Preserve canonical navigation after successful viewport save; snapshot remains frozen | Pass: sources/domain snapshots; navigation source trace |
| Arrange → Lock / Unlock | Existing lock command | Preserve validated state; no editing locked objects | Pass: domain/editor lock tests |
| Bring to front / Send to back | Setting 0 or max+1 failed on tied/saturated layers | Reorder dense layer sequence in a validated transaction | Pass: tied/max-layer regression, UI callback test and backup round trip |
| Ungroup | Disabled on a selected group frame; only detached individual members | Release frame's children, preserve frame, reject locked members | Pass: domain failure/success and editor callback tests |
| Arrange → Left/Right/Up/Down; Wider/Narrower/Taller/Shorter | Existing accessible numeric alternatives | Preserve model size/bounds checks | Pass: resize/move/domain tests and handler trace |
| Appearance → color; stroke width | Text color rows; same actions for all types | Shared swatches; width for strokes; diagram styling routes to Layout | Pass: color/brush/export tests |
| Diagram → Tree/Fishbone/Mind map; orientation | Existing cached geometry | Preserve recalculated container size; no layout calculation during gestures | Pass: linked/local layout, cache and compiled-worklet tests |
| Add branch / node row / edit node / child / delete subtree | Existing local-only diagram mutations | Preserve canonical WBS separation and locked-object checks | Pass: localEditing/domain and subtree functions; callback trace |
| Add → Note/Text/Shape/Card/Frame | Same rows, then inspector | Distinct icons; direct creation and selection, two taps from dock | Pass: creation/domain tests; Add screenshot |
| Add → independent Tree/Fishbone/Mind map | Extra Blank diagram sheet | Direct choices in Add menu | Pass: independent diagram integration and domain schema |
| Add → project diagram layout | Existing layout selector | Preserve explicit project task diagram creation | Pass: linked diagram integration and task count failure tests |
| Add → Tasks/WBS/artifacts | Project source rows truncated to first 50 | Search + All/Tasks/Artifacts/Roadmaps filters; virtualize all matches | Pass: 223-row test including 220 tasks and unique scoped roadmap keys |
| Sources → Live link / Snapshot | Existing source mode | Preserve modes across WBS/layout selection and insertion | Pass: editor/source tests and round trips |
| Sources → WBS/task/risk/register/document/stakeholder/sprint/project/phase/sprint/milestone roadmap | Existing integrations | Preserve explicit insertion and unavailable-source errors; category-specific icons | Pass: source tests, domain validators; canonical data unchanged |
| Brush / Eraser; width 1/3/6/12/24; ink; Start | Mode entry opened drawing sheet | Tool switch direct, settings remain available; all strokes undoable | Pass: editor/drawing and native/web surface tests |
| Export SVG / PNG / CSV; quality/background; Board backup | Existing on-demand complete geometry and bounded PNG budgets | Preserve validation, escaping, CSV formula handling and platform failure feedback | Pass: geometry/export/PNG callback tests; actual native share/download hardware Not run |
| Source-screen Add to Canvas / choose board / Create and add | Existing durable placement with retry guard | Preserve canonical sources and single insertion after failed IO | Pass: Add-to-Canvas integration |
| Close/dismiss menu or inspector / Android Back / accessibility escape | Existing Sheet close contracts | Add popover has explicit close and Back priority; virtualized sources own scrolling and cannot swipe-dismiss from list content | Pass: Sheet contract/default + virtualized-sheet regression; native Back hardware Not run |
| Keyboard Copy/Paste/Duplicate/Delete/arrow movement/Escape | Existing desktop shortcuts | Preserve input guards; add direct tool keys | Pass: handler trace and corresponding mutation tests. Live keyboard runtime Not run |

No empty Canvas UI callbacks found. The global scan's three empty callback candidates were inspected: diagnostics uses a controlled selectable report; risk draft headers are explicitly disabled; backup's workspace picker has a single fixed choice. They are intentional, not failed Canvas actions.
