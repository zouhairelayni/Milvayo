# 0.7.12 Projects diagrams — controlled implementation

Owner confirmed main source /mnt/Milvayo instead of the brief's absent redesign folder. Baseline 0.7.11 checkpoint: 074a734, committed and pushed only to work on explicit owner instruction. 0.7.12 may be committed/pushed only to work after checks. No builds, Gradle, EAS, Playwright or Metro restart. Preserve owner ZIP changes.

Before audit, in Unslop order: spacing — preserve shared rhythm and safe-area targets; color — existing neutrals and meaningful branch colors; icons — Feather Expand/close/zoom/download with accessible names; copy — distinguish WBS work elements from project tasks, report export dimensions and quality limits honestly; typography — reuse diagram labels and reveal full names in selection details; layout — full-screen canvas, compact header and responsive floating controls outside diagram gestures; details — preserve embedded pose, failed/cancelled exports, back dismissal and project isolation; visuals — original Tree/Fishbone/Mind map geometry; motion — viewport camera on UI runtime, existing reduced-motion-aware reveal, no per-frame React updates.

Product: a precise workspace for inspecting independent project structures.
Character: calm, exact, dependable.
World: quiet planning instruments.
Moments: readable hierarchy, connected work and direct diagram exploration.
Signature: Milvayo Board mark, selected accent and semantic branch colors.

Apply bundled Unslop by Damir Sokolovsky (CC BY 4.0), Impeccable Operate/polish/craft floor, Ponytail Audit's read-only tracing, UI UX Pro Max gesture/accessibility searches, Expo animation and Software Mansion/Callstack RN performance guidance. Preserve existing design and domain safeguards.

Findings to measure: PmWbs already computes only selected scene; useMemo retains only last selection, discarded on switch/unmount. Scene recreates all primitive elements. Native Svg uses entire scene size inside a transformed stage; installed native SVG creates bitmap at view size, potentially huge at device density. WBS is its own explicit governance hierarchy, not inferred from task titles. Owner/note affect inspection/CSV, not vector layout. Hours are shown only in top-down Tree. No normal render should serialize export files.

Implementation order: benchmark/instrument selected calculation and renderer; bounded project/workspace semantic-revision cache; bounded native viewport camera independent of Timeline; lazy selected drawing and retained view/pose; full-screen preview/inspection/accessible controls; demand-only whole-scene vector/CSV/PNG export with explicit pixel/side budget; model round-trip/cache/gesture/export regressions; full tests/source/worklet/dependency checks; lightweight Chromium visual review. Device/native timings and interactions remain owner acceptance, not claimed from source benchmarks.
