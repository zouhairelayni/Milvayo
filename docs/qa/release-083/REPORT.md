# Milvayo 0.8.3 — Canvas stability / brief 2.2

Implemented in place on `work`, over the uncommitted 0.8.2 implementation. Prepared against local checkpoint `0676538`; the owner subsequently authorized the local 0.8.3 checkpoint described below. No push, merge, deployment or build. Unrelated handoff/ZIP changes are preserved. Package, lockfile and Expo version are 0.8.3; Android/iOS build 93.

## Final requested behavior

- Dock: **Select / Add / Draw / More**. More contains **Objects / View / Comments in one row**. Redundant Connect, Pan mode and Select multiple entries are removed from that menu. Connection handles and empty-space pan remain direct; multi-selection stays under Select.
- Objects is a searchable virtualized list. Choosing an object opens its Selection actions. Back beside Close returns through nested popovers without changing the camera or selection. Android Back follows that stack.
- All workspace configuration uses the same bounded rectangular popover; no workspace Sheet or dimming backdrop. Sources and object lists own virtualized scrolling. Canvas export uses the existing export engine inline, avoiding its nested Sheet; the normal WBS export UI remains intact.
- Pan controls are four actual SVG arrow buttons in one row, without visible text or a collapsible drawer. Accessible labels remain.
- Lines select by tap/double-tap, retain their routing style, and show SVG controls with small captions. Delete exists on the selected-line pill; its confirmation is placed beside the line. The line settings screen has no duplicate Delete action. Keyboard Delete uses the same confirmation. Colors come from a palette and persist; each newly created line receives a random palette color once.
- New/imported Canvas Trees use left-to-right. Choosing Tree also applies left-to-right; its orientation selector is removed. Existing saved orientations remain valid data, and canonical project/WBS orientation settings are untouched.
- Timeline imports render as original vector roadmaps: phase summaries, date axis and dated milestone diamonds from canonical flags/dates. They preserve live/snapshot behavior and export through SVG/PNG. They do not capture the Timeline screen or create a second schedule.
- Comments have stable colors and visible dots. Tap/double-tap opens an anchored chat bubble; crossing 125% zoom reveals the nearest visible thread. Object-attached dots/bubbles follow geometry; board pins retain world coordinates. Place on canvas chooses a pin location; replies and resolution persist. Panning/zooming outside a bubble remains available. Complete threads remain in board/workspace backups.

The later owner instructions above override the brief's original five-tool dock and Connections inspector inventory. See [the complete control audit](CONTROLS.md), [gallery](gallery.html) and [phone acceptance guide](../../instructions/release-083.md).

## Confirmed root causes and corrections

| Finding | Confirmed evidence | Correction / regression evidence |
| --- | --- | --- |
| Drag handoff has competing geometry owners | 0.8.2 cleared the shared drag on every board revision. Old native closures could then use old coordinates; applying its relative preview to incoming moved props also added the delta twice. | Shared geometry ledger holds absolute bases and final targets through React/worklet handoff. Operation identities reject late acknowledgements; revisions reject older geometry. Matching commits reconcile atomically. Tests cover old/new props, interleaved revisions, consecutive gestures, cancellation, connectors and 18/40/100/250% zoom. |
| Progressive route work | Custom S-curves ran bounded obstacle search for each edge against all objects, then sampled resulting paths. Every revision rebuilt route lists. | Cubic/straight paths depend only on endpoints; geometry cache is bounded to 2,048 entries. Routing projections retain unaffected identities. Buffered camera windows cull distant heavy scene content; endpoint data remains complete. Host measurements below quantify route savings. |
| Missing or changing connector geometry | Exhausted obstacle search returned an empty path. The old `curve` could become a line, rounded elbow or cubic according to transient route geometry. | Every custom S-curve is a deterministic cubic, including overlap, negative coordinates and dense scenes. Elbow retains bounded routing and a deterministic orthogonal fallback. Explicit styles and colors survive undo/import/export. Internal WBS/diagram connectors keep their own algorithms. |
| Editing competes with gestures / stale text | The overlay did not explicitly disable the gesture surface. An edit target had no original-value check. | Editing disables surface recognizers. Keystrokes stay inside the editor; current text is checked against the original before commit. Newer text is not overwritten; the draft stays available on conflict. Keyboard/layout changes do not write object positions or reset the camera. |
| Group resize leaves members behind | A frame resize patched only the frame; child positions/sizes/paths were unchanged. Creation permitted invalid reparenting. Alignment moved selected frames without descendants. | Atomic group commands preserve absolute world coordinates and child-relative positions. Resizing scales members and drawing points; compatible diagrams keep proportions. Alignment translates descendants with roots. Nested new groups, locked/stale/oversized operations fail safely. Import, ungroup, undo and persistence regressions cover relationships. |
| Canvas changes flushed immediately | The latest-value writer was bounded but each Canvas commit requested an immediate flush. | Canvas edits coalesce for 160 ms; status checks wait 180 ms. Explicit save/Back/navigation/background flush immediately. Later immediate edits supersede delayed snapshots. Failure retry and durable-success semantics are retained; older completion reports cannot mark a newer edit Saved. |

