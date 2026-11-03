# NP-QA-0.5.8 — Web scrolling and rendering

- [ ] On desktop web, scroll Board vertically and horizontally with touchpad, mouse wheel and touch; no `ScrollView doesn't take rejection well` console errors.
- [ ] From a board card/list, normal swipes scroll rather than trigger a drag; stationary hold lifts only the intended card/list.
- [ ] Drag a task across lists, drag within the same list, and drag list headers. Verify card follows the pointer and destination persists after reload.
- [ ] Double-click task/list title to edit inline, single-click task to open sheet; save and verify all remain accessible.
- [ ] Open Timeline, scroll horizontally and vertically, test task bar move/resize and dependency links; SVG curves remain visible.
- [ ] Change Board → Tasks → Sprints → Timeline repeatedly. Hidden Board/Timeline should no longer accumulate hundreds of React renders while inactive; revisiting may require a fresh initial render.
- [ ] Re-run Settings → Diagnostics. New `Console errors and JS exceptions` counter is a log-call count, not a number of confirmed crashes. Compare counts after a fresh app run.
- [ ] Verify Android Expo Go native Board/Timeline scrolling and dragging unchanged.
- [ ] Verify desktop and mobile Dynamic Island notices still animate and remain clear of status bar/cutout.
- [ ] Back up your workspace before replacing source. Keep your original `package.json`, lockfile and `node_modules`.

**Not verified in this environment:** Actual browser rendering, drag gestures, frame rate, native device performance. Source regression tests are necessary but not sufficient.
