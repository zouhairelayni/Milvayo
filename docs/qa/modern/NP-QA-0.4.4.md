# Milvayo v0.4.4 — Expo Go acceptance checklist

**Candidate:** `v0.4.4-ANDROID-GESTURE-HOTFIX`  
**Status:** Not run on device. All checks below are pending.

## Preflight

- [ ] Save/commit local modifications; export the current workspace backup before extraction.
- [ ] Extract to `~/Milvayo`, remove the **old** package lock, run `npm install`.
- [ ] Check `npm ls react-native-reanimated react-native-worklets react-native-gesture-handler` and `npx expo install --check`.
- [ ] Run `npm test` (release source baseline: 339/339 passed).
- [ ] Launch `npx expo start --clear` and open Expo Go on Android.

## Android (must pass before merge)

- [ ] Open Kanban on a real populated workspace. No freeze or red screen.
- [ ] Tap a card: task sheet opens, inline editors expand without moving/overlapping other controls.
- [ ] Long-press and drag a card inside its column; it lands where indicated and stays after reload.
- [ ] Long-press and drag a card to another column; the list/status persists.
- [ ] Hold a list header and reorder columns. List order persists after reload.
- [ ] Drag cancellation (back/navigate/interruption) releases scroll lock; card and list remain usable.
- [ ] Can scroll horizontally and vertically normally without a long-press.
- [ ] Open Timeline. There is no `Property 'Platform' doesn't exist` error.
- [ ] Timeline does not freeze or force-close Expo Go.
- [ ] Timeline tap opens correct task; drag move changes dates; drag edges resize; link handle works.
- [ ] Page Timeline rows/date windows; no giant empty SVG, clipping error or missing saved tasks.
- [ ] No Worklets serialization warning containing `WorkletEventHandler`.
- [ ] MockDesign board, task sheet, timeline margins and card geometry look unchanged.

## Other platforms

- [ ] iOS Expo Go: repeat drag, scroll, task-sheet, timeline and navigation checks (not tested here).
- [ ] Expo Web: board/list moves, task sheet and timeline unaffected by native-only changes.

## Issue report if any check fails

Record the device, Expo Go build, the precise action, first red error, surrounding warnings, and whether it reproduces with a fresh workspace. Do not delete the workspace just to troubleshoot. Attach logs to the next handoff.
