# NP-QA-0.5.13

| Check | Result |
|---|---|
| Node tests | PASS: 442, zero failures (8 new in tests/root-remount-0513.test.cjs) |
| JSX/JS syntax of changed files | PASS (TypeScript parser) |
| Dependency compatibility (`npx expo install --check`) | NOT RUN (no dependency changes) |
| Android first-open Timeline bounce resolved | NOT VERIFIED (needs device) |
| Root gesture warm-up on a physical device | NOT RUN |
| Board progressive mounting, drag/drop, auto-scroll | NOT RUN (logic unit-tested only) |
| Web build, browser regression | NOT RUN |
| Native performance gains | NOT MEASURED; prior numbers are dev-mode Expo Go |

Evidence for the diagnosis comes from the user's v0.5.12 Android trace and recording 542248.mp4 (Timeline renders → "Opening local workspace…" → Overview; `shell unmounted/mounted` with no navigation request, same run ID). The gesture-handler trigger is an inference; node_modules was unavailable.
