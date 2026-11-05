# QA — Workspace popup, Board, sprint charts and task controls

Scope: header workspace popup, compact Board dates/Add list, line/bar burndown views, the Advanced tasks project switch, and bottom-navigation styling. Reuse the existing store APIs. The only additive data setting is `tools.advancedTasks`; there is no dependency, package, release-version or backup-format change.

Additional requested scope: Board Upcoming dates initially shows one task. See more reveals the existing upcoming list; See less restores the one-row view. The existing 30-day selector and power-up gate stay unchanged. The component is keyed by board so expansion resets when switching boards.

Add list moves to the right end of the Board and changes from a 64×240 vertical control to a horizontal control at least 112×44. The column viewport selector now measures from the strip origin; drag hit testing continues to use measured column/card coordinates. No list ordering or creation rule changes.

Advanced tasks is a non-screen project tool: it controls the existing advanced task editors, replacing the local Standard/Advanced selector. Existing projects with no setting default to on so no editor is lost; new lean projects default to off. Switching off hides fields without changing any task. Existing normalization persists the extra boolean on the next ordinary save and includes it in project/workspace exports. Older code ignores the extra key. No startup rewrite is introduced.

Bottom navigation loses its top outline and selected-tab background. The selected icon is 24px versus 19px for inactive icons, within a fixed 28px icon box; labels, Create, swipes and stale-press guards are preserved. Existing icon glyphs and accent are retained.

Today → Project overview: the Weighted progress acceptance-check text overflowed beside the large percentage. The row now wraps with a 12px gap, and the text can shrink/wrap to at most the card width. Counts and weighted-progress calculations are unchanged. Review passes: spacing follows 4px rhythm; colors/icons/copy/type remain; layout wraps rather than overflows; detail preserves counts and testing-tool gating; no visual or motion addition.

Latest Today layout: Project overview is the main, always-visible content. Needs attention and Next due are two count-bearing alert buttons; their task lists, empty states and task-open callbacks live in compact sheets. The overview is no longer a collapsed Fold. Existing first-run actions remain within the overview for empty/sample projects, and All tasks is available beside the overview heading. No task query or saved-data change.

Review: Unslop by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0; MemoryRelay ponytail and interaction guidance. Existing Milvayo styling takes precedence.

## Direction

- Product: a precise workspace for independent projects and their tasks.
- Character: calm, exact, dependable.
- World: quiet planning instruments.
- Moments: project/workspace selection; the schedule and tasks remain the main content.
- Signature: Milvayo's selected accent and its existing Board mark.

## Before audit

| Pass | Before | After |
| --- | --- | --- |
| Spacing | Header selector uses a bordered text box; switcher reserves a full-height column | 44px hamburger target and content-sized sheet, capped at 76% height |
| Color | Established neutral surfaces and selected accent | Preserve existing tokens and selection colors |
| Icons | Folder and dropdown chevron imply project selection only | Existing Feather menu icon names the broader workspace menu |
| Copy | Projects and Workspaces are accessed separately | Workspace menu with clear Projects/Workspaces tabs and current workspace context |
| Typography | Existing project name and row typography | Preserve readable project context and current row styles |
| Layout | Top selector opens a tall side drawer; workspace controls are in More | One compact sheet with two views; existing More/sidebar access remains |
| Details | Project selection, creation, workspace switching/creation/rename/confirmed delete already work | Reuse them, retaining error notices, busy states and last-workspace protection |
| Visuals | No new visual is needed | No decorative imagery or new logo asset |
| Motion | DrawerMotion slides the full column | Reuse the shared sheet fade/dismissal; embedded controls have no drawer animation |

Board audit in the same order: spacing keeps one row before disclosure; colors and icons are retained; copy adds See more/See less; typography is retained; layout discloses the remaining rows; details preserve task-open controls and empty/single-item states; no new visuals; no animated list expansion.

Burndown audit in the same order: 44px mode buttons above the chart; existing neutral ramp and selected accent; two original SVG line/bar icons; Line graph/Bar graph labels; existing readable figures; line view retained alongside bars with ideal ticks from the mock; shared selection and series controls; no new data or decorative visuals; immediate view changes with no interpolated historical values. Both views use the existing `burn` arrays; no model, snapshot, cutoff or pre-start status logic changes.

Task/bottom-bar audit in the same order: spacing removes the redundant local mode row and fixes icon boxes; colors retain meaningful accent without selected-tab surfaces; existing icons remain; Advanced tasks names the setting; readable text sizes remain; the project switch controls only the advanced section; editor callbacks and field values remain intact; no new imagery; selection updates instantly with no navigation animation.

