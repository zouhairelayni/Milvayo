# Niyarvo Projects — engineering instructions

**Product:** Independent project-management app, React Native + Expo SDK 58 for Web/PWA, Android and iOS. It is not RIVNA and is not Niyarvo Control Center.

## Mandatory workflow before EVERY build or UI change

1. Read `.opencode/skills/unslop/SKILL.md` and relevant references. This is the original Unslop skill by Damir Sokolovsky (CC BY 4.0); keep its credit and attribution. Use the skill as a **review standard**, not permission to replace the existing Niyarvo visual language.
2. Identify the exact screen and workflow, write a before-audit (`spacing → color → icons → copy → typography → layout → details → visuals → motion`), and set the skill's five-line product direction. If current UI is good, preserve it; fix only observed defects.
3. Review existing code paths, model constraints, previous change logs, and tests before editing. Design from established architecture and interaction patterns, but implement original code; never transplant third-party source, assets, or branded UI.
4. Plan controlled patch scope; preserve the stable Metro setup, existing data and import format, and existing verified workflows. Record any migration requirements explicitly.
5. Implement model / security invariants first, then UI. Add tests for success, failure, edge cases, and persistence/import round trips. Prefer pure, deterministic functions for scheduling and dependency logic.
6. Run `npm test`, check JSX syntax, and run `npx expo install --check`; test Web and Expo Go with `npx expo start` and Fast Refresh. If device/browser testing cannot be run in this environment, say **Not run**; never claim a source check equals runtime acceptance.
7. Deliver complete project-root ZIP, `CHG-NP-[VERSION].md` standalone and inside ZIP, results with Pass/Fail/Not run, focused QA scenarios, and a reversible installation plan.
8. Work on Git `work`. Never force-push, commit, deploy or merge automatically. User validates on Termux before a checkpoint; only merge to `main` after passing acceptance gates.

## Architecture / safety

- Local-first data currently uses AsyncStorage. Do not weaken normalization, backup recovery, dependency-cycle checks, release verification or audit trail.
- Niyarvo Projects will later use **its own separate Firebase project** for Auth, Firestore sync, file uploads and Hosting. No credentials, Firebase IDs, schemas, repos or data from RIVNA/Control Center.
- No automatic import of existing engineering roadmaps; only explicitly user-invoked imports.
- Do not claim real-world GitHub merges, payments or releases from local SHA/status records.
- Phone-only user develops in Android Termux using Metro/Fast Refresh; never require a desktop-only build workflow.
- No additional package dependencies without need and version compatibility checks.

## UI direction, from the existing Niyarvo design

- **Product:** a precise workspace for managing independent projects, tasks, schedules and release gates.
- **Character:** calm, exact, dependable.
- **World:** planning instruments and quiet technical workbenches.
- **Moments:** the Gantt diagram, Kanban task movement and verified progress are the content-rich moments.
- **Signature:** one user-selected accent (default Claude clay orange) and meaningful dependency/status colors.

Keep dark neutral chrome, readable task content, consistent spacing, touch targets and the Niyarvo mark. Do not add glow, gradient text, badges or decorative animation.
