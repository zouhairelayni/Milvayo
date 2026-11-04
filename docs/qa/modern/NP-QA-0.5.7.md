# NP-QA-0.5.7 — Top Dynamic Island device checks

- [ ] On Android Expo Go, mark any test task complete. The floating pill starts near the **top**, directly below OS status icons, not over page search/filters.
- [ ] Its upper border stays below the status bar, including devices with camera cutouts or edge-to-edge drawing.
- [ ] The pill compactly appears, expands, contracts and dismisses without visual regression from 0.5.6.
- [ ] Expanded pill may temporarily overlap the app header, but text, X button and tap-to-expand/collapse remain usable.
- [ ] Repeat in light/dark mode, portrait/landscape and when the Android notification shade/status area changes.
- [ ] On iOS, the pill sits **below** the safe area for the notch/system Dynamic Island and never covers hardware/system content.
- [ ] On web desktop, the pill remains top-centered and properly bounded, no unexpected scroll shift.
- [ ] Repeated fast notifications do not leave stuck or stale messages.
- [ ] Errors persist until dismissed; successes collapse and auto-dismiss.
- [ ] Existing Board, Timeline and Tasks are otherwise unchanged; test a few tab transitions.

**Limit:** This is an in-app effect, not Apple’s actual system Dynamic Island/Live Activity or an Android system overlay.
