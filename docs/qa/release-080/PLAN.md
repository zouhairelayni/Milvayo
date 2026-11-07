# 0.8.0 implementation plan and architecture lock

Prerequisites: 0.7.13 `6bd035d` and 0.7.14 `1e8a972` are separate tested commits on work. Owner confirms the export crash is fixed. Full native performance acceptance remains pending; current explicit request authorizes progression. No 0.8.0 commit, build, Expo server, push or merge.

## Discovery

Navigation: `src/app/ModernApp.js`, `navigation/sections.cjs`, `screens/more/More.js`. Project Artifacts and WBS: `screens/governance/Projects.js`, `pm/PmWbs.js`, `governance/pm.js`. Canonical project: `domain/model.cjs`; `governanceCore.cjs` validates WBS/documents. `store/store.js` owns normalized workspace transactions, bounded recovery snapshots and the durable latest-writer queue. No auth/Firebase backend or authenticated member IDs exist. A free-text project-manager name cannot enforce authorization.

Canvas will be an additive, versioned `project.canvases` field, preserved by project/workspace import and backups. Missing fields become an empty library; malformed/future versions fail explicitly, leaving original storage intact. Existing top-level import format stays unchanged. Existing normalized projects/cache/recovery/audit paths remain authoritative. A separate Canvas board backup validates/remaps IDs; cross-project live links are rejected, not imported as editable copies.

`src/domain/canvas.cjs`: bounded schema, immutable operations, local access boundary, optimistic revisions, comments, undo snapshots and backup remapping. `src/canvas/sources.cjs`: registered real task/WBS/risk/stakeholder/document/sprint/project/roadmap projections, semantic revisions and broken-link behavior. `src/canvas/scene.js`: reuse canonical WBS tree and bounded diagram cache; memoize object geometry and combine complete exports. `src/screens/canvas/`: lightweight library and lazy editor, private local boards, templates, inspectors/comments/source picker, Add to Canvas. Platform gesture/surface pairs use UI values/imperative browser updates during manipulation, committing only at transaction boundaries.

## Review and direction

Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0; Impeccable Operate; RN/SVG/gesture/Ponytail guidance. User has already directed execution and pinned the visual language, so no new visual-direction approval flow.

Product: precise workspace for independent projects, tasks, schedules and release gates.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: linked WBS, annotated roadmap and meaningful relationships.
Signature: user-selected accent and dependency/status colors.

Before audit in required order: spacing/theme/icons/type are established and stay; WBS has four competing top tabs and will become Outline | Diagram; copy must distinguish local private/live/snapshot/unavailable; Canvas needs a project library before a heavy editor; keep compact mobile controls and accessible alternate actions; project content supplies visuals; only direct manipulation needs motion. The owner's latest correction makes all three diagrams initially 100%, with Fit explicit, including full screen.

Direction contract: existing task-focused shell, neutral work surface, bounded source picker and context inspector. Phone first viewport uses the shared centered Canvas-only title and a concise floating pill; library starts with search and create, then actual boards. Signature interaction: rearrange a live task/diagram while its canonical dates and hierarchy stay fixed. Preserve light/dark, system fonts and 48-unit native actions. No third-party art or new dependencies.

## Execution gates

A. Foundation first: schema/commands/permissions/revisions/backups and deterministic tests.
B. WBS tabs/default zoom; library/board editing/gesture modes; local autosave/retry and undo.
C. Canonical sources, Add to Canvas, diagrams/roadmaps, comments, snapshots and complete exports.
D. Source/negative-path/import/gesture tests, full npm test, JSX/worklet transforms, Expo compatibility and bounded headless Chromium source screenshots. No app server or builds.

Sharing is disabled, with explicit UI explanation; no client grant is treated as server authorization. Real remote Viewer/Editor sharing is a release dependency requiring an independent Milvayo backend and product acceptance of deferral. Data rollback: export current workspace/board backups before returning to older code, whose normalization does not preserve the new Canvas field. Do not reset or clear user storage.

## Owner refinements during implementation

The owner independently confirms the export accessibility crash and the initial squeezed Tree repair are fixed, with Tree opening at 100%. Canvas is explicitly mobile-first: replace the multi-row tool strip with one Add / mode / Edit / Tools row; move view, arrangement, clipboard and inventories into menus. S-curve / straight / elbow connectors get geometry-based double-tap/double-click editing, label/style changes and explicit delete; elements get double-edit and delete with undo. Accessible menu equivalents remain available. Preserve the five-line direction and existing neutral tokens.

Source review found Android's existing workspace row budget below 2 MB. Canvas transactions therefore preserve 1.4 MiB live-workspace headroom, count UTF-8, and reject growth before mutation. Archived deletion is atomic with a retained pre-delete recovery snapshot; if that snapshot cannot fit, deletion is refused. No existing backup check is weakened.


## Header and connector crash correction

Workflow: open a Canvas, read its title, select an object, drag its connector dot.
Before audit: spacing — asymmetric header controls offset the title; color — preserve tokens; icons — preserve chevron/zoom; copy — Canvas title only; typography — preserve 18/600 and one-line truncation; layout — use equal measured side slots; details — retain zoom and accessible back; visuals — no new artwork; motion — preserve direct line preview.
The five-line product direction above still applies. Compiled native worklet inspection reproduces an undefined connectorPath capture in connectionPreview. Define dependencies first and execute compiled closure code in regression tests, including nested preview/resize helpers. This is source/runtime simulation, not physical Hermes acceptance.

## Direct editing and remaining menu refinement

Owner confirms connector dragging now works on-device. For the remaining pill menus: spacing — replace button walls with consistent 52-unit rows and separated groups; color — idle pill background needs visibly lower alpha while icons remain readable; icons — keep Feather and meaningful checked state; copy — short names plus supporting details; typography — existing 14/12 menu scale; layout — separate content editing from arrangement, diagrams and appearance; details — double-tap edits a local note or local diagram node in place, outside tap/blur saves once and Escape preserves prior text; visuals — preserve scene geometry; motion — dim only the pill material after inactivity, respect reduced motion and cleanup.
Product/character/world/moments/signature remain the same five lines above. Local editing never mutates linked canonical sources. All undo/persistence/import constraints remain.


## Final scope refinements

Hide mobile app navigation only inside an open board; the Canvas library keeps it. Drawing gets brush width/color and a stroke eraser with undo. Double-tap edits text inside the note/local diagram node after viewport focus, with isolated input state. Use faint diagram outlines, fit container geometry on layout changes, and choose clear connections across all four faces. Routes/picking share immutable geometry, distant moves reuse paths, and worklets receive only numeric interaction data.
The global audit also repairs the root-synthesis WBS boundary round trip, prevents drawing-heavy backups from exceeding their own import guard, preserves cross-project snapshot origins, bounds undo bytes and removes confirmed unused named imports. See AUDIT.md for evidence. No new dependency, backend, build, server or 0.8.0 commit.

Final audit verification preserves the original root-synthesis WBS input without truncating a work element, uses compact board backups for import-budget round trips, retains source origin on snapshot import and checks gesture tool mode before hidden dot/double-edit actions. Runtime acceptance remains separate from source checks. The old shimmer prerequisite and Canvas are separate version checkpoints as requested.


## Owner-authorized Git checkpoint

The original no-commit execution scope above was superseded by the owner’s explicit instruction: “commit and push to work v 0.8.0”. Commit the verified 0.8.0 source, tests, QA and usage documentation and push only to origin/work. Do not tag, build, deploy or merge to main. Remaining physical and secure-sharing checks keep their recorded status. Leave unrelated local ZIP changes and untouched prerequisite handoff inputs outside the commit.
