# Functional migration map — v0.4.1 → v0.5.1

The audit of v0.5.0 listed 39 feature/workflow and regression entries. In v0.5.1, the former ClassicApp screen is **removed**, not retained as a fallback. The following formerly legacy-only feature categories have modern UI routes and domain-model operations:

- Project create/edit/archive/restore/delete/template; portfolio membership and health.
- Board, cards, saved board views, Power-Ups and GitHub reference URLs (local references only).
- Task hierarchy, subtasks, type/field configuration, progress/effort validation, tests/verification, safe duplicate/delete, saved task views and bulk status.
- Project calendars, typed dependency links and lag, preview-and-apply scheduling, unscheduled tasks.
- Sprint lifecycle, scope/burndown, pre-destructive snapshots, release creation/edit/deletion and gated status changes.
- Resources/contributors, local time logs, budget, cost summaries and CSV; local comments/reminders; automation commands/triggers.
- Imported specification metadata; workspace export/restore with portfolio and activity context, plus snapshots and diagnostics.

**Code-level verification:** The modern UI imports screens in `ModernApp.js`. Each action uses `src/store.js` and the original domain modules in `src/*.cjs`; `src/modernBridge.cjs` maintains the original schema. The same AsyncStorage key and project format are maintained.

**Known unfinished acceptance (not silently represented as migrated):**

1. Android Timeline SVG flicker after initial layout was reported on v0.5.0. Initial Today auto-scroll has been removed in v0.5.1, but Expo Go still needs verification.
2. Board's ~500–800ms React render and ~1.4–2.1s navigation delay, and touch drag/scroll fidelity, remain measured performance/UX issues; v0.5.1 has not proven a fix.
3. Native process-level crashes, iOS physical gestures and Web bundle are not covered by Node tests alone.
4. Cloud sync, remote collaborative accounts, push reminders, and authenticated GitHub operations are prospective features, not migrated code from v0.4.1.

The documented historical source archives in `docs/legacy-code/` are not a second app. The old UI modules have been removed. Keep tests for deterministic legacy domain math even when its old screens are absent.
