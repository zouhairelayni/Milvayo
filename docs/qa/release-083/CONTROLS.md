# Canvas 0.8.3 control audit

Scope: workspace controls and their connected handlers, after the owner's follow-up instructions. Library creation/archive/import and source-screen Add to Canvas retain their separate existing flows. A source trace establishes wiring; automated callback/geometry tests establish listed operations. None substitutes for physical Android touch/keyboard acceptance.

| Control | Expected operation | Finding / final change | Verification |
| --- | --- | --- | --- |
| Back | Save view, flush and leave only if safe | Preserved revision/failure guard | Editor success/failure/retry test |
| Undo / Redo | One content restore per operation | Direct header controls; bounded history retained | Editor, history and model round trips |
| Fit all / percentage | Fit content and report zoom | Includes object bounds and comment pins; range preserved | Fit/focal geometry and editor tests |
| Board overflow | Settings and export | Same rectangular popover, no dimming | Source trace + capture |
| Select | Direct select; selection mode | Single/multiple remain on pill entry | Tool and selection tests |
| Add | Open grouped palette | Note/Text/Shape/Card/Frame; Tree/Fishbone/Mind map; project/source entry points | Actual insertion callbacks + capture |
| Draw | Direct drawing mode | Compact Brush/Eraser/width/ink controls | Drawing/erase/editor tests |
| More | Secondary entry points | Exactly Objects / View / Comments in one row | Source trace + capture; editor navigation |
| Connect dock / Pan mode / duplicated multi-select / Connections menu | Redundant entry points | Removed at owner's request | Inventory tests + More capture |
| Object tap / direct drag / resize handle | Select and transform | Absolute geometry ledger; stale bases and locked members guarded | Native/Web lifecycle, ledger, model tests |
| Object double-tap / Edit | Inline text/node edit | Underlying gestures disabled; buffered text and conflict check | Save/cancel/stale-edit tests |
| Color | Apply selected object color | Small palette, real patch and history | Swatch + undo test |
| Duplicate | Copy selected content and relationships | Stable remapped IDs retained | Group/connector duplicate test |
| Fit selection | Fit chosen object/group or edge endpoints | Direct contextual control | Editor view-only mutation assertions |
| Object properties | Detailed settings | Same popover; typed content, canonical source, snapshot, arrange, appearance/layout | Handler tests + capture |
| Open source | Save view and navigate to canonical record | Unavailable/cross-project origins disabled | Source isolation tests + handler trace |
| Capture snapshot | Freeze current source projection | Real snapshot guard; disabled when unavailable/already frozen | Source live/snapshot tests |
| Group | Create frame + membership atomically | Only valid unlocked independent objects; no new nesting/oversized group | Model success/failure/import tests |
| Align left | Align independent roots | Descendants translate with selected frames | Pure command/source trace; position invariants |
| Lock / unlock | Change editability | Model and gesture constraints preserved | Editor/model tests |
| Bring front / send back | Change layer order | Real layer command, respects locks | Editor test |
| Ungroup | Remove membership without moving content | Atomic, respects locked members | Position/undo/import tests |
| Move / resize arrows | Adjust world geometry | SVG/icon controls; group proportions respected | Geometry/editor assertions |
| Objects search / list item | Find object, then actions | Extra selection header controls removed; row opens Selection actions | Search 1,000 rows; navigation/Back test |
| Copy / Paste | Board-format clipboard operations | Paste merges against current content after IO | Pending clipboard concurrency test |
| Delete selection | Remove selected objects and dependent edges/comments | Existing explicit selection action preserved | Model/history tests |
| Four pan arrows | Shift camera 120 screen units | Actual SVGs in one row, no labels/drawer | Handler trace + View capture |
| Fit / Zoom ± / Reset | Camera change only | Explicit actions; editing/closing does not auto-reset | Focal math / saved-pose tests |
| Connection handle drag | Connect two objects | Primary connection path; no Connect button required | Native/Web surface tests |
| Line tap / double-tap | Select/highlight line | Direct route hit-test; thickens chosen color | Surface lifecycle + geometry tests |
| Line pill Style / Fit / Delete | Context actions | SVGs with small captions | Capture + callback tests |
| Line label Save | Commit label | SVG check with small caption | Editor connector mutation test |
| S-curve / Straight / Elbow | Explicit stored style | SVG controls with captions; active state shown | Continuity/style round trips |
| Line color | Edit persisted color | Palette; random assignment once at creation | Color validation/undo/import test; export trace |
| Line delete confirmation | Cancel or remove exactly once | Beside selected line; no duplicate red button in settings | Cancel/confirm/repeat/undo test |
| Comments composer | Attach to selection or board location | Same bounded popover | Thread/reply/resolve persistence tests |
| Place on canvas | Pick pin position, then compose | Tap mode writes only after Add | Editor placement test |
| Comment dot / zoom reveal | Read thread | Stable colors; direct hit/double-tap; nearest visible thread on crossing 125% | Pure hit/anchor + editor tests; capture |
| Chat reply / Resolve / Reopen | Update same thread | Buffered reply, duplicate-submit guard, persisted thread | Editor/model tests |
| Aggregate replies / thread paging | Read/reply/resolve older threads | Preserved; 20-thread pages | Handler trace + existing tests |
| Tree / Fishbone / Mind map | Change supported layout | New/reselected Tree uses right; orientation chooser removed | Tree/import test; source geometry tests |
| Diagram branch/node edit/add/delete | Mutate local diagram only | Existing validation/cycle/lock rules preserved | Domain/inline-edit suite + source trace |
| Project sources search/kind/live/snapshot | Find and insert linked projection | Virtualized; compact landscape filters | Filter >50 results, source isolation tests |
| Timeline import / roadmap template | Create vector roadmap | Phase summaries + milestone diamonds; canonical dates read only | Roadmap SVG/snapshot tests |
| Board backup | Export complete JSON board | Explicit download feedback retained | Backup/import/model tests; handler trace |
| SVG / PNG / conditional CSV | Export complete object/line/diagram bounds | Inline existing engine; cancellation and feedback preserved | Export success/failure/cancel/native capture harness |
| Rename | Persist title | Validated command; no unnecessary settings text | Editor test |
| Sharing / invites | Remain unavailable | Explicitly disabled; no remote claim | Disabled-state test |
| Back beside Close | Return one section | Actual section stack; retains camera/selection | Objects→actions→Back test |
| Close / outside / Android Back | Dismiss or return | Outside/Close dismiss; Android Back returns through stack | Hook/source trace; physical acceptance Not run |

Physical dot/line hit accuracy, nested focus, native clipboard/file permissions, keyboard, accessibility and frame pacing remain **Not run**. Empty callbacks were not added. Unsupported sharing is visibly disabled. The shared export component's normal WBS mode still uses its existing Sheet; Canvas uses its inline mode.
