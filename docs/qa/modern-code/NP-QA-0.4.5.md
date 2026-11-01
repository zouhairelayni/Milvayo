# NP-QA-0.4.5 — Mock Board drag restoration device checklist

Source tests: **343/343 pass**. Runtime acceptance: **not run**. Test from the real v0.4.5 ZIP on Android/Expo Go first.

| Test | Expected behavior | Result |
|---|---|---|
| Enter Board, switch tabs and return 5 times | Stable render, no snap/reload/crash | Not run |
| Swipe vertically starting on a card immediately | Page scrolls; no card lifts | Not run |
| Swipe horizontally starting on a card immediately | Board strip scrolls; no card lifts | Not run |
| Hold a card without movement ~350ms | Card lifts only after hold | Not run |
| Move held card up/down/left/right | Follows pointer; insertion marker moves | Not run |
| Auto-scroll at strip edges | Offset compensates for board scrolling | Not run |
| Auto-scroll at page top/bottom | Offset compensates for page scrolling | Not run |
| Hold list header and drag left/right | Reorders lists; card areas don't start list drags | Not run |
| Cancel lift by quick scroll | No accidental drop/reorder or open | Not run |
| Tap card; double-tap title | Opens sheet; edits inline | Not run |
| Reorder/move tasks and relaunch | Saved task IDs, list/order/status persist | Not run |
| Timeline opens and controls still work | No new Timeline regression | Not run |
| Web / iOS | Same scrolling/drag behavior separately | Not run |

If snap/reload occurs, record exact steps, card count, device model, Expo Go SDK, full Metro output and (if possible) `adb logcat` with the native crash exception. A screenshot of the `SafeAreaView` deprecation warning alone will not explain a crash.

No dependency additions versus v0.4.4. Run `npm install` if dependencies are not installed, then `npm test` and `npx expo start --clear`.
