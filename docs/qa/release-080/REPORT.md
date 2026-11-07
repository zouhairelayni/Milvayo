# 0.8.0 Canvas engineering handoff

0.8.0 checkpoint on work; commit and push explicitly authorized by the owner. Prerequisite commits: 6bd035d (0.7.13) and 1e8a972 (0.7.14). Package, lock and Expo versions are 0.8.0; Android/iOS identifiers are 90. No dependency addition, build or Expo startup. Git checkpoint authorization does not authorize a main merge, release tag or deployment. User ZIP changes are preserved.

Phases A–C are implemented; local Phase D export/data/interaction/audit checks are implemented. Final physical acceptance and secure-sharing disposition remain release gates. This report does not approve a release.

Canvas is reached through More → Project tools and starts with its library. The editor loads only on entry. Boards remain project-scoped/local/private, with validated immutable content, optimistic revisions, existing durability/recovery paths and explicit save retry. Existing workspace/project formats retain their additive Canvas field. Board backups use milvayo.canvas.v1; duplicate/import remaps Canvas identities and retains canonical links. Live cross-project links are rejected; snapshots retain their source origin.

The editor uses a centered shared title, preserved zoom/fit control and a small expanding pill. The app navigation hides only inside a mobile board. Grouped rows organize modes, creation, source picking, selection, appearance, diagrams and board actions. Notes and local nodes edit within their element after viewport focus; input state is isolated from the board. Draw offers brush widths/colors and an undoable stroke eraser. All four faces can connect; opaque obstacles are avoided and diagram bounds have a faint outline. Layout changes fit the container to the current scene.

Native gestures keep pose, drag, resize, stroke and connection previews on the UI thread and send final transactions to React. Browser gestures paint the SVG directly; wheel reporting is batched after each burst. Both cancel/reset safely. Numeric interaction projections exclude text/document/snapshot data. Routes are shared for rendering/picking and reused for distant moves. Complete exports reuse canonical geometry; current WBS exports and Timeline editing/sprint history semantics remain covered by regression tests.

## Validation

| Check | Result |
| --- | --- |
| Full npm test | Pass — 927 tests, 0 failures (final source) |
| JSX/import/path checks | Pass in focused source and folder checks; included in full suite |
| Expo install --check | Pass — dependencies are up to date |
| Native/worklet source transforms | Pass — 38 offline source transforms |
| Compiled closure execution | Pass — real Expo worklet transform followed by simulated UI closure execution, including routing helpers. This is not physical Hermes execution |
| Global static source audit | Pass — 250 modules, no unbound identifiers, no eager forward captures and no unused named imports. Retained default React compatibility imports are identified |
| Headless Chromium visual review | Pass — actual JSX projected into static RN Web fixtures; 320/390 portrait, 844 landscape and 1440 desktop HTML, light/dark, library/editor/diagram/roadmap and grouped menus. Effects and modal placement are adapted; not an Expo app runtime |
| Source/cache/export benchmarks | Pass — bounded host fixtures and operation counts; see records below |
| Earlier export crash / squeezed Tree and initial 100% / connector-drag repair | Pass — owner reports. Latest extended routing and drawing refinements are not included in that earlier device confirmation |
| Live Expo Go / Fast Refresh / live app Web | Not run — no agent-started Expo server; builds/startup prohibited by owner |
| Physical large-font/screen-reader/keyboard, gesture reversals and rotation | Not run — require final device acceptance |
| Native first-open/cached-reopen p50/p95, frame/FPS and heap/ANR targets | Not run — host timings/source counters do not establish these targets |
| Server-enforced Viewer/Editor sharing | Not run/unavailable — no authenticated backend; invitations disabled, release dependency explicit |

## Measured performance scope

Node v24.21.0, same-host bounded data only; no controlled reference Android comparison. These values exclude application navigation, native/React mount, GPU, IO and actual memory residency.

| Fixture | Recorded result |
| --- | --- |
| 41 objects / 40 WBS nodes, 25 repeated projections | p50 0.058 ms, p95 0.218 ms; hierarchy/Tree calculation counts unchanged |
| 201 objects / 200 WBS nodes, 25 repeated projections | p50 0.101 ms, p95 0.233 ms; hierarchy/Tree calculation counts unchanged |
| Full SVG scene/export serialization, those fixtures | 5.489 / 5.755 ms; PNG planning remains bounded separately |
| 1,000 tasks × 10 projects / 20 portfolios | 21-day series median 0.075 ms; project-view edit 1.669 ms; next edit recalculates one project's health rather than ten |
| Isolated 1,000-object / 2,000-edge endpoint lookup | 2,002,000 comparisons → 4,000 indexed lookups; host p50 28.014 → 0.174 ms |
| Distant-note drag, 200 objects / 12 connections | 12 → 0 rebuilt routes; host p50 1.582 → 0.008 ms |
| Numeric gesture projection, 200-note fixture | 535,891 → 13,891 serialized bytes; not a native heap measurement |

See host-measurements.json, global-host-performance.json and routing-host-performance.json for sample sizes and p95. Full path generation is more expensive than cache reuse; search/caches/import/export/history are bounded. Unroutable physical overlaps retain records without drawing through elements. Reference-device performance targets remain unverified.

## Audit and delivery

AUDIT.md records the confirmed bugs and fixes, including native worklet initialization, WBS root boundary data loss, backup size round trips, pending IO duplication, cross-project snapshot navigation, grouping/copy semantics, stale gestures, input/wheel render work, path picking and unused imports. The source scan is a bounded static check, not proof of absence of every bug or dead dynamic path.

Skills applied: bundled Unslop by Damir Sokolovsky (CC BY 4.0), UI/UX Pro Max, frontend-design, Impeccable, Ponytail Audit/coding review, RN performance/gesture/SVG and Expo animation guidance. Existing neutral chrome, semantic accent and original Board mark are preserved. No extra image assets or decorative motion. The existing .impeccable/design.json context sidecar is stale and was not rewritten as part of this feature.

No remote backend project, auth/security rules, synchronization or deployment. All work is in place. Keep current workspace/board backups and preserve untracked source before rollback: older code drops Canvas fields and predates the WBS boundary repair. Follow docs/instructions/release-080.md for use, manual acceptance and reversible return to a checkpoint. The owner subsequently requested the 0.8.0 commit and push to origin/work. That Git checkpoint is authorized; remaining physical checks stay Not run and sharing remains disabled. Git records the actual checkpoint and push outcome.
