# Unslop review — NP 0.2.7 scheduling UI

**Source skill:** bundled `.opencode/skills/unslop/SKILL.md` by Damir Sokolovsky, CC BY 4.0. This review applies to the **new** scheduling modal and Timeline entry, not to a blanket full-app visual overhaul. Device screenshots were not produced in this environment.

**Direction:** precise multi-project planning instruments; calm and reliable; graphite surfaces; schedule visualization as the hero; restrained violet active state.

| Pass | Observed source-level result | Device QA |
|---|---|---|
| Spacing | Uses 4/8/12/16/24 spacing, predictable vertical sections; 40px action rows and 44px inputs | Pending |
| Color | Imports existing Niyarvo graphite/violet tokens, reserves amber for scheduling warnings, green for healthy state | Pending contrast check |
| Icons | Single Ionicons family; 20–24px icons for modal title and close, otherwise text controls | Pending |
| Copy | Specific action labels (Preview successor dates, Apply changes and save recovery snapshot), no promotional language | Pending localization |
| Typography | Three small readable roles: 11/12px meta, 13px controls, 15–17px headings, restrained weights | Pending on-device accessibility check |
| Layout | Scrollable full-height Android modal, max-width 700px desktop; grouped calendar, relations, audit, preview sections | Pending portrait/landscape |
| Details | Rounded 8–14px surfaces with hairlines; destructive/disabled states differentiated; no gradients/shadows | Pending |
| Visuals | No decorative chart or mock data; uses the real per-project tasks and edges | N/A |
| Motion | Minimal modal slide; no animations that obscure task changes; explicit preview/apply | Pending |

**Honest limitation:** source review does not prove visual polish. User's Android/Web runtime acceptance is required before release. Existing broad UI appearance is intentionally preserved in this batch, not claimed redesigned.
