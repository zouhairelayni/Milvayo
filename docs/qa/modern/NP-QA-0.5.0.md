# NP 0.5.0 — Device acceptance checklist

**Do not merge to `main` before Android acceptance.**

- [ ] `npx expo-doctor`: all checks pass; locally installed `expo-font` remains declared.
- [ ] Open Timeline from Overview 5 times; Expo Go does not restart or snap away.
- [ ] Task bars display on today and when scrolling horizontally through all dates.
- [ ] Dashed Today line displays and stays aligned with the date header.
- [ ] Dependency curves render when both tasks are visible and when a link crosses from an offscreen row; no giant SVG/native view.
- [ ] Long vertical scroll reaches all scheduled tasks; there are no row pagination buttons.
- [ ] Horizontal scrolling across bars works without opening or dragging a task accidentally.
- [ ] Quick tap bar opens task sheet; long press moves it; left/right handles resize; dot links to another task.
- [ ] Finger movements/scrolls do not lead to `Cannot record touch end without a touch start`. If they do, capture the exact interaction and full Metro output.
- [ ] No crashes after 30 seconds on Timeline and several screen switches.
- [ ] Settings → Diagnostics: copy latest performance/crash reports and compare Timeline render counts, JS stalls, warnings.
- [ ] Board still opens and behaves no worse than v0.4.9; its lag is tracked separately, not solved here.
- [ ] Existing tasks, dependencies, dates, sprints and backup round trips unchanged.

## Termux

```sh
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v0.5.0-TIMELINE-SVG-TOUCH-QA.zip -d .
npm test
npx expo-doctor
npx expo start --clear
```

**Native runtime acceptance: pending.**
