# Niyarvo Projects — v0.5.51 Governance form / Timeline interaction audit

**Source:** v0.5.50 verified full ZIP, edited directly to v0.5.51. **Method:** Inspected supplied Android screenshot against React Native `Input`, `Sheet`, Governance screens and outer/nested Timeline `ScrollView`. Cross-checked Frontend Design, dickwu/apple-design-skill and Ponytail principles. This is a source/automated test audit, not a physical-device visual verification.

## Root cause evidence and fixes

| Severity | Source / problem | Correction |
|---|---|---|
| High | `src/ui/uiControls.js`: Input background was `c.surfaceAlt`, equal to `c.bg` for Light themes; border width absent | Raised card surface, visible neutral outline, stronger focused border, 44-pt single-line / 104-pt multiline. Existing explicitly transparent inline title controls still override style intentionally |
| High | `src/screens/governance/CreateProjectSheet.js`: unstructured six-row form with unmarked text fields | Reuse `Labeled` accessible fields, meaningful placeholders, Markdown description preview, explicit Save/Cancel preserved |
| High | `src/screens/governance/Portfolios.js` and `Programs.js`: form Card nested inside a Sheet and action buttons below lengthy editor | Plain spaced editor, anchored footer actions; remove redundant one-action Manage fold; render Markdown descriptions safely |
| High | `src/screens/timeline/Timeline.js`: Days/Weeks/Months registered in fixed header, so could not scroll away; ribbon/date strip were not scroll-state-aware | Hide zoom controls past 80pt vertical scroll; hide scroll-away ribbon and date strip; enable directional/nested horizontal chart scrolling. Preserve original gestures and SVG positions |
| Medium | `src/ui/uiLayout.js`: reopening a sheet could retain prior scroll offset | Reset ScrollView to top on modal show |
| Medium | Governance and PM text has no rich-text preview despite supporting Markdown strings in data | Shared `MarkdownField` with Edit/Preview using the existing safe `TaskMarkdown` renderer: bold, italic, headings, lists, quotes, inline code |

## Cross-screen source audit

The same `Input` primitive is used for editable task titles/details and new-task sheets, Board search/list rename, sprint goals, releases, backup passwords, contributor fields, task configuration, scheduling, specifications, risk title/details, PM documents, WBS, portfolio/program descriptions, and cost editors. These all inherit the field visibility and focus improvement. Customized transparent title edit fields remain unchanged where an outlined text box is inappropriate.

The new Markdown preview is intentionally limited to prose, not numeric/date/ID inputs. Project/Portfolio/Program descriptions, project-management template text, WBS descriptions, risk response plans, and new-task descriptions reuse the existing renderer with no new Markdown parser or HTML. Data schemas and serialized strings are unchanged.

Other screens that were reviewed but not rewritten: Overview metric composition; Board drag/Tools sheet; Tasks tab and configuration sheet; Sprints, Releases and Costs; workspace/backup dialogs; risk heatmap. Their existing collapsing/filter/pagination controls already have direct actions; redesigning them would add unnecessary complexity or risk established gestures.

## Quality gates

- Full `npm test` on edited source: **640 tests / 639 passed / 0 failed / 1 skipped**, ~8 seconds. The full packaged ZIP was extracted into a clean directory and independently passed the same 640-test suite (639 pass, 0 fail, 1 skip).
- JS/JSX/CommonJS parse on edited source: **231 files, 0 syntax errors**, using TypeScript parser.
- Expo Go Android, mobile Web and iOS simulator screenshots/gestures: **NOT RUN**, user acceptance required.
- Responsive checks on actual phone widths and Android keyboard opening in sheet: **NOT RUN**.
- No changes to stored workspace format, task scheduling math, board ordering, encryption logic or Firebase project.

## On-device checks

1. Open Governance → Projects → Create; confirm six clearly outlined fields, Markdown formatting/preview, scrolling and footer Save/Cancel. Repeat for Portfolios and Programs.
2. Choose Light, Dark and AMOLED, including Mint and Amber. Tap a field and verify focus visibility, text entry, and keyboard viewport.
3. Navigate Timeline, scroll vertically on the Gantt plot (not just the task names); confirm zoom buttons, Gantt ribbon and calendar date labels disappear on downward scroll, return on upward scroll, with horizontal panning and bar dragging intact.
4. Inspect PM document text, WBS description, Risk response, and New task description previews. Check that text remains after closing, reopening and export/import.

**Sources:** https://github.com/dickwu/apple-design-skill ; https://github.com/anthropics/skills/tree/main/skills/frontend-design . No external skill scripts or dependencies added.
