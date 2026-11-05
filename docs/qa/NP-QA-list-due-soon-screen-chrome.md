# QA — List Due soon and quieter screen chrome

Scope: move Board Upcoming dates into List as Due soon; retain the collapsed one-row preview and See more/less. Move the calendar switches into List tools per board, preserving stored `powerUps[boardId]` choices. Hide the project name in Home's header; keep the hamburger and project/workspace popup. Turn Add list into a compact vertical control at the right end. Remove standalone visible page titles while retaining section headings, record names, popup titles and all actions.

Review standard: Unslop by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0, used as a review standard for the existing Milvayo design. MemoryRelay was consulted; no logo redesign or new asset is needed for this feature rename.

## Five-line product direction

- Product: a precise project workspace with task lists, schedules and release gates.
- Character: calm, exact, dependable.
- World: planning instruments and quiet technical workbenches.
- Moments: the task list, schedule and verified progress carry the information.
- Signature: the selected accent, meaningful task colors and the existing Board mark.

## Before audit

| Pass | Before | After |
| --- | --- | --- |
| Spacing | Board dates sit above the kanban columns; Add list is horizontal | Date preview moves into List; Add list is 44px wide with a vertical label and retained touch area |
| Color | Existing neutral surfaces and accent already work | Preserve tokens and status colors |
| Icons | Existing Feather set already works | Preserve hamburger, plus and task icons |
| Copy | Upcoming dates belongs to Board and describes only one board | Due soon describes the enabled boards in List; date controls move with it |
| Typography | Screen titles repeat navigation; Home also shows the current project name | Remove visible standalone page titles and Home's project-name text; retain content headings |
| Layout | Board, Home and delivery screens spend space on redundant chrome | Keep Board focused on columns and Home on project overview; preserve actions and navigation |
| Details | Calendar is a stored per-board extension | Preserve existing switches and import/backup semantics; combine enabled boards without rewriting data |
| Visuals | Existing task rows and charts provide the content | No new imagery, logo, badge or decorative visual |
| Motion | Existing presses, sheets and direct drag behavior work | Reuse existing feedback; no new animation |

## Scope and invariants

No saved-data migration, package or dependency change. Due soon keeps the next-30-days rule, excludes completed tasks and archived boards, sorts by due date/position and caps the merged preview at 30 tasks. The calendar id and per-board saved settings remain unchanged. The right-hand Add list position and zero-origin column geometry remain; list creation/reordering rules do not change. Sprint history, timeline dependencies, store persistence and backup formats remain untouched.

Apply directly on Git `work`; no ZIP, commit, push, deployment or merge. Do not run Web/Android bundles, per the user's instruction.

## Verification

| Check | Result | Evidence / limit |
| --- | --- | --- |
| `npm test` | **Pass** | 734 tests passed, 0 failed/skipped; `list-due-soon-tests.txt` |
| Focused presentation/handler checks | **Pass** | Six checks for date preview expansion/open callbacks, vertical Add list geometry, merged enabled-board dates/import, relocated switches, Home header text and screen-title removal |
| JSX/source syntax | **Pass** | 146 app source files parse with Babel |
| Changed UI identifier scopes | **Pass** | Eight changed UI modules have no unresolved JavaScript identifiers |
| `npx expo install --check` | **Pass** | Dependencies are up to date; no installation or package change |
| Version synchronization | **Pass** | Package/lock/Expo metadata remain 0.5.59 |
| `git diff --check` | **Pass** | No whitespace errors |
| Browser / Expo Go / hardware / Fast Refresh | **Not run** | No connected runtime; source/handler checks do not establish runtime acceptance |
| Web/Android bundles | **Not run** | Omitted at the user's request |
| Delivery | **Pass** | Direct local edits on `work`; no ZIP, commit, push, deployment or merge |

Existing source guards were updated to follow the relocated calendar preview and controls; Board card-aging assertions still verify the same selector and results. No behavioral guard was removed. The preview and its switch settings survive a normalization/import round trip without changing tasks. Checks used the installed Termux Node binary via the existing temporary PATH shim, preserving project/system configuration.

## Device acceptance — Not run

- Board shows no dates panel or calendar toggle. Its right-end Add list button is vertical, readable and reachable; create/cancel and drag/autoscroll still work.
- List shows Due soon for enabled boards, initially one task. See more/less and task-open callbacks work. List tools can enable/disable each board's date preview; restart and export/import preserve those choices.
- Home's phone and wide headers show the hamburger without the project name; the popup still identifies/selects projects. Other project headers retain context.
- Screen page titles are absent; back navigation, header actions, content headings and popup titles remain. Check delivery actions, search/zoom and More navigation.
- Check empty/single/long date lists, archived boards, light/dark/AMOLED, narrow layouts, large text and Fast Refresh on device.

## Reversible update

Changes are applied directly in the project directory. Preserve unrelated uncommitted work and local configuration. Export a data backup before testing project/workspace operations. Review the source diff; roll back only this patch's files from a known checkpoint and restart Metro. The saved calendar settings and task format are unchanged, so no reverse migration is needed.
