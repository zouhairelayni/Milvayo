# Milvayo v0.4.8 — Android / iOS / Web QA

**Status:** Pending device acceptance. Source-level tests only: 359/359 passed.

## Install (Termux)

```bash
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v0.4.8-TIMELINE-DIAGNOSTICS-QA.zip -d .
npm install
npx expo install --check
npm test
npx expo start --clear
```

## Acceptance checklist

- [ ] Overview remains stable and tabs can be switched repeatedly.
- [ ] Board opens without bouncing back to Overview, scrolls sideways/vertically from a task, respects stationary hold and pointer offsets; title double-tap and task tap work.
- [ ] Timeline opens without bouncing, has Days/Weeks/Months + Today together, Items on chart top-right and NO date/row pagination controls.
- [ ] All dated tasks can be reached by vertical scrolling; date range includes earliest/latest task; unscheduled tasks remain accessible.
- [ ] Timeline tasks can be opened, moved, resized and linked, dependencies persist, and performance stays acceptable on large fixtures.
- [ ] Sprint opens without useState exception; planned sprint creation/edit/start/finish/assignment and goal typography are correct.
- [ ] Settings -> Diagnostics -> Crash reports opens and shows screen/event context, with select/copy.
- [ ] Settings -> Diagnostics -> Performance monitor shows tab opens and render timings, with select/copy.
- [ ] Clear diagnostics asks confirmation, clears locally, and works after reopening Settings.
- [ ] No sensitive project content or credentials appear in exported report; inspect before sharing.
- [ ] A full Expo Go native process exit is not falsely marked as confirmed JS crash; Android native logs still needed.

## Reporting a failure

1. Open Settings -> Diagnostics -> Crash reports, tap Copy report.
2. Open Performance monitor, tap Copy report.
3. Include any Metro `ERROR` output and whether Expo Go exited or a React fallback screen appeared.
4. Include device platform and step sequence (e.g. Overview -> Board -> Timeline).

## Limitations

Metrics represent JavaScript render times and timer delays; no native FPS, memory heap, Crashlytics, ANR or device CPU profiler. Clipboard requires `expo-clipboard` installed by `npm install`.
