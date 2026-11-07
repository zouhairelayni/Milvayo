# Milvayo v0.8.4 — Web chart rotation repair

Follow-up to checkpoint `bf6281c`, applied on `work`. Package/lock/Expo versions are 0.8.4; Android/iOS build 94. The owner reported Web console errors from CompletionArc in Projects and StatusOrbit in Reports. Android bundling succeeded in the supplied log; this does not establish gesture or visual acceptance.

## Before audit

Spacing → preserve chart sizes and gaps. Color → preserve accent and semantic status colors. Icons → no changes. Copy → preserve percentage, caption and accessible readings. Typography → preserve. Layout → preserve chart centers and legend placement. Details → reproduce the WebShape error with installed dependencies; preserve the diagnostic monitor. Visuals → retain the same arcs, dash lengths and offsets. Motion → no changes.

Product: a precise workspace for independent projects and release gates.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: readable completion and task-distribution charts.
Signature: the chosen accent and meaningful status colors.

Review standard: Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0; existing visual language preserved.

## Cause and controlled patch

The installed react-native-svg 15.16.0 Web `prepare` implementation converts `origin` to the DOM property `transform-origin`. A reproduction using its actual WebShape, React DOM and React Native Web reports: “Invalid DOM property `transform-origin`. Did you mean `transformOrigin`?”. The monitor forwards the error correctly.

Replace the three chart `rotation`/`origin` pairs with SVG `transform="rotate(angle cx cy)"`. This avoids the invalid property and retains rotation around the same SVG coordinates on native and Web. All consumers (Projects, Resources and Reports) receive the shared repair. No dependency, Metro, model, data or import change; no migration required.

## Validation and reversible update

| Check | Result |
| --- | --- |
| `npm test` | **Pass** — 984 passed, 0 failed, 0 skipped; [full output](full-tests.txt) |
| Installed SVG Web + React DOM rendering | **Pass** — both actual chart render functions render without console warnings/errors; zero, partial/full, clamped/non-finite completion, empty/zero/single/multiple status series and light/dark completion variants |
| Native transform parser | **Pass** — the installed parser preserves rotation matrices and fixed centers; this is not a native visual test |
| Legend actions and accessible readings | **Pass** — callbacks and percentage readings retained |
| JS/JSX syntax and `git diff --check` | **Pass** |
| `npx expo install --check` | **Pass** — dependencies are up to date |
| Package / lock / Expo version synchronization | **Pass** — 0.8.4, Android/iOS 94 |
| Live Expo Web, Expo Go and Fast Refresh | **Not run** by the agent — physical/runtime checks remain with the owner, following the handoff testing limits |

The owner explicitly requested “commit 0.8.4 but do not push”. This authorizes the local checkpoint on `work`; physical acceptance gates remain open. No push, merge, tag, deployment or build. Unrelated handoff/ZIP changes are excluded. Git history records the checkpoint SHA.

Use normal Metro/Fast Refresh on the phone; open Projects, project details, Resources and Reports on Web and Android. Confirm arc orientation, percentages, legend actions and absence of this WebShape error. Reverting only this repair's StudioCharts change restores the previous rendering without a data migration. Preserve unrelated handoff/ZIP changes and existing user servers.
