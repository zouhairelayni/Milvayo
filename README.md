# Milvayo 0.7.0

Independent, local-first project management for Android, iOS and Web/PWA, using React Native and Expo SDK 58. The approved premium redesign is now the main application. Android versionCode and iOS buildNumber are 70.

The app includes Board and Timeline planning, tasks, sprint history, releases, workspace/project management, charts, inline calendars and a first-run tour. More → Take the tour replays onboarding. Theme changes remain separate from optional launcher-icon changes.

## Work locally in Termux

Use the main Milvayo folder. The redesign source, tests, lockfile and installed dependencies were promoted together; keep them together on later updates. Existing app storage and backup/import formats are unchanged.

```sh
cd ~/Milvayo
npm test
npx expo install --check
npx expo start
```

Open the development session in a compatible Expo Go/client or browser. This source update does not replace native modules in an installed APK: native launcher-icon and process-exit adapters require a compatible app binary. The owner reported a successful Expo build and authorized the 0.7.0 Git checkpoint on `work`. No additional build or deployment is performed by the checkpoint.

Android may pause JavaScript in the background or terminate the process. Completed encrypted backup material is retained for later download on native platforms; download Web backups before reloading. In-app completion messages appear when the app resumes; they are not OS push notifications. Encrypted backups preserve authenticated encryption and full password verification.

## Engineering references

- [Cumulative release history](docs/changelog/CHANGELOG.md)
- [Promotion verification and rollback](docs/qa/release-070/PROMOTION-REPORT.md)
- [First-run tour](docs/instructions/first-run-tour.md)
- [Backup format](docs/instructions/niyav-format.md)
- [Design system](DESIGN.md)
- [Engineering rules](AGENTS.md)

Historical QA documents describe their original release and are not runtime acceptance evidence for 0.7.0. The superseded redesign checkout and temporary promotion copies were removed after owner build confirmation, leaving one active app and dependency tree. Work stays on Git `work`; checkpoints and pushes require explicit owner instruction.
