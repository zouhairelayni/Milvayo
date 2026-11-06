# Milvayo 0.7.0 — redesign promotion

Owner approved the 0.7.0 source promotion on 2026-11-06 and subsequently reported a successful Expo build. The owner then explicitly requested removing the redesign/temporary copies, creating a detailed 0.7.0 commit and pushing to `work`. This authorizes the checkpoint and branch push; no new build, deployment or merge to `main` is performed by this cleanup. Package/lock/Expo versions remain 0.7.0 / Android 70 / iOS 70.

## Controlled scope and rollback

Promote the entire app source, tests, assets, public files, project configuration and installed dependency tree. Synchronize with deletion so main-only application files and package remnants cannot survive. Preserve the main `.git`, signing credentials, local environment files and the redesign source checkout (archived outside the app after parity verification). Preserve owner design examples and the supplied first-run ZIP.

Remove superseded 0.5.33 patch/version installer scripts, the old package manifest backup, superseded root handoffs and hotfix/theme patch root READMEs. Remove generated Android projects with the obsolete com.niyarvo.projects identity/version and local `.expo` caches from both folders; current app.json and its plugins are the source of truth for future generation. This operation does not generate native projects or run builds. Existing native-module fixes still require a separately installed compatible app binary.

Before copying, a private archive and SHA-256 inventory of the original main project are stored outside the repository; the previous node_modules tree will be moved alongside them. Restoration means stopping this app’s Metro session, moving the promoted files aside, extracting that archive in the main folder and restoring its saved node_modules. Never clear app storage or reinstall to perform this source update. AsyncStorage keys, normalized data and import/backup formats require no migration.

## Test reconciliation

Run the existing Node regression suite once to identify stale source/UI assertions versus actual regressions. Preserve domain, data isolation, backup, scheduling, gesture and persistence coverage. Reconcile changed UI expectations with the accepted redesign and retain behavioral assertions. After promotion the independent source checkout is archived outside the main folder; folder checks scan the entire active project.

## Verification

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Full `npm test` from the promoted main folder | **Pass** | 799 passed; zero failures, skips or cancellations. Two test processes; about 125 seconds. `tests.txt`. |
| Source / JSX syntax | **Pass** | 193 entry/source files parse; 23 native files transform with the installed Expo Babel/worklet toolchain. `source-check.json`. This is a source transform, not a build or native runtime result. |
| Expo compatibility | **Pass (offline)** | `npx --no-install expo install --check` reports dependencies up to date, with Expo’s warning that offline validation is unreliable. `expo-dependency-check.txt`. |
| Installed dependency graph | **Pass** | `npm ls --all --json` reports no dependency problems. No new versions installed. |
| Runtime source reachability | **Pass** | Every remaining source module is reachable from the Expo entry across platform variants or from an app config plugin. `source-reachability.json`. |
| Main Git and signing/environment files | **Pass** | Branch `work` and HEAD unchanged; four existing private signing/config files match their original SHA-256 hashes. No credentials printed or changed. |
| Final content parity / cleanup | **Pass** | Zero source or dependency checksum differences; 98 original files removed. The superseded source was then archived outside the app, leaving one active dependency tree. |
| Post-archive folder / metadata / migration checks | **Pass** | 14/14 after removing the nested checkout and its temporary folder-check exclusion. `final-folder-metadata-tests.txt`. |
| Git whitespace | **Pass** | `git diff --check`. |
| Web, Expo Go, APK, OS background/process behavior | **Not run** | No Metro, browser, device, emulator or native runtime was started for promotion. Existing historical QA is not acceptance evidence for 0.7.0. |
| Owner Expo build | **Pass (user reported)** | Owner reported a successful build before authorizing the checkpoint; build output was not independently inspected. |
| Agent builds, Playwright, deployment | **Not run** | No additional build or deployment. |
| Git checkpoint / branch push | **Authorized** | Owner requested a detailed 0.7.0 commit and push to `work`; final response records the verified commit and push result. |

The original baseline ran 848 tests: 791 passed and 57 failed. Forty-eight failing tests were obsolete visual/source snapshots enforcing replaced colors, masked wordmarks, notification stages, literal spacing or old action placement. They were retired explicitly (see `retired-ui-contracts.json`), with current coverage in `tests/ui/current-design-contracts.test.cjs` and the retained behavioral flow suites. Twelve new checks exercise the current named Board brand, notice persistence/exit/Backup/read-more behavior, reduced motion, touch targets, field focus, sheet Back/escape/swipe/close, phone headers, pinned timeline, frozen tabs/tour notice host, bounded history search and automation menu callbacks. Nine failing tests were reconciled in place: the shared-module import graph, current sprint/segmented/timeline controls, chart test mocks and palette expectations. Frozen history and all data, security/backup, scheduling, import and active gesture regressions are retained.

The source graph also identified eight orphan modules: the duplicate Sprints screen, obsolete sidebar/layout and viewport helpers, old governance UI/theme re-export shims, legacy design aliases and the unused progressive-count helper. Their twelve orphan-only tests were removed with them. The old theme alias test now exercises live palette tokens instead. `removed-obsolete-files.json` inventories the cleanup. Release-numbered filenames that remain contain applicable regressions; they are not superseded copies of the application.

The dependency check initially exposed that the candidate’s 32 npm CLI entries were non-executable regular copies. Recreated their package-declared relative `.bin` symlinks and restored executable target modes in both folders. The actual Expo CLI and offline dependency check then ran successfully. No dependency version, native compilation or package install script was needed. The stale node_modules screenshot/runtime cache was moved outside the app along with the rollback material.

## Final cleanup and rollback

The active application is `/mnt/Milvayo`, with one source tree and one installed dependency tree. Versions remain **0.7.0**, Android **70**, iOS **70**. User design examples, the supplied first-run ZIP, Git history and private signing/environment files are retained.

After the owner reported a successful Expo build, the temporary `/mnt/milvayo-pre-070-20261106T161452Z` folder (including the archived redesign checkout, original dependency tree, old generated projects and scratch cache) and Milvayo scratch files/directories in `/tmp` were removed at the owner’s explicit request. The earlier archive locations mentioned in the historical promotion steps are no longer available. `cleanup-verification.json` records the removed paths and final checks.

Rollback now uses Git: the pre-promotion `work` checkpoint is `462970f6cb6ec2cb44e58f34ecc3cb1f4214a377`. Review or restore that checkpoint’s source and lockfile in a separate checkout, or explicitly revert the 0.7.0 checkpoint, then restore matching dependencies and validate before replacing the active source. Keep signing files and device app storage untouched. Never clear app data or reinstall merely to roll source back. No data/import schema migration was introduced.
