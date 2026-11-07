# Updating to 0.7.14

Update in place on `work`. Keep app storage and your ZIP files; no packages or schema conversion. Run `npm test` and `npx expo install --check`. The agent does not start Metro or run builds. Use your existing Termux/Expo Go session to validate the app when convenient.

Open Board, Timeline, List and Sprints once, then switch rapidly among them. Confirm immediate/cached content has no loading text flash; only actual first preparation may show neutral shapes. Check light/dark/AMOLED, portrait/landscape, large text and reduced motion. Existing filters, scroll position, task edits, Sprint frozen history and attached Timeline header/chart must persist. A render failure must show the established retry boundary, not endless skeletons.

Rollback after saving newer changes: reverse the 0.7.14 commit on `work` or inspect 0.7.13 in a separate checkout. Never clear storage or reset over newer changes. Save the uncommitted 0.8.0 work separately before testing earlier checkpoints.
