# Milvayo 0.4.9 — device acceptance

Candidate only. Mark each item on actual Android Expo Go as PASS / FAIL and copy the Settings diagnostic reports if it fails.

1. Dependency sanity: confirm `package.json` still contains your local `expo-font` fix. Run `npx expo-doctor`; aim 20/20.
2. Tap Timeline. Does Expo Go remain open, or does it relaunch/return to Overview?
3. Leave Timeline open for at least 30 seconds. Repeat opening twice and after visiting Sprints/Settings/Board.
4. Swipe horizontally from inside chart (empty area and on a task), and vertically through every scheduled task without manual row navigation.
5. Change Days, Weeks, Months and tap Today. Dates and items remain accessible.
6. Toggle Items at chart upper-right. Names line up with bars.
7. Tap a bar: task sheet opens. Hold and drag a bar: moves date. Hold edge: resizes. Hold dot: create dependency; tap a curve: remove dependency. Persistence after app restart.
8. Extreme-date project: dated tasks years apart must still be reachable; bars must not create blank, enormous gesture surfaces or crash.
9. Record new performance report and compare Timeline renders to 301–436ms baseline. Report must label native crash suspicion separately from confirmed JS exceptions.
10. Board remains a known separate performance problem: before this patch 831ms render and 2083ms transition were observed. Do not claim improvement without measurement.

If Expo Go still terminates without JavaScript exceptions, get an Android native logcat `FATAL EXCEPTION`, `OutOfMemoryError`, `SIGABRT`, `lowmemorykiller`, or ANR excerpt. Avoid sharing raw project data or credentials.
