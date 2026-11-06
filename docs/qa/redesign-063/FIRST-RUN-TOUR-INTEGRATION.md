# First-run tour integration — 0.6.3

Source: owner-supplied `milvayo-first-run-tour.zip`, inspected in full for the tour code/tests, handover and QA brief. Existing ModernApp/More and cumulative changelog in that ZIP predate recent fixes; merge only tour wiring, never overwrite those current files. Do not import the ZIP's historical test totals as local results or its instruction to clear app data. No builds, dependencies, pushes or protected-parent changes.

Before audit (Unslop by Damir Sokolovsky, CC BY 4.0): spacing → retain the supplied centered 520px tour and existing control rhythm; color → theme tokens/Dark/AMOLED; icons → supplied SVG drawings and existing controls; copy → retain three slides/four starters/Skip; typography → preserve readable hierarchy; layout → swipeable slides, starter picker, name step; details → correct fresh/upgrade detection, Back/keyboard/focus handling, one accepted creation, inline failure and retry; visuals → supplied geometric TourArtwork family; motion → existing Reveal/PressSurface only, no additional motion runtime.

Product: precise local-first project workspace.
Character: calm, exact, dependable.
World: planning instruments and quiet work.
Moments: Board/Timeline/release examples and the first real project.
Signature: selected accent and Milvayo Board mark.

Controlled plan: integrate supplied tour files and More entry, preserving prior navigation/performance/background fixes. Read-only module-load fresh probe precedes store writes and fails closed; also check recovered/orphan workspace keys. Auto-open only for an empty install, manual replay from More. Subscribe after mount so fresh eligibility is not consumed during rendering. Configure starter tools in the same validated createProject transaction rather than several unchecked mutations; optional creation overrides affect only the new project. Keep all existing data and use current persistence/import format. Add duplicate-submit/failure guards, Android Back, keyboard avoidance, pager resize/back restoration and web focus handling. No automatic task/template imports. No new storage key or migration.

Verification plan: provided plan/art contracts plus actual render/handler harness checks for all steps/starters, Skip, invalid name, rejected/success/repeated creation; fresh/upgrade/orphan/read-failure/race cases; atomic tools and JSON round trips; existing More/shell/manager/performance/lifecycle regressions; JSX/worklet/dependency checks. Native/browser runtime acceptance must be explicitly marked Not run when unavailable. Keep version 0.6.3/build 63 and cumulative release history.


## Integrated behavior and differences from the older ZIP

- Retained the supplied three Board/Timeline/release slides, Board/Sprints/Timeline/Blank starters, name step, Skip, theme-aware TourArtwork and app-owned Reveal/PressSurface motion.
- More → App → Take the tour reopens it on existing installs. Upgrades keep their workspace and do not auto-open it. Completing creates a new project in the current workspace; it never replaces the sample/existing projects or imports tasks. Skipping changes no project/tool data.
- Both storage reads are issued at module load before StoreProvider can establish demo data. Existing index, original workspace data or recovered/orphan workspace keys suppress automatic opening. Failed, synchronous-throwing or malformed reads fail closed. No marker/storage-key migration is introduced.
- Pending fresh eligibility is delivered in the shell's committed subscription; render no longer consumes it. This avoids losing the tour in aborted/replayed renders.
- Added validated boolean initial-tool overrides to the existing createProject input. Ordinary creation remains LEAN. A starter is applied inside the same normal validated creation transaction, replacing the ZIP's unchecked post-creation sequence of setProjectTool calls. New data remains the existing project `tools` field; old imports keep their lenient normalization. No new store action/schema field is added.
- Guarded duplicate submits and retries; failed/throwing creation keeps the name and starter with inline feedback. Skip/Back cannot interrupt a pending submission. Success blocks resubmitting that screen instance. Existing asynchronous workspace persistence/error notice behavior is retained; this adds no new durability guarantee.
- Android Back and accessibility escape follow the steps/slides or Skip from the beginning. Name editing uses keyboard avoidance; slides can scroll vertically for short screens/large text. Pager positions restore after returning from later steps and adapt to window width; temporarily zero-width viewports cannot produce negative native artwork/card dimensions. Web scrolling settles with a timer rather than relying on a native-only momentum callback; Escape/Tab handling contains keyboard focus in the tour.
- Underlying shell accessibility is hidden while touring. The existing single IslandNotice is inside the active tour layer, so errors stay visible/actionable; its Backup action leaves the tour and opens existing recovery controls. The shared manager, Scheduling placement, single Manage tools card, task popup behavior, performance changes and error/background repairs were preserved.

## Verification

| Check | Result / evidence |
| --- | --- |
| Focused integration, creation, fresh/read-failure/orphan/upgrade, all starter flows, Skip/Back, invalid name, rejection/retry/double-submit, web paging/focus, current shell/manager/tools, import/copy, performance and background regressions | **Pass — 67/67**, `first-run-tour-tests.log` |
| Source syntax | **Pass — 201 app files**, `first-run-tour-syntax.json` |
| Native worklet transforms | **Pass — 18 files**, same artifact; no bundle/build |
| Supplied artwork review | **Pass at static source-art scope**: actual TourArtwork JSX rendered to SVG and rasterized with librsvg in Light/Dark/AMOLED; `source-review/tour-artwork.svg` / `.png` opened for inspection. Effects absent; no device/runtime UI acceptance implied |
| Expo install --check | **Pass with limitation**: offline reports dependencies up to date and warns validation is unreliable; `first-run-tour-dependencies.log` |
| Whitespace / folder / imports | **Pass**, diff check plus focused folder tests |
| Metadata / branch | **Pass**, package/lock/root-lock/Expo 0.6.3, Android/iOS 63; existing redesign/work |
| Protected parent | **Pass — 761 baseline files unchanged**, `first-run-tour-parent-check.json` |
| Whole tour runtime, native swipe/keyboard/font scaling, actual first install/upgrade, device Back and screen reader | **Not run** |
| Full heavy suite, Metro/runtime launch, builds, commits, pushes or main integration | **Not run**, existing constraints |

The older ZIP's 742/62 test totals and browser stand-in claims are not evidence for this integration. Its ModernApp/More/changelog were not copied over the current app. No new package or fonts were installed. No request to clear data was followed.

## Owner review and reversible plan

Open the existing redesign app and choose More → Take the tour. Review all three slides, Skip on every step, Back, each starter, name validation, keyboard visibility and Create project; inspect the resulting project/landing screen and use Manage tools to re-enable hidden tools. Existing data should never show the tour automatically. Fresh-install detection can be tested in an independently isolated test installation/profile; **do not clear this app's storage or reinstall to test it**.

No migration is required. Returning to the untouched parent app reverses the candidate experience; export any new candidate work explicitly before switching copies. Main integration is still a separate owner decision. Stored projects created by the tour remain ordinary compatible projects even if the tour UI is later removed; tool visibility remains adjustable in More.
