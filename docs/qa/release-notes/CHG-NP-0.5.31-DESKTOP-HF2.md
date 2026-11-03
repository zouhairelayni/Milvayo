# Niyarvo Projects v0.5.31-DESKTOP-HF2 — Portrait Web desktop + require-cycle hotfix

## Scope
Apply **on top of** the user's existing v0.5.31-DESKTOP-HF1 installation. The latest HF1 ZIP was available as documentation but its raw bytes could not be accessed for direct editing, so this release delivers a **guarded in-place patch script**, not replacement application source files. The patch refuses unknown layout/Store signatures and leaves files unchanged when checks fail. No schema, project data, dependencies, native layout threshold, or navigation logic are modified.

## Change
1. Lower Web's auto desktop-shell threshold in `src/ui/layoutMode.cjs` from 700 to **320 CSS layout pixels**. Portrait mobile browsers around 390px will now receive desktop sidebar/rail and top toolbar without orientation changes. Native Android/iOS thresholds are unchanged. The existing Web desktop preference and menu remain in place.
2. Replace the Store's barrel import `../ui/ui` with direct `../ui/uiBase`, removing a cycle through `uiLayout` and `InlineNotice`. This affects only `T` used by Store's loading/recovery UI.
3. Add a small Node test proving portrait Web selects desktop, portrait native remains mobile, and the barrel import is gone.

## Installation (Termux, on the work branch)

```sh
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NiyarvoProjects_v0_5_31_DESKTOP_HF2.zip
node scripts/apply-np-portrait-hf2.cjs
node --test tests/ui/portrait-desktop-0531-hf2.test.cjs
npx expo start --clear
```

Reload the phone Web browser **in portrait**. On a typical 360–430 CSS-pixel portrait width, it should render the desktop compact rail and toolbar; native Expo Go portrait should keep mobile bottom tabs.

## Limits / risks
- The newest HF1 source archive could not be programmatically inspected. The guarded script has been tested against a synthetic HF1-shaped fixture, **not** the user's installed runtime. Run it locally; if it refuses, capture its terminal output instead of blindly overwriting files.
- HF1's historical test suite may contain the intentional old assertion that 390px Web used mobile layout; those assertions need revision if they fail. The new dedicated test reflects the requested behavior.
- Desktop's 72px rail plus compact toolbar may feel dense on very narrow phones. Board/Timeline/Sheets and Android gestures must be visually checked. No phone or browser runtime test was performed in this environment.
- No app data is rewritten; existing local persisted projects remain untouched. Keep your v0.5.31 source/Git checkpoint for rollback. No Git commit, push, deploy, or APK build performed.
