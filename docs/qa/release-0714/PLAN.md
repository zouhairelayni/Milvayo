# 0.7.14 loading review and plan

Unslop review standard by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0. Keep the existing visual language.

Product: precise workspace for independent projects, tasks, schedules and release gates.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: Gantt geometry, Kanban task movement and verified progress.
Signature: selected accent and semantic dependency/status colors.

Before audit in required order: spacing uses existing card/row/column dimensions; neutral colors and icons stay; shell preparation text flashes on the first native visit; typography stays; layout needs four structure-specific placeholders; inert semantics and reduced motion need explicit handling; no decorative visuals; motion must stop when hidden. Only these defects are patched.

The shell already waits for local hydration, and render errors have their existing retry boundary. First heavy native preparation currently forces two animation frames; replace that timer gate with React interruptible transition scheduling. Ready web screens and retained pages render directly, with stable memoized content identity. No minimum loading duration. A pure readiness adapter distinguishes future snapshot loading, cached refresh, empty, offline and error states; it does not claim a network integration. Skeletons contain a fixed viewport sample, not all project tasks. One native UI-thread opacity animation and one Web Animation cover each mounted skeleton; static reduced-motion fallback, listener/animation cleanup, no per-frame setState.

No dependencies or data migration. Main workspace, work branch, separate user-authorized commit. Latest user constraints: no builds, no Expo server; only headless Chromium screenshots for visual checks. Runtime/Expo Go/Fast Refresh and native p50/p95 are Not run.
