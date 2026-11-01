# Unslop design audit — NP v0.3.2 Sprint screen

**Reference skill:** `.opencode/skills/unslop/SKILL.md`, Damir Sokolovsky (CC BY 4.0). Reviewed before this UI build. This is a source-level audit; no Android screenshot validation was possible here.

**Product:** local-first multi-project manager. **Character:** precise, quiet, trustworthy. **World:** planning workbench. **Moment:** one sprint's measured progress and task scope. **Signature:** neutral graphite, Niyarvo mark and selected accent (orange default).

| Pass | Source-before issue / goal | Implemented change |
|---|---|---|
| Spacing | No sprint view existed; avoid random gaps in new screen | 8/10/12/16 px spacing, 44 px actions, fixed card padding |
| Color | Avoid prior hardcoded purple accents | Reuse dynamic `design.colors.accent`, neutral surfaces and subdued borders |
| Icons | Avoid emoji labels and decorative icon clutter | Text-only controls; chart provides information rather than decoration |
| Copy | Make completion consequences explicit | Distinct `Start sprint`, `Finish sprint`, confirmation describing backlog return |
| Typography | Prevent small headings and excessive bold | 20/17/15/12 px scale; weight 600 for titles, normal for detail |
| Layout | Mobile must not inherit a dense desktop table | Stacked cards, horizontal sprint selector, wrapping form fields, bounded backlog |
| Details | Reflect real statuses, not placeholder counts | Task IDs, actual statuses, progress tally, true goal and dates |
| Visuals | Avoid fake sparkline or decorative rainbow bars | Real event-based burndown SVG with neutral ideal and accent observed line |
| Motion | Gesture scope needs stability | No added animations; tap controls with explicit confirmed destructive operations |

**Limits:** All other screens retain the existing v0.3.1 visual system. This does not claim a full-app redesign or screenshot/pixel QA. Real Android and Web review is a release gate.
