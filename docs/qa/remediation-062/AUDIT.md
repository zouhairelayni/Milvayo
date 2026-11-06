# Before audit and controlled direction — 0.6.2 remediation

The 400-line user brief was read completely. Work remains on work; previous 0.6.2 edits and user data are preserved. No production/export/native builds, prebuilds, Git commits, tags, pushes or deployment. Browser checks use installed Chromium directly, not Playwright.

## Product direction

Product: a precise workspace for independent projects, tasks, schedules and release gates.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: a readable Gantt, controlled Kanban movement and evidence-based progress.
Signature: existing Milvayo Board mark and one user-selected accent with semantic dependency/status colors.

## Before audit (source findings; runtime confirmation tracked separately)

1. Spacing: inconsistent emphasis between 52/64px progress numerals, 11px metadata and 40px controls. Dense Board/Tasks tools compete with content; shared gutters exist and should stay consistent.
2. Color: established light/dark/AMOLED and ten accent choices are explicit user commitments. Preserve palettes; improve state surfaces/contrast through existing tokens. Do not adopt the off-topic UI UX Pro Max generated marketplace/conversion palette.
3. Icons: Timeline Zoom in/out are full text chips in a scrolling ribbon; replace with requested 18px SVG magnifiers in 44px hit areas at chart top-right. Keep the common icon language and Milvayo Board geometry.
4. Copy: long Timeline instructions dominate below the chart. Loading is silent behind an animation; provide an informative brand loading state. Actions should name their purpose; retain truthful local-only/security wording.
5. Typography: body text has no explicit line-height. A serif 64px KPI has more emphasis than the actionable project information. Date labels are geometrically scaled during pinch. Improve hierarchy; preserve legibility at 320px and desktop.
6. Layout: Timeline nests horizontal ScrollView inside a vertical Page without bounding the horizontal scroller height or setting flexShrink:0. Vertical virtualization uses global-window measurements and rejects zero-row windows, which can freeze a stale range. Enforce one vertical owner and explicit chart content extent; derive rows from owner scroll/viewport.
7. Details: full dependency routing repeats when only the drawing window changes; date labels call Intl formatting on every render. Confirmed preset rebasing fix must survive. Add correlated input/first-frame/commit and visible-window diagnostics without claiming FPS.
8. Visuals: retain the chart, semantic line colors and existing brand. Refine important screens around task/action hierarchy, filter groups, project/portfolio summaries and accessible shared controls rather than installing a new visual identity.
9. Motion: 3700ms BoardMorph is a JS requestAnimationFrame state loop and delays mounting StoreProvider. Calendar/text sit in a scaleX preview container. Core Animated recursively walks a Reanimated gesture object supplied to its scroll wrapper. Keep live geometry tracking on the UI thread and counter-scale labels; keep gesture objects outside core Animated props. Strict logging stays enabled.

## Scope and validation

Phase A: direct Chromium development-session checks where the environment permits; report the supplied SVG exception as incomplete until a full exception can be reproduced. Distinguish development informational output from errors. Do not classify all 36 historical warnings without their messages.
Phase B: loading lifecycle, SVG compatibility, shared-value prop boundary, Timeline viewport/label/preset/zoom pipeline, deterministic geometry and CPU benchmarks.
Phase C: shared UI plus concrete Overview, Board, Tasks, Sprints, Projects, Programs, Portfolios, Settings/More improvements using existing design authority.
Phase D: pressed/focus/hover/reduced-motion, gesture/cancel and accessible controls.
Phase E: tests, syntax/worklet checks, dependency check, direct browser scenarios, final eight-part engineering report with Pass/Fail/Not run.

No project/import-format migration is planned. Native launcher code from the earlier patch remains subject to future Android acceptance; these tests do not compile it.

Skills: Impeccable (Operate refinement of established world), UI UX Pro Max (keyboard/drag alternatives and virtualization), Anthropic Frontend Design (specific task hierarchy, one visual system), Expo animation and Callstack/Software Mansion performance guidance. Unslop by Damir Sokolovsky, CC BY 4.0, used as the mandated review standard. UI UX Pro Max returned no relevant product-wide match after a narrower retry; existing Milvayo direction wins. Its react-native scrollview result and accessibility guidance were relevant.
