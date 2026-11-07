# 0.7.13 engineering report

## Findings and implementation

The invalid native status role was still present in DiagramExports success feedback and is repaired with a platform-specific polite live region. Success, error, duplicate taps and cancellation are exercised through actual component handlers with platform API mocks.

Native pan/pinch already avoided React updates per frame. Installed Android SVG source shows viewBox changes redraw the scene; GroupView skips display=none children. Top Down creates more text primitives than Left to right. Tree geometry now includes spatial node batches; native group display follows the camera on the UI runtime. Edges remain drawn underneath nodes to keep long connectors continuous. No geometry or JSX regeneration is introduced during gestures. Display is used instead of opacity because this SVG version allocates extra bitmaps for group opacity. This is a source-supported optimization, not a verified diagnosis of the owner's device stutter.

Full-screen orientation uses PmWbs's existing direction and scene cache, fits on change, and keeps export/close/inspection/pan alternatives. Other diagram types have no orientation controls. Export serializes every original primitive, without view culling. Timeline files remain unchanged.

Native gestures record bounded count, maximum and >32ms sampled UI frame gaps, emitting only at gesture completion. This instrumentation supports a same-device comparison but does not measure native FPS.

## Evidence

`host-measurements.json` records 40/250-element scenes in both orientations, five openings each, actual cache counters and text eligible for native drawing at the recorded camera. It measures Node execution and modeled visibility only; no fabricated Android timings. Tests cover complete batch coverage, camera changes/overscan/Fit, 500 live UI pose updates without callbacks, cache invalidation, full-screen orientation, and native-safe feedback.

| Check | Result |
| --- | --- |
| Baseline suite | Pass — 875 tests |
| Focused camera/visibility/export tests | Pass — 12 tests |
| Full suite / syntax | Pass — 879 tests, 0 failures; all source JSX/import binding checks included |
| Native/worklet source transforms | Pass — camera, gesture and visibility module; no build |
| Expo Web development server | Started successfully in offline mode; DevTools helper reports EACCES; browser acceptance pending |
| Expo compatibility | Pass — dependencies up to date |
| Android 15 / Expo Go / Hermes, native rendering and exports | Not run — physical device unavailable |
| Controlled same-device FPS, p50/p95 interaction and memory | Not run |

Before audit and five-line direction: PLAN.md. Unslop credit: [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0. Preserve current Milvayo styling. Native SVG, gesture and Ponytail guidance informed display culling, stable geometry and targeted tests.

The owner's current request authorizes the 0.7.13 commit to `work`; device acceptance is still pending and no push/merge is performed. Update/reversal and the device checklist: `docs/instructions/release-0713.md`.
