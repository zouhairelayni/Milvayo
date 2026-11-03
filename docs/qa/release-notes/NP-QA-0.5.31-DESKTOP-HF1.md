# Niyarvo Projects v0.5.31 Desktop hotfix — quick acceptance

This is a targeted browser smoke checklist, not a completed device-test report.

- [ ] Desktop Web, 1440px viewport: full left navigation (264px), top project switcher, search and New task; **no bottom tab bar**.
- [ ] Desktop Web, 768px viewport or landscape browser desktop site: 72px navigation rail and compact top toolbar; **no bottom tab bar**, no horizontal toolbar overflow.
- [ ] Phone Web portrait ~390px: mobile header + five bottom tabs; no sidebar.
- [ ] Phone Web if wide layout did not appear: hamburger menu > **Desktop layout**; bottom tabs disappear. The rail footer > **Automatic layout** returns to responsive behavior, including after a reload.
- [ ] Expand/collapse desktop sidebar above 1120px; all destinations are reachable.
- [ ] Change project from toolbar and sidebar, switch workspace, navigate Overview > Board > Timeline > Tasks > Sprints and back; no unwanted screen resets or data loss.
- [ ] Search existing tasks and open/edit/close a task sheet. Test light/dark and narrow widths.
- [ ] Android native portrait: mobile bottom navigation and gestures remain available. Do not use this visual check as a substitute for Board/Timeline drag QA.
- [ ] Desktop and phone confirm project data survives reload. Export and reimport only in a disposable workspace.

No APK build required. Collect a performance report separately if the Timeline first-open bounce or slow drag behavior persists.
