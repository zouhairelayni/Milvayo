# CHG-NP-0.2.6 — NP-SCHED1 engine-only checkpoint

**Version designation supplied by the project owner:** v0.2.6. This maps to the previously delivered `NP-SCHED1` independent scheduling engine patch.

- `src/scheduling.cjs` supports four dependency types, signed lag, workday calendars, exception dates, pure audit, preview and stale-safe apply.
- Tests and smoke scenario were delivered in the earlier NP-SCHED1 patch.
- No v0.2.6 UI controls or persistent metadata were implemented in that checkpoint. Those are first integrated in v0.2.7.
- v0.2.7 contains v0.2.6 engine files directly; the older standalone patch does not need to be extracted separately on top of v0.2.7.
