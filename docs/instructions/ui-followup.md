# Current Today layout

Project overview is the main, always-visible content. Needs attention and Next due are alert buttons with counts; each opens its task list in a compact sheet. The existing task links, attention pagination, empty states and All tasks shortcut remain. Weighted-progress acceptance text wraps inside its card, including narrow layouts.

---

# Workspace menu, Board and sprint chart updates

- Home keeps the header hamburger without the project-name text. Other project headers keep their context. The hamburger opens **Workspace menu**, a compact sheet. Projects lists non-archived projects and Create new. Workspaces keeps switch, create, rename and confirmed deletion. Selecting/creating a workspace returns to its Projects view. Done, backdrop, Android back and swipe dismiss the sheet.
- List **Due soon** replaces Board Upcoming dates. It starts with one task; See more/See less reveals or collapses the combined preview. In List → Tools → Due soon, choose the boards to include. Existing calendar choices are preserved; completed tasks and archived boards are excluded. The preview keeps its 30-day/30-item limit and task-open links.
- **Add list** is a compact vertical button at the right end of Board (44px wide, at least 112px tall). List creation, order and drag rules are unchanged.
- The two SVG buttons above sprint burndown choose **Line graph** or **Bar graph**. Bars use the mock's quiet columns, selected accent and ideal ticks. Both views read the same history, selected day and series visibility; switching views changes no recorded values.
- **More → Manage tools → Advanced tasks** chooses task-sheet detail for the current project. The Standard/Advanced selector is removed from task sheets. Existing projects default on; new lean projects default off. Switching off hides editors without deleting data. The setting survives ordinary saves and project/workspace export/import. Core screens remain available.
- Standalone screen page titles are removed; back navigation, header actions, section headings, record names and popup titles remain.
- Bottom navigation has no top outline or selected tab tile. The selected icon grows within a fixed box, keeping labels aligned. Create and swipe navigation are retained.

## Direct workspace changes and rollback

Timeline now supports two-finger pinch on the chart to zoom the date axis. The pinned calendar follows the same preview, while row heights and final label/handle sizes stay readable. Pinch changes only the view; hold/drag editing still works after release. Days/Weeks/Months reset custom zoom. On Web, trackpad pinch/Ctrl+wheel is also supported. QA and device checks: `docs/qa/NP-QA-timeline-pinch.md`.

Work breakdown diagrams now support two-finger pinch zoom (25–400%) and dragging to pan. Tree direction and Fit/100%/150% share one row; swipe that toolbar sideways on narrow screens. Press a preset again to reset panning. Fit uses the viewer's width and height; editing stays in Outline, and SVG/CSV export still uses the original structure. The four summary cards are compact and equal in size. On Web, trackpad pinch or Ctrl+wheel zooms, while mouse drag/wheel pans.

Work and Projects headers now keep the hamburger without project-name text, matching Home. Project names remain in the workspace popup and records. Latest gesture/device checks and rollback: `docs/qa/NP-QA-wbs-pinch-zoom.md`.

The changes are already applied directly in `/mnt/milvayo-rebrand`; no ZIP or extraction step is needed. Preserve your local configuration and compatible dependencies. Package/lock/Expo versions remain 0.5.59. Run `npm test` and `npx expo install --check` on Termux, and use your usual Metro command for device validation. No further Web/Android bundle checks were run after your instruction.

Use `docs/qa/NP-QA-list-due-soon-screen-chrome.md` for the latest device checks and `docs/qa/NP-QA-header-workspace-popup.md` for the preceding changes. Roll back by restoring only the changed source files from a known checkpoint and restarting Metro; preserve unrelated uncommitted changes. The only new stored field is `tools.advancedTasks`; older code ignores it and all task fields remain intact. No startup rewrite or backup-format change is required.
