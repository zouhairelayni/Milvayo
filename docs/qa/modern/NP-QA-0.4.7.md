# NP-QA-0.4.7 — Android / iOS / Web acceptance

Status: **Manual verification not performed by the assistant.** Source tests only are green.

## Android priority

- [ ] Open and switch repeatedly: Overview → Board → Timeline → Tasks → Sprints → Board. Note first-visit vs repeat-visit delay. No snap/reload, blank frame, memory crash or stale project.
- [ ] Board: horizontal swipe from the *middle of a task card* scrolls to adjacent columns; vertical swipe from the card scrolls the screen without lifting the card.
- [ ] Board: a quick touch-and-release opens the task sheet; double-tap the task title edits inline; typing spaces and saving persists after restart.
- [ ] Board: hold still ~350 ms, then drag card within the list and across lists; card follows finger; after edge auto-scroll pointer offset remains correct; status, task ID, list and order persist.
- [ ] Board: hold list header to reorder; double-tap header title to rename; creating/deleting lists preserves hidden/filtered tasks and original styling.
- [ ] Board: scroll without dragging, rapidly change projects, then return. No accidental lift, jump or stale task mapping.
- [ ] Timeline still opens and renders. Test prior pinch/drag/resize/dependency interactions without new errors.

## Sprint life cycle

- [ ] Sprint goal is body copy (regular 14-point) rather than oversized heavy statistic. Description wraps without clipping; margins match the mock visual system.
- [ ] Create sprint with name/goal/start/end. Invalid name/date validation does not create a record. Reload and verify persistence.
- [ ] Edit a **planned** sprint's name/goal/dates; task assignments stay intact. Active/completed history cannot be edited.
- [ ] Create two planned sprints and select either. Assign/remove real tasks from the unscheduled backlog without altering status. Search and pagination work.
- [ ] Start a planned sprint. Starting a second while the first is active is blocked.
- [ ] Record task completion; inspect completion and real burndown. Finish the active sprint after confirmation. Verify immutable historical task scope and backlog return for unfinished work.
- [ ] Delete a planned sprint with confirmation. It unassigns tasks but does not delete the tasks. Completed/active sprints cannot be deleted.
- [ ] Back up workspace, close Expo Go, reopen; histories and all sprint records still persist. Test legacy Advanced workspace view against the same data.

## Performance and support evidence

- [ ] Note approximate first-open and repeat-open delays for each tab (avoid assuming 3-second lag is fixed).
- [ ] Observe app RAM/OS restarts after visiting all five tabs. If pressure appears, preserve logs before changing caching.
- [ ] iOS: repeat Board gesture and scroll tests with native momentum/directional lock.
- [ ] Web: test Board's existing mock responder and native browser scrolling, Sprint form and release workflow.
- [ ] `npm test` is green. If Expo Go errors, capture full Metro and Android exception, not just deprecation warnings.

## Commands

```bash
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NiyarvoProjects-v0.4.7-SPRINT-KANBAN-NAV-QA.zip -d .
npm install
npm test
npx expo start --clear
```

No new npm packages were introduced in v0.4.7.
