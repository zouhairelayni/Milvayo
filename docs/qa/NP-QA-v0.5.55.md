# NP-QA v0.5.55 — Backup Island, password UX and AMOLED

## Scope and source behavior

- Product: independent local-first Milvayo, single-user Expo SDK 58 Web/Android/iOS. This is a focused hotfix of notifications, Backup UX, and appearance. All planning data models, workspace keys, and `.niyav` backup bytes remain unchanged.
- Backup controller publishes a nonsecret, routeable `event` on protected encryption/decryption success, error, or cancellation. The global shell subscribes outside the Backup component, defers notifications received while OS AppState is backgrounded, and routes taps to the Backup tab in Settings. The completed ciphertext remains on disk only after successful encryption.
- Island takes its background from the active accent, follows button ink for contrast, and handles swiping sideways, pulling downward for longer text, and collapsing. Actionable backup notices remain until dismissed/opened; ordinary notices retain short timed dismissal and errors require dismissal.
- Wrong-password UX retains the selected encrypted file *in Backup screen memory* for quick retry after an incorrect password; the entered password is cleared at job start. Leaving the Backup screen while a password attempt is running still lets the job finish; if it fails after navigation, reselecting the file is required because encrypted picked-file bytes are not stored permanently. Wrong-password detection cannot be instantaneous for legacy PBKDF2 backups without weakening password guessing cost.
- AMOLED darkens card and secondary surfaces 80% by RGB component relative to Dark, dims accent fills, retains white readable text. Daylight Amber and Orange adjusted; other eight light/dark accent values untouched. Borders are intentionally subdued in AMOLED.

## Checks

- Node regression suite: **669 tests, 668 passed, 0 failed, 1 skipped** on edited source.
- TypeScript syntax parser for React Native JS/JSX and CommonJS: zero parse diagnostics (full source and tests checked).
- Backup-job unit tests: completed encrypted file, decrypted file, wrong-password error event, cancellation, selected-file retry, in-app route, no password/plaintext in notice state.
- Theme tests: ten accent palettes, minimum 4.5:1 button contrast, RGB dimming ~80% and pure black backgrounds.
- No dependencies added; package lock remains the v0.5.54 dependency graph with updated release version.

## Device acceptance still needed

1. On Android Expo Go, start encrypted export; leave Backup; confirm completion Island appears and tapping goes straight to Settings → Backup, where Download backup is available.
2. Repeat by switching to another app and returning. Do **not** assume completed work if Android terminated the process: inspect ready-file state.
3. Start decrypt with wrong password; watch progress, receive failure Island, try again on same selected file without another picker. Check correct password and restored data path separately.
4. Swipe Island left and right to dismiss, pull down to expand and again to read full text, tap to open Backup, swipe up to collapse. Repeat on Web/mobile portrait.
5. Review Daylight Amber and Orange and AMOLED surfaces/cards/buttons on actual device. Check labels and controls remain readable. Check both a newly created encrypted backup and an older legacy `.niyav` file can be opened.

**Not run:** actual Android/iOS UI rendering and swipes, performance timing of PBKDF2 on user's phone, guarantee of OS-level background processing, and Play Store build. Source checks are not device acceptance.
