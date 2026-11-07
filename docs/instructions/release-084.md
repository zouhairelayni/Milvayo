# Milvayo 0.8.4 — update and verify

Applied in place on `work`; package/lock/Expo version 0.8.4, Android/iOS build 94. The owner authorized the local commit and explicitly prohibited pushing. No dependency, Metro or data-format change; no migration required.

Keep workspace/board JSON backups outside the project. Use the usual Termux `npx expo start` and Expo Go/Fast Refresh workflow; do not clear app storage.

1. Reload Web and open Projects, project details, Resources and Reports. Confirm the WebShape error is gone and completion/status arcs keep their orientation, percentages and colors.
2. Check empty, partial and complete progress and the Reports status legend actions.
3. Open the same screens on Android and check arc positions and readings. Native visual acceptance and Fast Refresh were **Not run** by the agent.

See [cause, validation and remaining gates](../qa/release-084/REPORT.md). Existing Canvas acceptance gates and the separate unclassified startup artwork issue remain open.

For rollback, use the 0.8.3 checkpoint `bf6281c` in a separate checkout or revert the 0.8.4 release commit after preserving local edits. No data conversion is needed; rollback restores the prior chart warning. Keep unrelated handoff/ZIP files intact. No push or main merge is part of this update.