## Verification

| Check | Result | Evidence / limit |
| --- | --- | --- |
| `npm test` | **Pass** | 730 passed, 0 failed/skipped; `ui-followup-tests.txt` |
| New focused checks | **Pass** | 12 new checks across this follow-up: workspace selection/creation/rename/delete/failure handling, compact sizing/dismissal, navigation, Board disclosure/geometry, chart modes/series/edge cases and Advanced tasks/import parity |
| JSX/source syntax | **Pass** | 145 app source files parsed with Babel |
| Identifier scope check | **Pass** | Nine changed UI modules have no unresolved JavaScript identifiers |
| `npx expo install --check` | **Pass** | Dependencies are up to date; no packages installed or configuration changed |
| Version metadata | **Pass** | Package, lockfile root/top-level and Expo versions remain synchronized at 0.5.59 |
| `git diff --check` | **Pass** | No whitespace errors |
| Further Web/Android bundle checks | **Not run** | Stopped at the user's request. Earlier cold requests timed out while Metro compiled; no further bundle validation was attempted after the instruction |
| Browser / Expo Go / hardware / Fast Refresh acceptance | **Not run** | No Playwright browser or connected device runtime; source/handler checks do not substitute for acceptance |
| Delivery | **Pass** | Changes applied directly in `/mnt/milvayo-rebrand`; no new ZIP, per the user's latest instruction |

Tests use the existing installed Termux Node binary via a temporary PATH shim because the host's default Node wrapper recurses. This does not change the project or system Node configuration.

The deterministic hook/element harness checks handlers and render output, not actual React Native layout, focus or hit testing. Existing task/store/agile/backup round-trip suites also pass. The one relocated source guard now reads UpcomingDates.js alongside Board.js. Existing Standard/Advanced assertions now check the project switch and retained editors. No existing behavioral guard was deleted.

Dedicated tests: `tests/ui/header-workspace-popup.test.cjs`, `tests/board/board-compact-actions.test.cjs`, `tests/ui/sprint-chart-views.test.cjs`, `tests/domain/advanced-tasks-tool.test.cjs`.

## Reversible installation

Changes are already applied in the working project directory. No ZIP is created or required. Export a data backup before testing workspace creation/deletion, and preserve the existing local configuration and compatible dependencies. Review the source diff; on Termux run `npm test` and `npx expo install --check`, then start Metro with the usual command when ready. For rollback, restore only this follow-up's files from a known source checkpoint; do not reset unrelated uncommitted changes. `tools.advancedTasks` is additive and older code ignores the key; task data stays intact.

## Device acceptance (Not run)

- Tap the hamburger on phone and wide headers: the sheet is compact and shows the current workspace/project context.
- Projects: select a project, verify it opens, create a project, cancel creation and reopen the menu. Archived projects remain excluded.
- Workspaces: switch workspace and see its projects; create, rename and explicitly confirm deletion on disposable data. The last workspace cannot be deleted. Failed operations stay visible with inline errors.
- Dismiss with Done, backdrop, Android back, accessibility escape and downward swipe; scrolling long lists must not dismiss the sheet.
- Check light/dark/AMOLED, narrow screens, large text, keyboard focus and Fast Refresh on a harmless edit. Existing header search, zoom, screen actions and More navigation must still work.
- Upcoming dates: with several dated tasks, initially see one; See more reveals the existing list, task taps still open their sheet, See less collapses it, and changing boards resets it. Empty or single-item lists have no See more button.
- Board: scroll to the right to reach the smaller Add list button, create/cancel a list and test card/list dragging across the first, middle and last columns with horizontal auto-scroll.
- Sprints: use both SVG buttons above the chart, tap/drag to read days and toggle either series. Readings stay the same across views. Completed historical values must remain unchanged after task edits and backup/import.
- More → Manage tools: toggle Advanced tasks; reopen any task and verify the detailed editors follow the project setting with no Standard/Advanced control. Switch off/on, restart and export/import; dependency, custom-field and verification data must remain unchanged.
- Bottom bar: no upper outline or selected tab tile; the selected icon grows without shifting labels. Verify every destination, Create and swipe/stale-press behavior.
- Today → Project overview: check Weighted progress with large acceptance-check counts, narrow portrait and large font settings; text must wrap inside the card without clipping the percentage or other controls.
- Today: only the two alert buttons appear above Project overview. Open either compact sheet, paginate attention items, open a task, dismiss and verify the overview remains visible; check both empty states.
