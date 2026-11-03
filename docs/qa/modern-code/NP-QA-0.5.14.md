# NP-QA-0.5.14

| Check | Result |
|---|---|
| Node tests | PASS: 447, zero failures |
| JS/JSX syntax of changed files | PASS (TypeScript parser) |
| Freeze/retention behavior in real React 19 (Chromium harness, not RN) | PASS: hidden 0 renders over edits and typing; show after edits 1 render with latest data; no-change switches 0 renders |
| Dependency compatibility (`npx expo install --check`) | NOT RUN (no dependency changes) |
| Android: tab switches after first visit, drag/resize after return, project switch | NOT RUN (needs device) |
| Android timings | NOT MEASURED |
| Web build and regression | NOT RUN (web policy unchanged and covered by source tests) |
