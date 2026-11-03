# Niyarvo Projects v0.5.33 — HF5 Theme & Planning UI

## Scope and baseline

An **in-place, guarded source patch** for Niyarvo Projects v0.5.33 after **Desktop HF1, Portrait HF2, selective merge, reconciliation, and HF4 mobile-browser/colored-dependency patch**. Does not rewrite `ModernApp.js`, `layoutMode.cjs`, gesture controllers, domain files, data schema, persistence or app/package versions.

The authoritative installed HF1 sources were not available here. HF5 checks every diff hunk against the local source and refuses the *entire patch* without writing if a structure differs. Theme modules have a fallback that preserves a compatible existing ThemeProvider API rather than replacing it. Do not force a failed preflight.

## UI changes

- **RIVNA palettes:** Ten provided accent options (Aqua, Mint, Lime, Amber, Orange, Coral, Pink, Fuchsia, Violet, Indigo) with their supplied dark/light primary colors and supplied light/dark backgrounds. AMOLED uses black main background and accent-tinted dark card colors. System resolves from device mode. Accent preference key retained. Color statuses are still semantic, not arbitrarily recolored.
- **Accent picker:** Five rounded squares per row at phone widths, each showing the two RIVNA gradient endpoint colors. Selected tile uses a neutral outline and check; no decorative side accent stripe. Four appearance modes: System, Light, Dark, AMOLED.
- **Board:** Only a `Board tools` control on the board toolbar replaces the standalone search box, `High and above` chip, Filters fold and Board tools fold. The on-demand sheet contains search, High and above, due/priority/owner/tag filters, reset, per-board Power-Ups, descriptions and local commands. Counts show applied filters. Switch controls aren't nested inside button rows. The sheet is only mounted when opened; Kanban drag and card/list geometry are untouched except retaining compact spacing in this tested variant.
- **Timeline:** A horizontally scrolling control ribbon above the chart contains `Show Items`/`Hide Items`, `First Task`, `Today`, `Critical Path`, `Parent Tasks` and `To Schedule`. Zoom still uses its existing Days/Weeks/Months selector. Parent Tasks and To Schedule open the existing native/web Sheet instead of expanding long sections over the chart. A task tap still routes to the ordinary Task Sheet. Hierarchy expansion remains available; unscheduled tasks aren't deleted or automatically rescheduled.
- **Dependency colors:** Preserved HF4's stable per-link colors and critical-path color override, hit testing, routing, viewport clipping, scroll/drag and date engine.
- **Global visual preference:** No decorative vertical accent strips on buttons or active navigation entries. Structural separators and Gantt grid lines are not accent stripes.

## Actual verification

On a **representative HF4 source fixture**, not the user's running checkout:
- `node tests/run-all.cjs`: **590 total, 589 passed, 0 failed, 1 skipped**; a theme-provider compatibility variant also passed.
- New focused test: **5 passed**, checking accent values, swatches, Board tools, Timeline ribbon/sheets and absence of side accent stripes in shared controls.
- TypeScript parser for modified JSX: 0 parsing errors.
- Patch: dry-run reports expected files; apply succeeds; repeat-run reports 0 changed files.
- Not tested here: Expo Web rendering on user's browser, Expo Go/Android, actual device rotation/desktop site, Gantt drag/link gesture FPS, task modal transitions, or user workspace persistence after reload.

## Safe install (Termux)

```bash
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NP-0.5.33-THEME-UX-HF5.zip
node scripts/apply-np-0533-hf5.cjs --dry-run
node scripts/apply-np-0533-hf5.cjs
node --test tests/ui/np533-hf5-interface.test.cjs
npm test
npx expo start --clear
```

Before installation, export your workspace backup and preserve `git diff --binary`. If dry run refuses, **stop** and report its missing hunk; don't overwrite with the synthetic source fixture. No commit/push is needed for test acceptance.

## Smoke-test priorities

1. Browser phone mode: 5-column accent selection, all four appearance settings and restored selection after reload.
2. Browser Desktop site: desktop rail remains, sheet opens as right drawer, portrait mobile normal mode retains phone layout.
3. Board: search, high-priority toggle, all four filter dimensions, Clear filters; per-board Power-Ups and descriptions; unchanged drag/drop.
4. Timeline: ribbon stays horizontally scrollable, Show Items/Hide Items, First Task/Today/Critical Path; Parent Tasks and To Schedule sheets; task sheets open; dependency colors intact.
5. Verify project task data and workspace survive reload. Recheck crash/performance logs on physical Android.

**Known limit:** ThemeProvider compatibility fallback handles the common existing provider interface; unexpected additional exports or differently structured UI files cause refusal, not forced replacement. Richly populated Parent Tasks and To Schedule sheets render their list on opening, not while hidden; large lists can still need native virtualization later.
