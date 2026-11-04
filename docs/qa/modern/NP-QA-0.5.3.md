# Niyarvo Projects 0.5.3 — Device QA

1. Install: `cd ~/NiyarvoProjects && unzip -o ~/storage/downloads/NiyarvoProjects-v0.5.3-PROJECTS-PROGRAMS-UX.zip -d . && npx expo install expo-document-picker && npx expo-doctor && npx expo start --clear`.
2. Hamburger: Projects, Programs, Portfolios in that order. Task configuration is in Operate, not Plan. Main 5 tabs unaffected.
3. Projects: create a temporary project; edit name/code/description; switch projects; duplicate template. Confirm archive hides project, and recovery from Backup restores it. Verify Delete requires second confirmation and leaves at least one accessible project. Export workspace before testing deletion.
4. Programs: create program, select multiple projects, save and reopen app. Edit status and membership. Delete a project (test data) and confirm program membership updates. Deleting the program must not delete projects.
5. Backup: export one project JSON and full workspace JSON. Import project through native .json picker. Cancel picker; no workspace changes. Full workspace JSON prompts for confirmation. Invalid JSON and files over 5 MB rejected. Recovery snapshots can be restored with confirmation.
6. Check an old v0.5.2 workspace loads without Programs errors; export full workspace and inspect that `programs` exists. Restore test backup and confirm group associations.
7. Branding, header and UI: small PROJECTS letters embedded in drawer logo, active screen name in header; no duplicate oversized title. Orange default with nine optional accents. Notifications never overlap system status bar and have working dismiss affordance. Tabs stay visible above system navigation.
8. Timeline: first tap should remain on Timeline; full vertical task list, SVG curves, horizontal scroll and Items control on left. Record crash reports/Metro logs if the screen still returns to Overview.
9. Kanban drag, task tap, long-press and double-tap name editing; main business operations must still persist.
10. After smoke test, run `npm test` and `npx expo-doctor`. Mark actual runtime outcomes (pass/fail) in the device handoff.

**Limit:** source-level tests cannot establish native touch, app performance, APK icons or OS-safe-area geometry.
