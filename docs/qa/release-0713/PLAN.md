# 0.7.13 scope and review

Review standard: Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0. Preserve Milvayo's existing Niyarvo-derived design.

Product: precise workspace for independent projects, tasks, schedules and release gates.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: readable WBS diagrams, task movement and verified progress.
Signature: user-selected accent and meaningful dependency/status colors.

Before audit (spacing → color → icons → copy → typography → layout → details → visuals → motion): existing spacing, neutral theme, shared icons and typography are retained; export success uses an Android-invalid role; full-screen Tree lacks its embedded orientation control; cached SVG geometry is stable but Android redraw traverses all offscreen primitives on camera changes. No unrelated visual redesign.

Controlled patch: spatially batch Tree vectors for native offscreen display culling; retain all vectors, cache keys, hit testing, complete exports and existing camera/Timeline code. Add the shared orientation state to full screen with Fit on switch. Repair export feedback semantics. Test pure visibility boundaries, all primitive coverage, camera changes, orientation changes and success/failure/cancellation feedback.

Source evidence: installed react-native-svg Android SvgView.drawChildren visits the scene on viewBox changes; GroupView.drawGroup skips children with display=none. Top Down uses multiple text nodes per work element versus one in Left to Right. This supports a draw-work reduction, not a proven device diagnosis or FPS result. Physical Android comparison remains required.

No storage migration or dependency additions. Update in place on work, preserve unrelated ZIP changes. The user's current request explicitly authorizes separate 0.7.13/0.7.14 commits and later uncommitted 0.8.0 implementation; it supersedes the handoffs' wait-for-commit gate. No push or main merge is authorized.
