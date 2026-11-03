# NP-0.5.16 — Governance buttons

- Portfolios "Open" and Programs "Open project" / "Open" now select the project and open its governance detail in Projects (previously they only switched the active project silently).
- "Edit portfolio" and "Edit program" now show the editor in place of the card (previously the form sat inside the collapsed "Manage …" section at the top, so nothing visible happened).
- "Duplicate as template" opens the new project's detail so the result is visible.
- Projects detail only renders for the selected project (no stale subtitle or wrong-project governance).
- Tests: tests/governance-open-project-0516.test.cjs. Full suite: 456 pass, 0 fail. Device/browser run: Not run.
- Rollback: restore ModernApp.js and src/screens/{Projects,Portfolios,Programs}.js from the previous ZIP.
