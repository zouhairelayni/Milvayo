# Startup and Projects repair plan — 0.7.9

Scope: main source on `work`, per the owner’s subsequent workspace correction. Temporary source copy removed. No builds, Playwright, commits, pushes, dependency additions or data migration. Preserve the owner’s deleted tour ZIP and untracked 0.7.9 ZIP.

## Before audit (Unslop order)

- Spacing: project card internal 20px rhythm is coherent; preserve it. Narrow budget/action rows compete for width.
- Color: preserve the neutral Dark/AMOLED and selected accent, semantic colors and contrast roles.
- Icons: preserve Feather and approved Board geometry; retain the owner-requested N-to-Board brand transition.
- Copy: project actions remain named; performance reports must distinguish React duration from wall-time commit estimates.
- Typography: preserve hierarchy, scalable text and tabular data. Allow long project names and budget amounts to wrap.
- Layout: Projects eagerly mounts up to 20 detailed cards inside a ScrollView; bound initial native work and virtualize. Preserve web and embedded manager workflows.
- Details: release React disables standard Profiler callbacks, leaving an unexplained empty report. Preserve the real Profiler and add explicitly labelled production commit estimates.
- Visuals: preserve real progress/budget graphics and empty artwork; no theme replacement or new decoration.
- Motion: 3700ms playback plus a forced 1000ms hold delays shell mounting; long initial still/ease phases can appear frozen. Start native motion after layout, shorten cold-only choreography, remove the extra hold, and record actual lifecycle milestones. Keep all Timeline gestures unchanged.

## Five-line direction

Product: an independent project workspace that opens promptly and stays responsive on Android.
Character: calm, exact, dependable.
World: quiet planning instruments and workbenches.
Moments: the continuous startup morph and meaningful project progress.
Signature: the existing Board mark in the selected accent, with truthful timing evidence.

## Skills actively applied

Ponytail Audit is the read-only diagnostic pass; implementation follows its ranked findings. Impeccable audit/optimize/adapt/polish guides the scoped UI correction, with Unslop by Damir Sokolovsky (CC BY 4.0) retained. Expo animation plus Software Mansion SVG/animations guides layout-ready UI-thread playback, worklet closure size and cancellation. Callstack React Native performance guides baseline/optimize/re-measure; UI/UX Pro Max returned mobile touch target/spacing and React Native virtualization guidance. Installed Reanimated 4.7.1 is the implementation authority. No named skill substitution.

## Controlled phases

1. Capture baseline source, CPU/render evidence and narrow Projects visual fixtures. Separate owner device observations from local measurements.
2. Repair startup gating and native morph lifecycle; instrument hydration, readiness, layout, UI playback, shell commit and first-frame estimates. Preserve slow/faulted storage and reduced motion.
3. Reduce Projects initial native mounting and retain editor drafts through virtualization. Keep web layout and all project actions intact. Adjust narrow control placement and touch targets only where observed.
4. Restore production screen commit counts/timing alongside real React Profiler data; bound diagnostic work and label missing/estimated evidence.
5. Run full tests, JSX/worklet source transforms, Expo dependency check, before/after CPU/source-render checks and lightweight Chromium captures. Device verification is Not run; owner checks Android.

## Evidence limits

No device is attached. React DOM/source fixtures, synthetic workloads and clock-controlled tests do not measure Android startup, native FPS, OS launch, native mounting latency or real Projects timer stalls. Add instrumentation so the owner’s next report supplies those measurements. Do not claim a guaranteed Android stall reduction from synthetic results.

## Owner addition: Board lists (during implementation)

Before audit: preserve card spacing/color/icons/copy/type and existing lift hierarchy. Replace the ten-card/Show more workflow with five initial cards per list and bounded vertical list scrolling. Additional batches mount only after user-originated scroll; no timer/idle growth. Use native nested scrolling and cancel pending holds on scroll. Keep loaded responders/editor state mounted, retain the complete logical task order, account for per-list scroll in hit testing, and auto-scroll the target list during a held drag. This is demand mounting, not an assertion that previously visited cards are always recycled. Preserve Timeline gesture implementations unchanged.
