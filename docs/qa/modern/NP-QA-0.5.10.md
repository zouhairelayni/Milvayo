# NP-QA-0.5.10 — Audit evidence and limitations

Release checks are recorded in CHG-NP-0.5.10.md. Raw test, export, browser and benchmark results accompany this report under docs/qa/modern-code/v0.5.10-evidence/.

## CPU benchmark
Synthetic Node medians, seven runs, 2,000 tasks with time entries/comments; workspace edit includes five projects. These are not phone FPS or end-to-end latency guarantees.

| Operation | Baseline ms | Patched ms |
|---|---:|---:|
| Cost summary | 29.30 | 0.30 |
| Health summary | 51.11 | 2.00 |
| Task view | 72.45 | 1.52 |
| Workspace edit | 120.22 | 18.64 |

## UI review scope
The bundled Unslop skill by Damir Sokolovsky (CC BY 4.0) is the review standard. Existing visual language is preserved. Spacing, color, icons, copy, typography and layout were not redesigned; this patch targets rendering details, data validity and gesture cancellation. Browser screenshots were used internally, not included as deliverables.

Product: independent project planning workspace.
Character: calm, exact, dependable.
World: planning instruments and technical workbenches.
Moments: Gantt dependencies, Kanban movement and verified progress.
Signature: existing user-selected accent and meaningful status colors.

## Coverage and remaining work
Regression coverage includes burst saves, retryable failures, newest-write ordering, incremental normalization, indexed summaries, randomized interval routing, one-sided dates, 10,000-node dependency/critical-path chains, malformed WBS and editor identity checks. Some UI regressions are source assertions, not device interaction tests.

Browser smoke test uses Chromium emulation, not Android WebView or iOS Safari. Native exports establish compilation only. No native FPS, memory, battery, installed-build crash or OS lifecycle stress measurements were performed. Validate those on the user's actual devices before claiming production acceptance.

The unrelated project-source openproject-17.9.6.zip attachment was unavailable and was not used. This audit uses the supplied Niyarvo v0.5.9 source, so that attachment is not needed for these fixes.
