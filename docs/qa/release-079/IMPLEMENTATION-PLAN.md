# 0.7.1–0.7.9 implementation brief

Scope: existing main application on `work`; no builds, Playwright, automatic commits or pushes. Final working version 0.7.9, cumulative history entries for all nine requests. No storage/import migration or new runtime dependencies.

## Before audit — spacing → color → icons → copy → typography → layout → details → visuals → motion

Spacing: preserve current shell and Settings spacing. Color: startup Board mark uses old ribbon ramps, rather than the resolved selected accent; icons have flat backgrounds. Icons: preserve approved Board geometry and launcher safe area. Copy: Settings unnecessarily names Android and Expo Go in the launcher prompt. Typography: existing native labels remain. Layout: preserve screens, retained tabs and sheets. Details: workspace hydration currently blocks children and cold start has no one-shot playback gate; navigation has no shared back history or browser integration. Visuals: derive gradients only from each palette’s substitute/background shades, with the primary color confined to the logo. Motion: play the existing morph once at cold start, wait one second after completion and workspace readiness, preserve reduced motion, and avoid new page-transition animations.

## Product direction

Product: a precise local-first workspace for independent projects.
Character: calm, exact, dependable.
World: quiet planning instruments and technical workbenches.
Moments: the once-per-cold-launch Board morph and existing planning diagrams.
Signature: the original Milvayo Board mark in the selected accent.

Review standard: Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0; preserve its attribution. Apply Software Mansion React Native / SVG / gesture guidance and animate-expo. Exact user requests authorize the scoped changes without a new design approval step.

## Controlled implementation

0.7.1: restore theme/workspace concurrently; show one cold-start overlay with the selected accent; use UI-thread native SVG morphing, a completion-driven one-second hold and cleanup. Release the overlay only after storage succeeds or the existing safe error screen is available. Never replay on navigation, theme changes or resume.

0.7.2: define deterministic 30-variant icon artwork from existing palette substitutes; primary accent is solid logo ink only. Generate complete iOS/PWA icons plus separate adaptive foreground/background layers and configure the installed plugin’s supported backgroundImage field. Keep icon alias identities and confirmed flush-before-apply behavior. Use platform-neutral restart copy.

0.7.3: add bounded per-workspace/project screen history; integrate Android system Back, iOS edge-swipe and web browser Back/Forward. Dismiss the active modal/tour before changing screens. Keep board, timeline, charts, calendars and date-rail gestures intact by restricting iOS detection to a narrow screen edge. Never navigate into another project’s history or an unavailable tool.

Validation: focused lifecycle/gesture/history/browser/asset tests, full Node suite, source/native worklet transforms, offline Expo compatibility, static icon inspection. Device gesture feel, native binaries and actual web/Expo runtime must be reported separately as Not run if unavailable.


0.7.4: preset changes explicitly center Today with the new day width, synchronize painted/calendar/native offsets and recompute focus after layout. Preserve pinch anchoring and task edit math.

0.7.5: add one Days/Weeks/Months pill row at the top of Timeline options using the shared preset handler; keep the popup in place.

0.7.6: remove screen-title text only from the top navigation header. Owner clarified that in-screen headings must remain: preserve shared ScreenIntro headings, Timeline Project schedule, descriptions, controls, popup titles and onboarding instructions.

0.7.7: remove List’s duplicate Add task action; keep bottom navigation creation and list filters/selection.

0.7.8: move New sprint into the horizontal sprint selector row; clear the header action and preserve sprint creation/edit validation.

0.7.9: restore the top island: expanded for three seconds, compact for three seconds, then dismiss. Keep explicit sticky notices, accessible full-message/Backup controls, reduced motion, and cancel stale timers on replacement/unmount.
