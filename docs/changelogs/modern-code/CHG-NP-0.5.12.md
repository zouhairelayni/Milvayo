# CHG-NP-0.5.12 — Queued tab navigation and native Board mounting

## Baseline and evidence
Based on delivered v0.5.11. User reports first-open Timeline → Overview bounce still occurs on Android. Supplied recent traces identify bottom-tab requests, including several processed within 1–4 ms after long stalls. They do not retain the initial bounce. Zero recorded JS exceptions does not prove absence of native failure. No confirmed root cause for the first-open bounce is claimed.

User-device render averages: Board 131 ms and Tasks 76 ms versus prior supplied 387 ms and 284 ms. These are separate sessions, not controlled benchmarks. Current Android Board cold renders still reach 627 ms. Web Timeline trace contains 34 scheduled tasks, Android 66; direct performance ratios are not meaningful.

## Changes
- Bottom-tab navigation uses a latest-selection queue drained once per animation frame. A burst of queued selections mounts only its final destination. Menu/screen navigation and shell unmount cancel pending tab work. Same-screen requests remain no-ops.
- Tightened tab press retention to the button bounds. Logs include input-down/up timestamps alongside committed navigation to distinguish touch timing from JS processing timing.
- Native Board initially mounts the first two columns. Subsequent columns mount as their horizontal position approaches the viewport. Visited columns remain mounted for the lifetime of the screen; active gestures and title editors are not discarded. Auto-scroll reveals and measures new drop targets after mounting. Web rendering is unchanged.
- Startup diagnostics pin the first 40 events separately from the rolling latest 90. The first-open incident is no longer lost after later navigation.
- Slow events, navigation events and exception counts now belong to the current run. Previous-run exception details remain separately labelled; previous slow timings are not mixed into current reports.
- Version updated to 0.5.12; no dependency changes, data migrations, commits, pushes, deployments, APK or IPA builds.

## Remaining limits
First-open Timeline bounce on physical Android: **not verified resolved**. Native column mounting, cross-column drag/auto-scroll, screen-reader traversal and frame timings require device acceptance. Board columns still mount all their cards when revealed; this is lazy column mounting, not complete card virtualization. Visiting every column eventually retains all cards until leaving Board. A large first column can still be expensive.

## Install and rollback
Back up the workspace. Extract the project-root ZIP into ~/Niyarvo, preserving local package files. No npm ci needed. Run npx expo start -c for Metro; rebuild through the user's normal process for an installed APK. Roll back by restoring v0.5.11 source without clearing app storage.

## Acceptance sequence
1. Fully reload, then open Timeline once. If it returns to Overview, export diagnostics; the startup section must be included.
2. Rapidly select several tabs and confirm the final requested screen stays active.
3. Open Board, scroll across every column, drag within and across columns, exercise edge auto-scroll and cancel. Verify saved ordering after reload.
4. Compare Android performance on the same workspace and build mode.

## Review direction
Existing Unslop standard by Damir Sokolovsky, CC BY 4.0. Product: independent planning workspace. Character: calm, exact, dependable. World: technical workbench. Moments: Kanban and Gantt. Signature: existing accent/status colors. Before-audit: spacing, color, icons, copy, typography and layout preserved; observed defects are work scheduled during navigation and expensive native mounting. No decorative redesign.

See NP-QA-0.5.12.md for observed checks and explicit untested items.
