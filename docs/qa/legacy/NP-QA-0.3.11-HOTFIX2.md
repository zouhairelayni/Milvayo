# Niyarvo Projects — v0.3.11-HOTFIX2 runtime QA

**Scope:** Expo Web `BrandMark` crash and immediate navigation regression checks.

## Web QA — required

- [ ] Clear Metro cache (`npx expo start -c`) and load Web at localhost:8081.
- [ ] No `WebShape.js` exception when opening the sidebar.
- [ ] Niyarvo symbol is visible, centered, and clay orange by default.
- [ ] Sidebar scrolls past Resources to Costs, Collaboration, Reports and Settings.
- [ ] Close button, clicking backdrop, and Escape key all close the sidebar.
- [ ] Settings accent change recolors the mark without crashes.
- [ ] Opening project switcher, task drawer and Kanban no longer loses the app view.
- [ ] Switching projects or reloading retains expected data.

## Android Expo Go QA — required

- [ ] Original native Niyarvo logo still renders on the sidebar and Settings.
- [ ] Back button closes the drawer; top and bottom system safe areas remain correct.
- [ ] The sidebar scrolls to the final item on small portrait screens.
- [ ] Atlas Board and Sprints open, and the Gantt does not crash.

## Verification record

- Node tests: **286/286 Pass**
- JS/JSX parse check: **Pass**
- Expo Web bundling: **Not run**
- Web browser rendering: **Not run**
- Expo Go physical device testing: **Not run**
- Firebase/GitHub/deployment: **Not performed**

If Web still fails, capture the full first error line **above** `WebShape.js` along with the component stack. If another SVG component is implicated, do not assume the logo fix covers that component.
