# CHG-NP-0.5.33-HF5-COMPAT

**Base:** v0.5.33 with HF4 desktop/mobile detection and colored Timeline dependencies. Existing HF5 overlay may have been extracted but original installer refused.

**Cause:** HF5 exact-text patch could not match legitimate Timeline state layout and diagnostics-test whitespace, and rejected unknown exports from the existing theme module.

**Fix:** Retain all original layout/gesture/persistence files. Replace the HF5 installer with compatibility-aware handling for the three reported refusal sites; add `src/ui/theme/rivnaPalette.cjs` to provide RIVNA palette values without replacing existing `theme.cjs` exports. Other hunks stay strict. No npm dependencies added.

**Scope:** Theme palette; Settings five-column rounded-square swatches and AMOLED; Board tools sheet; Timeline ribbon and Parent Tasks / To Schedule sheets; no decorative side accents.

**Validation:** 2 representative variants × 589 pass, 1 skip, 0 fail; 5 targeted UI checks passed in each; repeat dry run shows zero changes. Device acceptance pending.

**Root docs note:** Move leftover `CHG-NP-0.5.33-WEB-MOBILE-LINK-COLORS.md` into `docs/qa/release-notes/` to satisfy single-app release documentation invariant.
