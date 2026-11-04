# NP-QA-0.4.6 — MockDesign Kanban interactions

**Source checks:** 349/349 passed. **Interactive Android/iOS/Web tests:** not run in the delivery environment. Record actual results before promotion to `main`.

| Check on Android Expo Go (then iOS/Web) | Expected | Result |
|---|---|---|
| Open Board from Overview repeatedly | No snap, reload, frozen screen or crash | Not run |
| Tap **card body** once | Opens the correct task sheet and displays original task ID | Not run |
| Tap **title** once; allow 350 ms | Opens the correct task sheet; no false inline edit | Not run |
| Double tap title within ~350 ms | Inline title editor appears; task sheet **does not** open | Not run |
| Type multiple words/spaces in title and submit/blur | Exact intended title saves once, preserves task ID/details; no rejected intermediate keystrokes | Not run |
| Enter empty title then blur | Previous valid title survives; no data error | Not run |
| Start vertical scroll on a card without holding | Page scrolls, no drag and no sheet opens | Not run |
| Start horizontal scroll on a card without holding | Board columns scroll, no drag | Not run |
| Start double-tap then hold the second press | No delayed sheet appears underneath a drag | Not run |
| Hold card ~350 ms, move across lanes | Card follows finger including scroll offset; indicator updates | Not run |
| Drag card near horizontal/vertical edges | Scroll compensation keeps held card under finger | Not run |
| Release across lanes or reorder in same lane | Correct status, list, order and ID persist after app restart | Not run |
| Interrupt native drag (app switch/gesture interruption) | No unintended drop/persistence or stuck scroll lock | Not run |
| Double tap list title | Inline rename; typing internal spaces succeeds | Not run |
| Hold list header then drag | Reorder list without blocking normal card scrolling | Not run |
| Tap board chip; double tap/hold board chip | Select board; open Boards manager | Not run |
| Rename board with a multiword name | Saves on blur; Main remains protected | Not run |
| Create board, list, card | Correct board/list placement; list status preserved | Not run |
| Delete list when card filter hides tasks | Confirmation counts all affected tasks; hidden tasks are moved, not deleted | Not run |
| Archive, restore, delete a secondary board | Preserves/moves tasks per canonical logic | Not run |
| Open Timeline after Board changes | Same working rendering as v0.4.5 | Not run |
| Export backup and reload | Task IDs, title, labels, dependencies, acceptance evidence and history survive | Not run |

**If the Board still snaps:** provide the full Metro error and Android logcat exception around the snap; the deprecation `SafeAreaView` warning is not sufficient to identify the cause.