The owner also reported Reanimated's native dependency-array warning during Android testing. The new camera `useAnimatedReaction` passed a third dependency-array argument; the installed native implementation explicitly warns on that argument. It now receives two arguments, and the native lifecycle test asserts that contract. A scan found no array dependencies in native/shared Reanimated calls. No warning filter or package change was used; confirm after a full device reload.

The reported Android 10–100 ms flash duration was **not measured**. The referenced recording `550385.mp4` was not present in the repository. Source defects and controlled reproductions are confirmed; physical absence of flicker, stalls or touch warnings remains **Not run**.

No schema conversion or Metro/dependency change. Connector color is an optional validated field; legacy boards retain their existing style/data. Earlier versions can discard that new field when saving, so keep an external backup before downgrading. Diagram caches, history count/byte limits, revision guards, recovery budgets and private local ownership remain enforced.

## Identical host scenes, before / after

Fixtures contain exactly 0/25/100/250/500 mixed objects, groups, up to 80 custom connectors and one linked 81-node WBS. The pre-edit source snapshot was measured before replacement code, then the same helper/scenes ran against the final engine. Node v24.21.0; route medians use 3 samples, other medians 5. Initial projection is a single scene-geometry pass. Shared host load, JIT and cache warmth affect small differences.

| Objects | Initial geometry ms B/A | Cached route list p50 ms B/A | Connected drag path p50 ms B/A | Model move p50 ms B/A | JSON serialization p50 ms B/A | Reopen p50 ms B/A |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0.004 / 0.004 | 0.003 / 0.003 | 0.001 / 0.001 | 0.001 / 0.001 | 0.006 / 0.007 | 0.064 / 0.043 |
| 25 | 8.951 / 9.898 | 3.879 / 0.032 | 0.121 / 0.020 | 0.192 / 0.157 | 0.048 / 0.042 | 0.498 / 0.380 |
| 100 | 2.133 / 1.462 | 8.885 / 0.099 | 0.059 / 0.007 | 0.406 / 0.305 | 0.101 / 0.110 | 0.615 / 0.613 |
| 250 | 2.426 / 2.394 | 8.798 / 0.098 | 0.066 / 0.007 | 0.373 / 0.410 | 0.191 / 0.235 | 1.171 / 1.246 |
| 500 | 3.133 / 3.590 | 14.906 / 0.111 | 0.077 / 0.005 | 0.670 / 0.787 | 0.345 / 0.362 | 2.117 / 2.576 |

Raw [before](performance-before.json) and [after](performance-after.json) include hit-testing, pure pan/pinch/resize, connection creation, restore, projection cache and allocations' scope. No missing routes in these representative scenes. Moving one local object changes exactly one scene identity at every populated size; that is **not a measured React render count**. Other than routing, the small host differences do not establish a general performance improvement; move/reopen/serialization are slightly slower at 500 in this run.

| Requested runtime measurement | Result |
| --- | --- |
| Actual React render counts / commit timings | **Not run** — no mounted React Profiler session |
| Gesture-related JS work | Lifecycle tests confirm hundreds of previews with no model write and one release commit. Native continuous transforms use shared values; coarse camera-window changes can schedule scene mounting. Actual device JS time **Not run**. |
| Disk autosave | Coalescing, supersession, flush and retry verified with deterministic timers. Device disk latency **Not run**; JSON serialization is reported separately. |
| Native initial rendering, selection, drag/resize, pan/pinch, connection, undo and reopening | **Not run** — host kernels/hook tests are not native latency |
| Native FPS, heap, memory growth, 250/500-object usability | **Not run** — must pass physical Expo Go acceptance. No 60 FPS claim. |

