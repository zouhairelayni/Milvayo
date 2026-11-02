# NP-0.5.17 — Dead-code audit, Batch 1

- Board: the "Upcoming dates" Power-Up now shows a list of open tasks due in the next 30 days (tap to open the task). Previously the toggle had no effect.
- Tasks: saved views now save and restore the tag filter; the constant priority/owner values are no longer written. Old views load unchanged (tag filter defaults to "All").
- Costs: removed an unused state variable.
- Schema: `savedViews[].filters.label` added (optional string).
- Tests: tests/batch1-controls-0516.test.cjs. Full suite: 460 pass, 0 fail. Device/browser run: Not run.
- Rollback: restore src/screens/{Board,Tasks,Workspace}.js, src/planning.cjs and schemas/niyarvo.project.v1.schema.json from the previous ZIP.
- Remaining audit batches (2–4): docs/qa/modern-code/NP-QA-0.5.16-dead-code-audit.md.
