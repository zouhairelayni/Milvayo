# CHG-NP-0.5.26 — Trello-inspired Standard/Advanced task sheet

## Release checkpoint
- Baseline: user-provided `NiyarvoProjects v0.5.25.zip`, Expo and package version 0.5.25.
- Release: 0.5.26. Full source, project-root ZIP. No Git operations, deployment, APK or IPA.
- Scope: task editor presentation, safe project-level label colors, simple Markdown read mode, compact Kanban task cards. **No task ID migration or refactoring of task relationships.**
- User references: two Trello screenshots showing task detail, colored labels and Kanban cards.

## Changes
1. **Standard and Advanced editor modes:** new tasks open in Standard mode. Title, board/status context, colored labels, description, status, schedule, priority, owner, acceptance checks, attachments and activity/comments are immediately discoverable. Advanced includes previously available subtasks, stage, task type, progress, parent task, release, sprint, dependencies, time tracking, custom fields, GitHub references, verification/delivery and deletion. Switching modes does not change task records.
2. **No prominent internal IDs:** task identity removed from the task-sheet title, Board cards, Tasks list and Sprint/Delivery assignment lists. The original immutable task ID remains in the Task Sheet footer. Internal references and ID-based search are unchanged.
3. **Description:** always shown in read mode and can be edited as Markdown source with explicit Save & preview / Cancel. Read mode supports headings, bullets, bold, italic, strikethrough and inline code. HTML is treated as text, not executed. Editing is saved if the sheet is closed; Cancel discards the draft. It is intentionally a lightweight Markdown subset, not a full GFM parser.
4. **Colored labels:** 24 swatches; create/assign labels, reuse existing labels, remove or recolor assigned labels. Colors are shared by label name within each project via optional `labelColors` map. Existing string-array task labels remain unchanged. Without a custom color, a deterministic palette color is used.
5. **Kanban presentation:** colored labels above titles, compact due/checklist/attachment/comment indicators; task IDs removed from cards. The existing long-press drag and double-tap title editing handlers remain in place.
6. **Project import:** model normalization and JSON schema support `labelColors` and preserve it across `.json`, unprotected `.niyav` gzip and password-protected `.niyav` exports.

## Verification
- `npm test`: **527 passed, 1 skipped, 0 failed** (the skipped case predates this change).
- JSX parse: all touched `.js` screens/components parsed with locally available TypeScript JSX parser, no errors.
- Project JSON normalization + `importProject` colored-label round trip: PASS.
- Gzip and AES-256-GCM `.niyav` label-color round trips with independent Node test primitives: PASS.
- Physical Android/iOS, real drag, keyboard + scroll accessibility and visual checks: **NOT RUN**.

## Device acceptance
1. Open Board card: title and colored labels are clear, no internal ID on card. Drag, cancel drag, move between lists, edit title by double tap.
2. Open task: default Standard mode, title first, description read mode always visible, status/schedule near top, comments visible. ID only in small footer.
3. Edit description with `**bold**`, `*italic*`, `# heading`, and list items. Save & preview; reopen and confirm retained. Confirm Cancel discards draft.
4. Create a label, choose one of 24 colors, confirm it appears on Board and Tasks. Recolor an existing label; verify all tasks with that label use that color.
5. Switch to Advanced, inspect every old field (custom fields, GitHub, dependencies, validation, time, subtasks, deletion). Check data survives closing/reopening and project switch.
6. Export a project and workspace as `.json` and `.niyav` (including password-protected). Import into a disposable workspace; verify label colors, comments, task IDs and dependency references are intact.
7. Check mobile keyboard behavior, long descriptions, long labels and UI responsiveness on a real Android device.

## Known limitations
- Markdown read mode is a safe subset: no rich Markdown tables, remote embedded images or clickable links.
- Label colors are per-project, not workspace-global. Recoloring a label affects every task using the same label in that project.
- React Native styling and native touch interactions have not been visually/device tested in this environment.
