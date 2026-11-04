# Niyarvo Projects v0.5.5 — Device acceptance checklist

These cases were **not executed on a device** in the source environment.

1. **Responsive headers:** Open Timeline and Automations. Subtitles wrap across full width instead of stacking a word per line; Days/Weeks/Months/Today and Due checks/Card aging stay in aligned control rows. Inspect Scheduling, Tasks, Specs, Settings and Backup for the same regression.
2. **Brand:** Open hamburger menu in light and dark themes. Blue PROJECTS is legible and sits under the right side of Niyarvo without overlapping the `y`; no duplicate menu labels.
3. **Entreprise PM:** One drawer row only. Switch Programs / Portfolios / Projects sections. Existing projects still selectable, editable and recoverable.
4. **Nested creation:** In Portfolios create a portfolio, add a project. In Programs create a program, add that portfolio. Expand the program portfolio row and open its nested project.
5. **Persistence:** Close and reopen Expo Go, verify program-to-portfolio and portfolio-to-project links remain. Export whole workspace JSON, re-import into a disposable workspace and verify relationships survive.
6. **Deletion safety:** Remove portfolio, verify program link removed, projects/tasks still exist. Removing a project must remove it from any portfolio.
7. **Legacy migration:** On a prior workspace with direct program project references, they remain visible as legacy members and do not disappear on edit.
8. **Notification safe-area:** Mark a task Done and trigger a warning. On Android 15, the animated notice should appear below the app header, fully legible, without overlapping the system clock, camera cutout, battery indicator or title controls. Verify it can be dismissed, and check repeat notifications after rotating the screen or returning from background. Confirm iOS and web placement separately.
9. **Regression:** Timeline SVGs remain visible and Expo Go stays open; Board card dragging/swiping still works; task checkboxes persist.

No new npm packages; package manifests intentionally remain local.
