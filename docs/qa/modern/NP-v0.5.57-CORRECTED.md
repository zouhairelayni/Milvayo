# Milvayo v0.5.57 — Corrected build handoff

**Baseline:** the original v0.5.57 FULL source ZIP. Application version remains **0.5.57**.

## Applied

- Palette: exactly the ten user-supplied accent definitions in `src/ui/theme/themePalette.cjs`. The app's existing `DEFAULT_ACCENT`, storage keys, and palette lookup are intact. AMOLED: pure black background with 0.50 card and 0.35 secondary RGB scale.
- New task: icon and label white on the primary action in Daylight only. Other buttons unaffected.
- Menu: light sun, dark outline moon, AMOLED filled moon. Hamburger has 18px strokes (vs 15px previous icon), 190ms motion horizontal→vertical on opening and reverse on closing. Open-state glyph also available on drawer overlay.
- Branding: `PROJECTS` is now a transparent monoline lettering mask resembling the existing hand-outlined `niyarvo` wordmark, tinted with the theme color and aligned right, in the brand component. Added `assets/projects-word-mask.svg` (vector source) and `.png` (React Native image).
- No new packages, permissions, migrations, data format changes, or server connections.

## Validation and limits

Run `npm test`, inspect JavaScript/JSX parsing, then check both mobile and desktop Web and Expo Go Android for the actual motion. Test all appearance choices and daylight buttons, especially white text on light Amber/Lime/Coral. White text is explicitly requested even where its contrast is less than accessibility guidance; no automatic ink replacement occurs for the **New task** action in Daylight.

For the user's Termux workflow, extract at project root. Keep `.git`, `node_modules` and local app storage. `unzip -o` does not remove previously obsolete files; `src/ui/theme/rivnaPalette.cjs` and two old root-level documents are safe cleanup targets only if still present.