The route and comment-geometry caches are bounded; history remains at most 30 operations / 4 MiB. Geometry sent to native recognizers excludes text, nodes, documents and snapshot payloads. Release packets include affected geometry only. Comment dots retain identities across unrelated replies and cull distant markers. Live workspace serialization/budget validation still runs on discrete commits; it is deliberately retained for data safety.

## Verification and visual evidence

| Gate | Result |
| --- | --- |
| Full `npm test` | **Pass — 982 passed, 0 failed, 0 skipped**; [output](full-tests.txt) |
| JS/JSX/CJS bindings, syntax and eager worklet capture order | **Pass — 277 source modules**, [audit](source-audit.json) |
| Compiled native worklet closure execution | **Pass** in full suite; includes preview, ledger, overlay and comment helper dependencies |
| Path/import/folder/header rules, model/store/export regressions | **Pass** in full suite |
| `npx expo install --check` | **Pass**, [output](dependency-check.txt) |
| Version synchronization / whitespace | **Pass**; [machine record](verification.json) |
| Headless complete-screen composition | **Pass — 30 dimension-verified screenshots**, [coverage](screenshots/coverage.json) |
| Live Expo Web, Expo Go, Fast Refresh, IME, TalkBack, rotation, native file sharing | **Not run** — handoff reserves physical testing for the owner |
| Graphical browser, emulator, APK, Gradle, EAS, Playwright, Selenium | **Not run** — prohibited |

Visual states include no selection, selected note/linked Tree, four-tool dock, three-item More row, object search and actions, SVG connector styles/color, adjacent deletion confirmation, drawing, multi-selection/group arrangement, sources, comments/dots/chat, export, settings, portrait 360/390/430, landscape 844×390 and desktop 1440×900. Light/dark are retained. Compare [0.8.2 properties](screenshots/before-properties-390.png) with [popover properties](screenshots/menu-inspect.png), [More](screenshots/menu-tools.png), [line controls](screenshots/connector-style.png), [comment bubble](screenshots/comment-bubble.png) and [roadmap](screenshots/roadmap-desktop.png).

Screenshots render actual JSX through a static RN Web projection with fixture data, inert effects and simulated measurements. They establish layout, not live interactions or Android smoothness. Reviewed whole compositions for overlap, clipping, control density and blank list space; short lists now shrink to their content. Long inspectors scroll within bounds; compact landscape source filters expand internally. The original bundled Unslop review standard and its Damir Sokolovsky (@heydamir), CC BY 4.0 attribution remain intact. Existing themes/brand, startup animation, Timeline and sprint logic are preserved.

## Remaining gates and delivery

Physical tests must confirm release handoff without a backward flash, consistent color/style/endpoint motion, two/three-finger cancellation, stable IME/cursor behavior, comments opening/following/replying, nested Back, and responsive representative 250/500-object boards. These gates remain open. At low zoom, many objects can legitimately be in view; culling does not make an arbitrary number of visible complex SVGs cheap. New grouping is one level; imported legacy groups remain valid. Fit retains the 5%–400% model range. Existing saved downward Trees/wrapper sizes are not silently rewritten; choosing Tree reapplies the supported left-to-right view.

The 0.8.1 startup smoke also retained an unclassified Web SVG/TourArtwork console error. This release did not rerun live startup and does not clear that finding. Comment conversations are preserved in JSON/workspace backups; SVG/PNG exports retain the existing object/line/diagram content scope.

No Firebase, remote security or release claims. Agent screenshot processes are stopped after capture; the existing user Termux Expo server is preserved. Update and rollback steps are in [the phone guide](../../instructions/release-083.md). `PATCH-FILES.txt` lists this patch against the session's pre-edit 0.8.2 state; uncommitted 0.8.2 prerequisites must be retained. Do not revert the whole tree or stage unrelated handoffs/ZIPs.

## Local checkpoint authorization

The owner explicitly requested “stage and commit v0.8.3”. This authorizes a local checkpoint on `work`, including the uncommitted 0.8.2 prerequisites. The 982-test result and remaining physical Android/Fast Refresh gates remain as recorded; the checkpoint does not establish native acceptance. Unrelated handoff/ZIP changes are excluded. No push, tag, `main` merge or deployment is authorized. Git history provides the resulting checkpoint SHA.
