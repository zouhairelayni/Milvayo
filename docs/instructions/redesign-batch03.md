# Redesign batch 03 — use and reversible installation

The release metadata remains 0.5.59; batch 03 is identified by this guide and the cumulative changelog. No new dependencies or saved-data migration are required.

1. Export your current project/workspace through Settings → Backup. Keep the previous source folder or ZIP.
2. Extract `milvayo-batch-03.zip` into a separate project folder. It contains files directly at the project root.
3. Retain your local configuration and use your existing compatible dependency setup. On Termux run `npm test`, `npx expo install --check`, then `npx expo start --clear`. If dependencies are missing, use the repository's existing `npm ci --legacy-peer-deps` workflow in that new folder; this is not required when the compatible dependencies are already available.
4. Open the new Metro session in Expo Go and work through `docs/qa/NP-QA-redesign-batch03.md`. Do not delete the old folder before validation.
5. To roll back, stop the new Metro session, reopen the previous folder and start Metro there. Batch 03 does not rewrite storage or import formats. Export any work before clearing application data or uninstalling.

Home now opens on Today. Overdue tasks and unfinished dependencies appear under Needs attention; dated upcoming work appears under Next due. Project overview retains status shortcuts, weighted progress, release readiness, milestone/sprint shortcuts and stage distribution. The sample and empty projects offer task creation, an explicit route to Backup import, and Projects. Nothing is imported automatically.

Timeline keeps the same gesture rules and dependency lines. Its action ribbon uses quieter controls, the calendar places the weekday above the date, and the view selector and task bars have softer corners. Bar resizing still changes inclusive duration; moving keeps duration fixed.

Releases shows gate progress before detailed gates. Testing groups checks into one list with all result choices in the existing sheet. Sprints puts metrics beside the burndown and keeps lifecycle actions in Manage sprint. Expand the existing disclosures to reach the detailed controls.

Later batches remain, in order: Resources/Costs/Reports; Automations; Scheduling/Collaboration/Specifications; Settings/Backup; Projects/Portfolios/Programs. Each screen needs its own preserved-control test before delivery.
