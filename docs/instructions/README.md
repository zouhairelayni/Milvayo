# Using Niyarvo Projects

This application is an independent, local-first project-management app. The commands below assume Android Termux and a checkout at `~/NiyarvoProjects`.

## Development

```sh
cd ~/NiyarvoProjects
npm ci
npx expo start --clear
```

Use Expo Go to open the Android app and the Metro Web URL to verify the browser. Avoid opening the same workspace simultaneously in multiple clients and assuming it syncs across devices: it is local-first.

## Updates and recovery

- Make an in-app Backup before replacing application source. A source ZIP **does not** include your device's saved workspace.
- Apply full releases from the repository root: `unzip -o ~/storage/downloads/<release>.zip`. This overwrites matching files, but **does not delete obsolete files**.
- Run `npm test`, then `npx expo start --clear` and check the app on your phone.
- Do not commit or push until actual device acceptance.

## Common workflows

- **Tasks:** open Tasks and use New task. Save explicitly; closing without Save discards a new draft. Tasks > Tools includes filtering and configuration.
- **Board:** choose a board along the top; Tools groups filters and board preferences. Move cards with hold-drag. Show more reveals additional cards in a column.
- **Timeline:** move or resize scheduled bars, use the header to set Days/Weeks/Months, and use the ribbon to jump to Today or the first task.
- **Governance:** Projects, Portfolios, and Programs can be created from their own screens.
- **Backup:** Settings > Backup creates/opens workspace and project backups. For encrypted exports, choose a strong password and confirm it before starting; keep that password because it cannot be recovered.

## Files

- `docs/changelog/CHANGELOG.md`: the single cumulative release history
- `docs/qa/`: historical and current QA evidence
- `docs/instructions/niyav-format.md`: backup encryption format
- `docs/instructions/historical-*`: archived v0.3.12 handoff material, not current usage instructions

- `android-apk-first-build.md` — Niyarvo Projects signed preview APK setup using GitHub Actions / EAS.
