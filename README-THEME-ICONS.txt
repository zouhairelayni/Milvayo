Milvayo v0.6.0 — theme-synchronized native/PWA launcher icon patch

Source: milvayo-rebrand.zip; only targeted files included. 29 alternate native
icons plus 1 primary, all 10 accent colorways × 3 appearances.

INSTALL (in Termux)
  cd ~/Milvayo
  unzip -o ~/storage/downloads/Milvayo-v0.6.0-Theme-Icons.zip -d .
  npm install expo-alternate-app-icons@8.0.0 --legacy-peer-deps
  node --test tests/ui/theme-launcher-icons-060.test.cjs
  npm test

If a previous GitHub workflow checks app icons, this patch upgrades that test
so it checks real native+PWA theme synchronization rather than favicon-only.

Native icons require a NEW APK/iOS build: Expo Go cannot switch launchers.
Your GitHub Actions APK workflow already runs expo prebuild --clean, which will
embed the native icon resources when the package is installed and lockfile updated.

On web the browser tab icon and manifest switch immediately; existing installed
PWA home-screen icons are cached by the OS/browser and may require uninstalling
and installing the PWA again after the selected theme is applied.

The plugin uses Android activity aliases and iOS native icon switching. Android
launcher refresh can be delayed; iOS may display a confirmation alert.
Android OS-level Themed Icons can override the color with system monochrome tint.

No Git metadata, test version changes, keystore, node_modules or workflows included.
Do not commit/re-tag v0.6.0 until native prebuild and tests are confirmed.
