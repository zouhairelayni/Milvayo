# Canvas 2.2 stability repair — 0.8.3

Baseline: uncommitted 0.8.2 on `work`, local HEAD 0676538. Preserve those changes and unrelated handoff/ZIP state. A pre-edit source/test/version snapshot is at `/tmp/milvayo-083-before` for this session. No commit/push, dependency/Metro change or schema migration.

User recording `550385.mp4` is not present in the repository. Treat the handoff observations as bug reports, not frame-time measurements.

## Before audit (Canvas drag/edit/group/control workflows)

1. Spacing: dock/selection strip are compact; preserve. Complex Sheet bodies have unrelated 20-unit gaps and large modal headers; use the existing rectangular popover with bounded content.
2. Color: keep current neutral themes/accent, remove modal dimming from Canvas configuration.
3. Icons: retain Feather, 48-unit accessible targets; keep one five-tool dock.
4. Copy: preserve source/save errors and export feedback. Give multi-select a discoverable direct Select action.
5. Typography: preserve existing system scale; no decorative restyle.
6. Layout: one Canvas popover architecture for simple and complex sections, above the relevant dock/context strip, constrained by visible viewport/keyboard.
7. Details: trace release→React→native transform handoff; no clearing an in-flight preview on unrelated revisions. Guard inline text conflicts. Enforce group membership/resize invariants.
8. Visuals: keep original scene renderers; distinguish custom connectors from WBS internals. Cull offscreen content without removing endpoint geometry.
9. Motion: no new animations. Keep continuous transforms on UI/native or direct DOM, commit once per gesture.

Product: a project-linked visual planning workspace.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: connected work and readable diagrams under direct manipulation.
Signature: chosen accent and meaningful dependency/status colors.

Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0, used as a review standard. Impeccable/Frontend Design preserve the existing Operate surface. Ponytail audit/review trace connected callers and eliminate redundant sheets. RN gesture/animation/performance guidance prioritizes authoritative geometry, bounded work and measured changes; UI UX Pro Max informs discoverability and safe anchored controls.

## Confirmed source findings before editing

- Native surface resets `drag` on every board revision; per-object animated closures can still hold old coordinates during that reset. Also previewBox adds delta to whichever props happen to arrive, allowing double application during handoff. Need delayed-commit/revision-interleave reproductions.
- Custom S-curve currently runs bounded obstacle search across the whole board; exhaustion returns an empty path. Depending on route length, the same `curve` style becomes a cubic, rounded elbow, or line. Deterministic style-specific geometry is required.
- Every surface/CanvasDrawing rerender rebuilds the entire route list; model normalization retains object identities, so investigate/correct the rendering/routing ownership rather than replacing working model normalization.
- Frame resize changes only the frame; descendants and their connectors stay put. Group creation allows reparenting nested members without coherent invariants. Keep absolute world coordinates; add atomic, validated group operations.
- Inline editor overlays the surface but does not explicitly disable underlying gestures. Text target lacks a baseline value for conflict checking.
- Sources, layout, object properties, comments, exports and options still use Sheet despite the requested single popover requirement.

## Order and evidence

Capture identical 0/25/100/250/500 mixed-scene host baselines before changing source. Reproduce release handoff and missing-route failures, then fix transforms, routing costs/cache/culling, connector continuity, edit/group invariants, and only then popovers. Add deterministic regressions and full tests, source/worklet/dependency checks, headless complete-screen screenshots. Native FPS/heap/IME/Expo Go/Fast Refresh remain Not run under the explicit handoff restrictions. Stop agent capture processes and preserve existing user servers. Document reversible update and all remaining physical gates.

## Owner refinements incorporated during execution

The final owner directions supersede the original five-tool inventory: four dock tools; one Objects/View/Comments row; direct line selection with adjacent delete confirmation; SVG line controls and persisted/random line colors; SVG-only pan row; Tree import/layout to the right; vector roadmap milestones; colored comment dots/chat/zoom reveal; and direct Objects→actions with nested Back. The reported native Reanimated dependency warning was traced to the new camera reaction's third argument and corrected at that call. These are owner-authorized scope changes, not a new visual redesign.
