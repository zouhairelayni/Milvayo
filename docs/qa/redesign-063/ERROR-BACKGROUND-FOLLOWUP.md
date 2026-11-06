# Error capture and background lifecycle follow-up — 0.6.3

Scope: diagnostics behavior in existing redesign/work; no UI redesign, builds, dependencies, storage/schema migration, push or parent integration.

Confirmed defects: startup awaited the previous diagnostics read before installing console/global-error/AppState hooks, so errors/background transitions during a slow read were missed. console.error used the ordinary 200ms write delay; ordinary events raised while already backgrounded could also wait on a suspended timer. Clear reset active=true and a late startup read could restore cleared previous-session data. A late startup/native-exit continuation could recreate work after Fast Refresh disposal. Web had no explicit pagehide/pageshow flush path.

Controlled plan: issue the prior-session read first; synchronously attach capture/lifecycle hooks before awaiting it. Keep ordinary foreground batching, but immediately persist console errors, explicit errors, background events, clear and page-hide transitions. Preserve actual activity state on clear; guard late reads by the clear generation and disposal state. Retain original handlers/privacy and failed-write retry. Add focused startup, background/resume, error, clear/load race, web and disposal tests. Native termination remains subject to OS async-storage delivery; this is not a promise to capture every process death.

Additional confirmed native Board defect: stationary-hold, delayed title-open and active drag timers only stopped on touch termination/unmount, with no AppState cancellation. Controlled extension: cancel a backgrounded interaction, release scroll lock through existing onCancel, invalidate delayed title measurement/opening, and ignore stale touch-up until a new foreground touch. No committed move/drop on background; preserve the approved gesture implementation and lift style. Before review (Unslop by Damir Sokolovsky, CC BY 4.0): spacing/color/icons/copy/type/layout/visuals unchanged; details prevent stale tap/drop; motion resets only interrupted gestures. Product: precise workspace; character: calm/exact/dependable; world: planning instruments; moments: direct Kanban movement; signature: personal accent and Board mark.


## Implemented behavior

- The previous-session storage read starts first, then global error, console, AppState and web lifecycle hooks attach synchronously, before awaiting it. A slow/failed read cannot leave startup capture inactive.
- JS exceptions and console errors bypass the ordinary foreground batching window. Console messages remain withheld in persisted events; exception fields still pass through the existing redaction/bounds. Original error/warning/global handlers continue receiving the original calls. Error-like objects retain their name/message/stack instead of becoming an unhelpful object string.
- Initial background state is respected. Inactive/background transitions, pagehide and further background breadcrumbs request an immediate save. Foreground/pageshow restores ordinary batching. Resume and clear reset timer-delay accounting, so suspended time is not a new JS stall.
- Clearing reports keeps actual activity state. Clear-generation and disposal guards prevent a late startup/native-exit response from restoring cleared evidence or recreating timers/hooks. Synchronous and asynchronous native-history failures cannot reject startup.
- Fast Refresh flushes a pending batch, removes AppState/web listeners and intervals, restores original handlers, and ignores late continuations.
- Native Board backgrounding cancels pending holds, delayed title opens and active drags. Existing onCancel releases scroll lock; no onDrop/move mutation is committed. Shared offsets reset for the active item; stale touch releases and stale async title measurements cannot open/edit/drop anything after resume. A new foreground touch works normally. The approved lift, scaling, tilt, responder/scroll arbitration and Timeline implementation are retained.

## Verification

| Check | Result |
| --- | --- |
| Focused diagnostics, native Board lifecycle, existing gesture/drop/rename rules, native-exit reader, zoom cancellation and folder/import checks | **Pass — 43/43**, `error-background-tests.log` |
| Source/test syntax (6 files) and native Board gesture Babel/worklet transform | **Pass**; source transform only, no bundle/build |
| Whitespace | **Pass**, git diff --check |
| Expo compatibility check | **Pass with limitation**, offline says dependencies up to date and warns validation is unreliable; `error-background-dependencies.log` |
| Version metadata | **Pass**, package/lock/root-lock/Expo 0.6.3, Android/iOS 63 |
| Parent integrity | **Pass**, 761 baseline files unchanged; `error-background-parent-check.json` |
| Device/browser runtime, Metro/Fast Refresh, actual OS suspension/process death | **Not run** |
| Full heavy suite, builds, commits, pushes, main integration | **Not run**, existing constraints |

Regression cases cover slow startup with global/console errors, original handler forwarding and privacy, initial background state, background/clear/read races, resumed batching and timer accounting, native-history success/fail/clear/dispose cases, web pagehide/pageshow cleanup, repeated-background cancellation, stale release suppression, delayed title measurement/timer invalidation and successful new foreground drags. These are deterministic harness checks, not proof that an OS write has finished before termination.

## Phone acceptance / reversal

In the existing `~/Milvayo/redesign` Metro/Fast Refresh workflow, background and resume from Home, Board and Timeline. Repeat during a held list/card and check there is no committed move, delayed task sheet or stuck scroll lock on return; start a fresh drag afterward. In Settings → Diagnostics, clear a report, background/resume, then copy a fresh report and check the activity state and that suspension is not counted as a JS stall. Verify normal warning/error display still works. Web lifecycle acceptance also remains pending.

**Limits:** no specific new device crash log was supplied for this follow-up. This repairs proven source lifecycle/error-capture defects; it does not establish that all native crashes are fixed. Immediate persistence is still asynchronous and Android/iOS can terminate/suspend JS before a write completes. Native OS exit evidence remains the existing adapter's responsibility; missing clean exit is not proof of a crash.

No dependency, storage key, model, import-format or migration change. Work remains in redesign/work. Reversal is using the untouched parent app; explicitly export any new candidate data before switching copies. Do not uninstall/clear data. Main integration requires separate owner approval.
