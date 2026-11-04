# Niyarvo Projects v0.5.57 — UI hotfix (same version)

Baseline: `NiyarvoProjects-v0.5.57-CORRECTED-FULL.zip`. Changes are limited to button foregrounds, the mobile drawer toggle, the PROJECTS mark scale/color, existing source-contract tests, and documentation.

## Observed Android problems

1. Active accent-filled buttons, such as **Finish sprint**, displayed black text on light fills despite the user requesting white. Shared `Button` and other accent-filled affordances still used the contrast-aware `c.accentInk`.
2. Mobile drawer showed a second hamburger button to the right of the drawer while the original remained behind the native Modal. The new toggle did not occupy the header's original x-position.
3. PROJECTS wordmark was a contrasting shade different from the accent-colored N monogram and too large.

## Changes

- White icons and text for primary `Button`, solid `IconBtn`, accent-filled Island, completed-task checkbox and pressable custom-color task labels. Domain status labels, form text, and unfocused ordinary controls retain their normal ink.
- When mobile menu is open, reserve the normal header toggle's space but do not render that hidden control. Render the sole visible toggle inside the drawer at its top-left edge, ahead of the brand row. It still animates three horizontal lines to three vertical and back. Backdrop and Android Back still dismiss the drawer.
- PROJECTS mask dimensions compact 48x9→38x7; narrow 94x14→75x11; full 127x18→102x14. Tint uses `c.accent` and right alignment remains.
- No theme palette values or saved settings keys changed.

## Test and device acceptance

- `npm test`: 679 total, 678 pass, 0 fail, 1 skipped.
- TypeScript parser static syntax on all `src`, `tests`, `scripts` JS/CJS: 244 files, 0 syntax errors.
- Check Android Daylight Amber and Orange, dark Lime and Mint: white text is intentional even where contrast is weak. Verify tap/close animation and that only one hamburger button is visible when drawer is open. Check the logo in all appearances and phone/desktop widths.
- No Expo Go or real browser runtime was available here; native touch/render claims must be verified by the user.
