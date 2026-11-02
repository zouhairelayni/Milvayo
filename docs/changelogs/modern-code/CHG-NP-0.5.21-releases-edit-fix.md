# v0.5.21 fix: Releases "Edit metadata" did nothing
Cause: the button filled the form, but the form is inside a closed "Create or edit release" card at the top of the page, so nothing visible happened.
Fix: Edit metadata now opens that card (title changes to "Edit release") and scrolls to the top. `Fold` accepts optional `open` / `onToggle`. The card closes after a successful save.
Tests: 483, 0 fail. Device run: Not run. Undo: restore the batch 06 zip.
