# NP-QA-0.5.19

| Check | Result |
|---|---|
| Node tests | PASS: 467, 0 fail, 1 skipped (library guard, needs node_modules) |
| JS/JSX syntax of changed files | PASS (TypeScript parser) |
| Owner fixture through model: restore | PASS (5 projects, 1 program, 2 portfolios) |
| Owner fixture through model: import projects | PASS (5 projects) |
| Repeated restores with snapshot budget | PASS (stays about 1.15 MB over 8 restores) |
| SDK 58.0.13 File.pickFileAsync shape | CONFIRMED in node_modules source |
| Android: Import project, Restore workspace | NOT RUN (needs device) |
| iOS and web import | NOT RUN |
