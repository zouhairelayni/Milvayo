# Milvayo 0.7.14

Independent, local-first project management for Android, iOS and Web/PWA, using React Native and Expo SDK 58. The approved premium redesign is now the main application. Android versionCode and iOS buildNumber are 84.

The app includes Board and Timeline planning, tasks, sprint history, releases, workspace/project management, charts, inline calendars and a first-run tour. More → Take the tour replays onboarding. Theme changes remain separate from optional launcher-icon changes.

## Work locally in Termux

Use the main Milvayo folder. The redesign source, tests, lockfile and installed dependencies were promoted together; keep them together on later updates. Existing app storage and backup/import formats are unchanged.

```sh
cd ~/Milvayo
npm test
npx expo install --check
npx expo start
```

Open the development session in a compatible Expo Go/client or browser. This source update does not replace native modules in an installed APK: native launcher-icon and process-exit adapters require a compatible app binary. The 0.7.0 checkpoint was built and approved by the owner. The 0.7.1–0.7.9 source update adds cold-start playback, gradient icons, back navigation and focused controls/notification changes. No new build was run for this update. The owner subsequently authorized the 0.7.9 commit, push to `work` and merge into `main`; Git history records that checkpoint.

Android may pause JavaScript in the background or terminate the process. Completed encrypted backup material is retained for later download on native platforms; download Web backups before reloading. In-app completion messages appear when the app resumes; they are not OS push notifications. Encrypted backups preserve authenticated encryption and full password verification.

## Engineering references

- [Cumulative release history](docs/changelog/CHANGELOG.md)
- [Current update and validation](docs/qa/release-0712/ENGINEERING-REPORT.md)
- [0.7.1–0.7.9 controls and startup](docs/instructions/releases-071-079.md)
- [First-run tour](docs/instructions/first-run-tour.md)
- [Backup format](docs/instructions/niyav-format.md)
- [Design system](DESIGN.md)
- [Engineering rules](AGENTS.md)

Historical QA documents describe their original release and are not runtime acceptance evidence for 0.7.0. The superseded redesign checkout and temporary promotion copies were removed after owner build confirmation, leaving one active app and dependency tree. Work stays on Git `work`; checkpoints and pushes require explicit owner instruction.

Performance repair designated **0.7.10**: faster cold-start sequencing, layout-ready native logo playback, production commit/work timing, native Projects virtualization and five-card Board lists with scroll-triggered loading. No new dependencies or data migration. This repair is included in the owner-authorized 0.7.11 checkpoint; no agent build was run. Evidence and Android acceptance: [engineering report](docs/qa/startup-repair/ENGINEERING-REPORT.md), [test guide](docs/instructions/startup-performance-repair.md).

The **0.7.11** checkpoint adds one left-side Board creation sheet, confirmed board deletion, always-available task planning, header-only List search/Tools, three-row scrollable Due soon and left-side sprint creation. Timeline presets remain in Timeline options. Usage and acceptance: [0.7.11 guide](docs/instructions/release-0711.md). The owner subsequently authorized its commit/push only to `work` (074a734).

Current **0.7.12** adds cached WBS diagrams, bounded native SVG cameras, interactive full-screen inspection and full-diagram SVG/PNG/CSV export. No new dependencies or schema changes. See [diagram usage and Android acceptance](docs/instructions/release-0712.md) and [engineering evidence](docs/qa/release-0712/ENGINEERING-REPORT.md). Owner authorized commit/push only to `work`; no merge to `main` or agent build.
