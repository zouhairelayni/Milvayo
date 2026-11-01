# NP-QA-0.5.6 — Dynamic Island-style notifications (device acceptance)

Release state: source-verified QA candidate. Run on Android Expo Go, iOS, and desktop web before merging to main.

- [ ] Open Tasks, mark a task Done. Pill appears **beneath the header** and below the Android/iOS system area.
- [ ] Compact confirmation morphs into full message then collapses and disappears automatically.
- [ ] Press compact pill; it expands without clipping. Press collapse handle; it compacts.
- [ ] Trigger a recoverable error; ensure it stays until explicitly dismissed.
- [ ] Test warning/info/success severity colors and long text. Dismiss button remains accessible.
- [ ] Rapidly trigger two notifications; observe correct newest text and no stale notice dismissal.
- [ ] Test dark and light appearance, portrait and landscape, iOS safe areas, and Android edge-to-edge status bar.
- [ ] Desktop web: pill centers near top and displays within window; controls work with mouse and keyboard.
- [ ] Confirm the five-tab navigation remains usable; no app crash, no gesture-handler warnings.
- [ ] Check Settings → Diagnostics after testing. Copy error/performance logs if problems occur.

**Known limitation:** These are app-rendered overlays, not system notifications when the app is closed, nor native system Dynamic Island Live Activities.
