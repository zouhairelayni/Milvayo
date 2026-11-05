# Milvayo v0.5.9 — Device acceptance

Status: **Not run** on device. Keep v0.5.8 checkpoint until accepted.

- [ ] Governance menu group shows Projects, Portfolios, Programs in that order, each reachable.
- [ ] Timeline **navigation icon** displays horizontal bars in both bottom tab and hamburger. Timeline itself unchanged.
- [ ] Project details: open a populated project, edit project health/process group/owner/objective, navigate away and return. Fields persist.
- [ ] Documents: all ten visible; statuses and progress bars update after edits. Stakeholders show in the appropriate power/interest quadrant.
- [ ] Business case: enter example cost 1000, annual benefit 600, 3 years, rate 10%; NPV ≈ $492.11, ROI 80%, payback ≈ 1.67 years (verify rounded display).
- [ ] Risks: create a 5×4 threat and a 3×3 opportunity; inspect separate 5×5 matrices, edit response and close.
- [ ] WBS: add child, indent, outdent, reorder, switch layouts (tree/fishbone/mindmap), export CSV and SVG; files open correctly.
- [ ] Costs: task leaf estimates and logged actual labour agree with Costs screen; contingency/cost lines are additional, not duplicated.
- [ ] Programs: edit benefits, membership and roadmap; moving an existing project into a second program must be blocked.
- [ ] Portfolios: create/edit and assign projects; Program totals update and no tasks are duplicated.
- [ ] Workspace backup/export/import and snapshot restore retain governance docs, risks, WBS, benefits, programs and portfolio membership.
- [ ] `examples/atlasproject.json` import: ONLY after saving a real workspace backup; imports Atlas plus three samples and relationships.
- [ ] Existing Kanban, Timeline, Sprints, tasks and Dynamic Island notification behavior unchanged.
- [ ] `npx expo-doctor` passes on current Termux install; project remains compatible with user's locally corrected manifests.
