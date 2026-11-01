# Niyarvo Projects — Complete v0.3.12 baseline and handoff

**Document set:** 2026-10-31 · **Application:** independent **Niyarvo Projects** · **Audited source:** `NiyarvoProjects-v0.3.12-LOCAL-QA.zip` (package version `0.3.12`; 186 archived entries) · **Scope:** all documented releases from v0.1.0 through v0.3.12, the v0.2.6 `NP-SCHED1` scheduling checkpoint, and **five hotfixes**: v0.3.2-HOTFIX1/2/3 and v0.3.11-HOTFIX1/2. This is a source/release-record audit, not a reconstruction of unavailable Git history.

## Reading order

1. `01-RELEASE-HISTORY.md` — chronological changes from v0.1.0 to v0.3.12, including v0.2.6/0.2.9, HOTFIX1–3 under 0.3.2 and HOTFIX1–2 under 0.3.11.
2. `02-ARCHITECTURE.md` — component and data-flow diagrams, persisted format, module ownership, constraints and boundaries.
3. `03-FUNCTIONALITY-MAP.md` — 17 user-facing screens, detailed feature coverage and maturity matrix.
4. `04-HOW-TO-USE.md` — practical step-by-step Android/Web operations, backups, examples, sprint, Gantt, Power-Ups and recovery.
5. `05-REMAINING-WORK-AND-HANDOFF.md` — prioritized technical roadmap, test gates, handoff template and non-negotiables.
6. `06-AUDIT-AND-TRACEABILITY.md` — evidence, ambiguities, verified vs unverified outcomes, source file index and release checkpoints.

## Current facts / caveats

- Current code is a **local-first Expo SDK 58, React Native 0.88.1 / React 19.3.0** app that runs through Metro for Web and Expo Go Android. The user develops on Android with Termux. iOS source exists; device tests are not evidenced.
- Project JSON format: `niyarvo.project.v1`; workspace storage: `niyarvo-projects-v1`; accent preference: `niyarvo-projects-accent-v1`.
- **Last explicitly user-confirmed baseline:** v0.3.11-HOTFIX2 works on Android and Web (drawer and logo). v0.3.12's new Kan card UI is a **QA candidate**, not yet user-accepted.
- **Fresh audit:** `npm test` on extracted v0.3.12 source: **297 passed, 0 failed**. This is not a substitute for Metro/Web, Expo Go, performance, iOS or backend tests.
- Imports of the Atlas demo succeeded on user's device following the v0.3.2 import fixes; sprint and several other screens are visible in supplied screenshots. This is not blanket acceptance of every interaction.
- No working Firebase Auth/Firestore sync/Storage attachment backend, GitHub OAuth or unattended automations. Firestore and Storage scaffold rules explicitly deny all.
- **No changes to application code have been made in this documentation handoff.** Source remains v0.3.12; packaged annotated-source variant only adds these documentation files.

## Distinguish the three names

**Niyarvo Projects** is the independent PM product documented here. **RIVNA** is an athlete app. **Niyarvo Control Center** is an unrelated private administrative application. Never combine their repositories, Firebase projects, users, credentials, databases or business logic. “RIVNA-like accent names” is only a palette design comparison, not a data integration.

## What to provide in the next chat

The latest full-source ZIP (prefer the annotated-source bundle if you use it), this document pack, user-observed device/runtime issues and the user's actual `work` commit SHA if available. Do not invent a SHA. The next model should read `AGENTS.md`, `.opencode/skills/unslop/SKILL.md`, this pack and the latest `CHG-NP-*.md` before editing.
