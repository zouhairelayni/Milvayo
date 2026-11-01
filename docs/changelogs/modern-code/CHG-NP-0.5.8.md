# CHG-NP-0.5.8 — Web scroll arbitration and offscreen rendering

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | `NiyarvoProjects-v0.5.7-ISLAND-TOP-SAFEAREA.zip` |
| Release | `0.5.8` — web performance/gesture QA hotfix |
| Reported issue | Web `ScrollView doesn't take rejection well - scrolls anyway`; 126 console error calls, 850 Board renders, 410 Timeline renders within one run |
| Confirmed JS exceptions | 0 in supplied report |
| Source status | Tests and parser passed; browser/device runtime not verified |
| Dependencies | No new packages; `package.json`, `package-lock.json`, `node_modules` excluded |

## 1. Diagnosed causes

1. `src/gesture.js` used an eager `PanResponder` claiming contacts on pointer-down. On web this can compete with nested ScrollView touch/scroll handling, causing responder rejection warnings. `src/diagnostics/monitor.js` merely captured the resulting console messages; it was not the failure origin.
2. `ModernApp.js` kept heavy `Board` and `Timeline` mounted in hidden web tabs, so the screens continued React rendering and subscribed to workspace updates offscreen. The user's numbers strongly suggest avoidable work, but are not enough to measure exact time savings.
3. The previous diagnostic heading `JS errors` counted intercepted `console.error` calls as well as actual captured exceptions. It has been relabeled to avoid suggesting 126 crashes.

## 2. Changes

- **Added** `src/gesture.web.js`, an explicit web-only pointer-based stationary-hold gesture. Normal swipes do not claim a React Native responder; pointer movement past 8px cancels a pending hold. After the hold, document-level pointer handlers maintain drag offset including scrolling. Pointer cancel drops without persisting a move. List/card nested starts do not both claim the same pointer.
- **Preserved** `src/gesture.native.js`, `src/boardGesture.native.js`, `src/gestureSurface.native.js` and original Android/iOS gesture implementations. No native animation or layout changes.
- **Removed** `disableScrollViewPanResponder` from ordinary Board and Timeline scroll views. React Native documentation warns against using this prop for ordinary scrolling.
- **Updated** hidden-tab retention: Board and Timeline now unmount when inactive on web (already the policy for native), instead of continuing expensive hidden updates. This trades a possible remount cost on revisiting for lower background work/memory.
- **Updated** `src/diagnostics/core.cjs` report wording to `Console errors and JS exceptions`, and version 0.5.8 in `app.json` and `monitor.js`.
- **Added** regression tests `tests/web-scroll-stability-058.test.cjs`; adapted older source contracts to new web scroll handling.

## 3. Tests and limitations

- `node --test tests/*.test.cjs` — **408/408 passed**.
- TypeScript parser (JS/JSX mode) over 122 source/test files — **0 syntax errors**.
- Browser pointer event and scroll smoothness cannot be demonstrated via source-only tests. Android/iOS startup, Android scroll/drag, and web runtime are **not verified**.
- The user reported 126 console error calls but only one error message was supplied. Do not claim all other errors are resolved without a new full console log if any remain.

## 4. Acceptance and release

See `docs/qa/modern-code/NP-QA-0.5.8.md` for browser/mobile acceptance. Keep on `work` pending tests. No Git operations or deployment performed.
