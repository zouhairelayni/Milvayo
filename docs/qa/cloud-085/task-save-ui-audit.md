# Task Save review

Review standard: bundled Unslop by Damir Sokolovsky, CC BY 4.0. The existing Niyarvo visual language is preserved.

Before audit, Task details → title/description → Planning & delivery:

- Spacing: existing controls and footer already use the shared kit; preserve.
- Color: neutral surfaces and user accent work; preserve.
- Icons: shared Feather controls; preserve.
- Copy: Done closes but gives no deliberate Save or acknowledgment; add Save and precise local/cloud state.
- Typography: existing hierarchy is readable; preserve.
- Layout: standard and advanced fields share TaskSheet; add one footer action, no header controls.
- Details: description lives only in React state until check/close; typed lazy fields can be lost on process termination before their debounce. Persist scoped drafts independently.
- Visuals: task content remains the focus; no artwork added.
- Motion: no new motion.

Product: a precise workspace for managing independent projects, tasks, schedules and release gates.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: task evidence and verified progress carry the detail.
Signature: one user-selected accent with meaningful dependency/status colors.

Scope: durable scoped text drafts, existing domain validation on commit, consolidated journal synchronization, accurate acknowledgment, and deliberate conflict resolution. No workspace schema migration; draft storage uses separate v1 keys. Revert code to return to prior behavior; retain draft/journal keys until recovered or deliberately deleted.

Single-writer gate before-audit: expected competing-tab exclusion reused a storage-corruption heading and suggested reverting the app. Preserve spacing/color/icons/type/layout/visuals/motion; change only copy to “Workspace open in another tab” and remove rollback advice for expected coordination failures. Unsupported Web Locks names browser coordination explicitly. The actual app two-tab behavior was accepted in Chromium; final copy is source-checked afterward.

After-review: inspected the recorded actual Expo Web task-sheet screenshot. The compact Save/Done footer remains visible, status copy sits quietly above task content, and existing neutral surfaces/type/controls are preserved. No decorative visual or motion was added. Later effort/controller and legacy-fallback fixes are covered by deterministic tests; full physical touch acceptance remains Not run.
