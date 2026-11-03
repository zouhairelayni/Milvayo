# NP-QA-0.3.2 — Web/Android Sprint Acceptance

**Prerequisite:** Export a full workspace JSON backup from the existing application. Before extraction run `git switch work` and `git status --short`, then checkpoint or preserve any local modifications. Nothing should be done on `main` until accepted.

## 1. Installation and compilation

```bash
cd ~/NiyarvoProjects
git switch work
git status --short
unzip -o ~/storage/downloads/NiyarvoProjects-v0.3.2-LOCAL-QA.zip -d .
npm test
npx expo install --check
npx expo start
```

- [ ] `package.json` and Expo app display version `0.3.2`.
- [ ] All tests pass and Metro bundles Android in Expo Go and Web.
- [ ] No clipping at Android safe areas in portrait and landscape.
- [ ] Niyarvo logo and ten accent options still work, including persistent orange default.

## 2. Functional sprint checks

- [ ] Mobile bottom nav and sidebar contain **Sprints**. Automations remains available via navigation menu.
- [ ] Create a sprint with goal and dates; invalid date or >90-day span shows a helpful error.
- [ ] Assign two unfinished tasks and one Done task; existing statuses stay unchanged.
- [ ] Assign a task to a second sprint, confirm it is removed from the first.
- [ ] Start sprint. Attempt to start a second concurrently and confirm rejection.
- [ ] Move an assigned task to Done from Kanban. Return to Sprints; remaining count and burndown update.
- [ ] Use Tasks bulk status edit on assigned work; recorded counts update.
- [ ] Unrelated description edit does **not** append fake progress events.
- [ ] Add or remove task during active sprint; total and remaining update correctly.
- [ ] Finish sprint: requires confirmation; final history persists; unfinished tasks are unassigned and keep original statuses; recovery snapshot exists.
- [ ] Reopen completed sprint and check summary, graph, goal, scope and dates.
- [ ] Completed sprint rejects task assignment; active sprint rejects deletion; planned sprint deletion works with snapshot.
- [ ] Export/import project and workspace JSON, restart app, verify sprint status/history; restore snapshot and verify data.

## 3. Regression and release gates

- [ ] Kanban full-card long-press drag and horizontal edge auto-scroll.
- [ ] Gantt pinch zoom, date shift, resize, direct dependencies, link removal, schedule preview/apply.
- [ ] Task types, custom fields, workflow transition restrictions, verification and release gates.
- [ ] Project switch, archive/restore, backups and JSON transfer.
- [ ] Device performance with 500 tasks and at least 20 sprint members is usable; no unbounded rendering beyond backlog list limits.

## 4. Not included

Firebase, team permissions/authentication, cross-device sync, sprint points, velocity prediction, capacity management, retrospectives and historical data imports. Do not treat source tests as proof of those functions.
