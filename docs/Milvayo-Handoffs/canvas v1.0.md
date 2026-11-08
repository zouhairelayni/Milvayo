# MILVAYO CANVAS — v0.8.0 Product, Architecture & Codex Integration Specification

> **Document:** `canvas.md`\
> **Target release:** Milvayo `0.8.0`\
> **Status:** Approved product direction; engineering specification, **not** a claim that the current source has been audited or these features already exist.\
> **Repository:** `~/Milvayo` — main application source\
> **Integration branch:** `work`\
> **Dependency gates:** Complete, validate and checkpoint **v0.7.13** and **v0.7.14** first.\
> **Guiding principle:** **Milvayo's source-of-truth project-management modules remain authoritative; Canvas is their connected visual workspace.**

---

## 0. Codex mission and execution contract

Implement an integrated, theme-aware, performant **Milvayo Canvas** available under **More → Project Tools → Canvas**, while simplifying the Work Breakdown Structure (WBS) artifact to **Outline | Diagram**. Canvas is a flexible whiteboard for brainstorming, notes, cards, relationships, native diagrams, linked project artifacts, tasks and timeline-derived roadmaps.

Canvas is **not** a third WBS tab, a replacement for existing documents, a parallel project database, or a real-time multiplayer whiteboard. The project owner/PM alone controls who may **View** or **Edit** each Canvas board. Other users may view or edit only when explicitly granted access **and** when backend authorization is enforceable.

Before writing code, map the real codebase's navigation, WBS/document structure, task/store models, exports, existing gesture system, theme tokens, auth and persistence. Avoid inventing API paths or duplicating components without inspecting the source. Record deviations and dependencies in the implementation handoff.

### Dependencies and release order

| Order | Release | Gate / completion signal |
|---|---|---|
| 1 | **v0.7.13** | Tree Top Down gesture performance fixed; full-screen orientation switch implemented; outstanding export accessibility crash fixed if present; user confirms on Expo Go |
| 2 | **v0.7.14** | Board, Timeline, Tasks and Sprints use polished, performant, structure-matched shimmer skeletons; no fake loading; user confirms |
| 3 | **v0.8.0** | WBS tab consolidation and the separate integrated Canvas capability described below |

**Do not start Canvas implementation until both prerequisite releases have been tested and approved.** The three deliverables are separate prompts and version bumps, not one oversized release commit.

### Product boundaries / non-goals for v0.8.0

- **No real-time multiplayer:** no live shared cursors, presence badges, simultaneous pointer drawing, WebSocket/CRDT engine, or collaborative live-editing claims.
- Do not silently sync Canvas object movement back into tasks, WBS hierarchy, dates, costs or risk rankings.
- Do not embed Canvas as a WBS tab, create a new primary bottom-navigation tab, or crowd Project Artifacts with whiteboard tools.
- No forced Firebase migration or invented cloud permissions. Integrate with the actual existing backend only if present and securely verifiable.
- No indiscriminate import of every artifact as editable duplicates. Source links and explicit snapshots have distinct semantics.
- No giant always-mounted diagram trees, global per-frame React updates, or web-only gesture solutions that fail on Android.
- Do not rebuild Board, Tasks, Timeline, Sprints or the already-working diagram cache to deliver Canvas.

---

## 1. Product intent and navigation architecture

Canvas is the **visual integration hub** for Milvayo. A project manager can build connected strategy maps, risk workshops, work breakdowns, delivery roadmaps, decision boards and brainstorming spaces from live project elements.

### 1.1 Navigation map

```text
Milvayo
├── Project Artifacts (existing project-management documents)
│   ├── Project Charter
│   ├── Risk Register
│   ├── Stakeholder Register
│   ├── Work Breakdown Structure (WBS)
│   │   ├── Outline     [canonical hierarchical editing]
│   │   └── Diagram     [Tree | Fishbone | Mind Map selector]
│   └── Other artifact documents supported by the current app
│
├── Tasks / Board / Timeline / Sprints / Projects / ... (unchanged)
│
└── More
    └── Project Tools
        └── Canvas
            ├── Canvas library / board manager
            ├── New board (blank or template)
            └── Board editor / interactive viewer
                ├── Brainstorming objects
                ├── Linked Milvayo objects
                ├── Native diagrams / connections
                ├── Roadmaps and annotations
                ├── Notes and comments
                └── Export / board settings / owner-managed access
```

### 1.2 WBS consolidation: **Outline | Diagram**

Keep the WBS under Project Artifacts, alongside the existing Charter, Risk Register, Stakeholder Register, etc. The WBS artifact exposes **only two top-level internal tabs**:

| Tab | Ownership and behavior |
|---|---|
| **Outline** | Canonical editor for hierarchy, work packages, task titles and related WBS metadata (respect current business logic) |
| **Diagram** | One presentation tab with a compact selector for **Tree**, **Fishbone** and **Mind Map**. It visualizes the same canonical WBS, rather than storing three separate task trees. |

**Selector design:** draw original, clean, theme-aware SVG icons—Tree (light/white when selected in dark mode), Fishbone (simple spine/branches, optionally stylized `>->` silhouette), Mind Map (network nodes). Include visible text labels and accessible names; do not rely on ambiguous icons alone. Use adequate mobile touch targets, compact spacing and a premium selected state.

Inside **Diagram**, retain:
- Tree Top Down ↔ Left to Right selector in **both embedded and full-screen** views (must already be working from v0.7.13).
- Diagram caching by project/type/orientation/relevant data revision.
- Full-screen interactive pan/zoom, Fit, Reset, close and accessible export actions.
- High-fidelity PNG, SVG and meaningful structured CSV export; fix any remaining Android feedback crash before reusing export components.
- Source-related actions such as **Add to Canvas**, without navigating away or modifying the underlying WBS.

Canvas does **not** live inside either WBS tab.

### 1.3 Canvas entry and board library

The **More → Project Tools → Canvas** entry opens a library, not an automatically instantiated heavy board. The library should support:

- List/search/filter canvases by project, name, owner and last updated; show accessible/private/shared status accurately.
- Create a blank board or a purpose-built template; rename, duplicate, archive, delete (with confirmation/recovery policy) and reopen boards.
- **Multiple canvases per project**, such as Strategy Canvas, Risk Workshop, Delivery Roadmap and Team Brainstorm.
- Clear project context and source references; prevent accidental insertion from unrelated projects.
- Board thumbnail/preview with lazy generation, not full board engine mounting in each list cell.
- On mobile, a readable manager with concise actions; on desktop/web, use a richer list/grid without changing fundamental workflows.
- Deep links / **Add to Canvas** actions from eligible project artifact screens that open a board picker or create a board, then place a linked representation on the chosen board.

Project-first organization is required now. The data model may support multi-project boards later, but cross-project editing and portfolio-wide sharing are **not v0.8.0 scope**.

---

## 2. Canvas interaction and visual design

### 2.1 Visual direction

Follow Milvayo's premium, restrained design system and current color tokens. In light theme use warm-white/light surfaces; in dark theme use a readable charcoal/near-black board. Prefer subtle dot/grid guides, minimal chrome, unintrusive selection indicators and balanced contrast. Do not copy Miro's interface or add decorative clutter.

**Phone portrait:** contextual floating bottom toolbar, compact top title/menu, safe-area-aware zoom controls, bottom-sheet inspectors, and one-handed touch targets where possible. **Phone landscape/tablet/desktop:** side tool rail or contextual floating toolbar, keyboard shortcuts and expandable property panel. Keep the canvas itself maximally visible.

### 2.2 Minimum interaction set

| Action | Required behavior |
|---|---|
| Pan | Touch-drag on empty space, or explicit hand tool; do not steal drags meant for cards |
| Zoom | Two-finger pinch around focal point on Android; wheel/trackpad zoom on web; Zoom +/−, Fit All and Reset controls |
| Create | Sticky note, text, shape, connector, frame/group, independent card, native mind map/tree/fishbone, and linked project item |
| Select | Tap/click object; multi-select with appropriate platform affordance; visually obvious selected state |
| Edit | Inline text/note editing; resize, move, reorder, align and group where supported; no accidental mutations from pan gestures |
| Connect | Arrows/lines anchored to objects; sensible rerouting on move/resize; optional labeled relationships |
| Arrange | Duplicate, copy/paste where feasible, layer order, lock/unlock; canvas-level undo/redo |
| Navigate | Minimap or Fit All for large canvases if efficient; clear current zoom and pan status |
| Comment | Attach a thread to an object or fixed board position; reply/resolve where permission permits; persist to board data |
| Export | Full-bounds high-fidelity PNG, scalable SVG and board backup/import format as supported by implementation |
| Persistence | Reliable autosave, reopening and recovery after app interruption; board view position restored sensibly |

Prefer a clear **Select / Pan / Connect / Draw** tool-mode model on phones to prevent gesture conflicts. Text edits should be committed through the existing safe keyboard interaction strategy. Unmount/inactivate gesture subscriptions when Canvas is closed.

### 2.3 No visual data loss

- Text must remain legible at normal useful zoom; use sensible min/max zoom and fit-to-bounds logic.
- Preserve element coordinates and groups independent of viewport size; re-opening in a different orientation must not rearrange the actual board unexpectedly.
- Maintain stable connectors when nodes are dragged, resized or temporarily hidden.
- Large canvases should not clip data during normal navigation or export.
- Theme transitions recolor **theme-driven surfaces and UI**. Explicit user-assigned note colors can remain fixed if contrast is acceptable.
- Reduced-motion settings should affect cosmetic transitions, not disable essential pan/zoom functionality.

---

## 3. Canvas content types and project integration

Canvas must distinguish **freeform authored objects**, **live linked objects**, and **explicit snapshots**.

### 3.1 Object categories

| Category | Examples | Relationship to canonical project data |
|---|---|---|
| Freeform content | Sticky note, text, shape, connector, annotations, standalone brainstorm card | Board-owned content only |
| Native diagrams | Editable Canvas-only Tree, Fishbone, Mind Map, cause/effect, flow nodes | Board-owned until deliberately converted/linked |
| Linked tasks | Task card with title, status, priority, assignee and optional due date | References existing canonical task ID; source updates flow to view |
| Linked WBS | Tree/Fishbone/Mind Map visualization, work-package branch | References project/WBS revision; reused geometry and canonical editing rules |
| Linked artifacts | Charter objectives/scope, Risk Register entries, Stakeholder Register entries, other supported documents | Read-only view or controlled source editing, according to permissions |
| Linked schedule | Timeline/Gantt-derived roadmap, milestones, phases, task dates, sprint objectives | Reflects canonical schedule; visual placement does **not** silently reschedule |
| Snapshot | Frozen diagram, roadmap or selected artifact excerpt with captured timestamp/revision | Deliberately disconnected from subsequent source changes |
| Discussion | Comment thread anchored to object/position | Stored with board; separate from the task/document's own discussion system unless explicitly linked |

Do not assume every document has structured fields. Provide a **capability adapter/registry** for artifacts actually implemented in the current app. When only document text exists, present a safe preview or selected excerpt rather than inventing a data schema.

### 3.2 Integration matrix: canonical source, link strategy and actions

| Milvayo source | Canvas representation | Allowed interaction | Update policy |
|---|---|---|---|
| **WBS Outline** | Work-package nodes / branch cards | Inspect; open canonical Outline editor; optionally source edit if authorized | Recompute affected linked display/diagram on title/hierarchy edit |
| **WBS Diagram** | Embedded Tree, Fishbone, Mind Map | Select orientation, fit, pan/zoom, annotate; optionally jump to WBS | Reuse diagram model/cache; keep Canvas transform separate |
| **Project Charter** | Objectives, scope, goals, assumptions, key milestones where present | Display excerpt, comment, open source document | Relevant source content changes update linked presentation |
| **Risk Register** | Risk cards, severity/likelihood indicators, clusters and connections | Filter/group, annotate, navigate to risk | Sync only fields represented; do not change risk score by dragging |
| **Stakeholder Register** | Stakeholder cards / stakeholder influence map | Connect, group visually; inspect canonical record | Keep sensitive data protected by source permissions |
| **Tasks / Board** | Linked task cards, progress/status groupings | Inspect; optionally open authorized task editor | Source is authoritative; movement on Canvas is visual only |
| **Timeline / Gantt** | Roadmap lanes, milestones, date bars, dependency links | Pan/zoom/rearrange board containers; inspect date/task | Dates and dependencies reflect canonical schedule; no silent rescheduling |
| **Sprints** | Sprint goal, progress, task summary | Inspect and open actual sprint | Updated on meaningful sprint changes |
| **Projects** | Project identity, owner, phase, status context | Provide board/project context | Follow canonical project settings |
| **Portfolios / Programs** | Future extension / project-level link only | Navigate to referenced higher-level context if supported | No accidental cross-project access or mutation |
| **Other artifacts** | Source-dependent linked card, excerpt or snapshot | Import only when supported by actual app capability adapter | Preserve origin, field provenance and access control |

### 3.3 Linked versus snapshot semantics

**Live link:** stores a stable `sourceType`, `sourceId`, `projectId`, selected view/options, and source revision/version. Displays a derived projection when the source changes. In offline mode, show last valid cached content with an **outdated/offline** indicator if freshness is unknown.

**Snapshot:** stores explicitly captured, self-contained display data with `capturedAt`, original source ID and revision for attribution. Clearly label it as a snapshot; never silently update it. Explicit confirmation required if snapshots contain sensitive/source-restricted data that would become visible to board members.

**Missing/deleted source:** show a safe missing-source placeholder and ability for owner/editor to unlink/remove the object. Do not resurrect deleted tasks from stale Canvas caches.

### 3.4 Safe editing and bidirectional interaction

- `Edit source` explicitly navigates to or invokes the canonical editor/mutation path and checks **source** permissions in addition to Canvas permission.
- Editing Canvas-local visual properties (position, size, connection, color, annotation) updates only board state.
- Native Canvas diagrams are editable in the board; linked WBS diagrams allow controlled source navigation and Canvas-specific annotations. Any future in-place canonical WBS edit must use the existing WBS mutation API and honor validation/audit rules.
- `Convert to task`, `Create task from note`, or `Apply to WBS` is an **explicit, reviewed operation**, with parent/project selection and confirmation of side effects. Never automatically create or reorder canonical tasks from a brainstorm diagram.
- Avoid cyclic changes (a linked diagram update must not recursively write a source update back to its originating artifact).

### 3.5 Roadmap builder — key v0.8.0 experience

Create a **Roadmap** object from existing tasks and timeline data, selecting a scope such as current project, phase, milestone group, sprint or filtered task set (only choices genuinely supported by the app). The roadmap should:

1. Show lanes/phases and dated milestones or task groups based on canonical schedule.
2. Support canvas-level resize/placement and visual annotations without changing real dates.
3. Provide an explicit action to open relevant Timeline/Tasks/WBS records.
4. Refresh when underlying source dates/status change; coalesce updates rather than re-layout every unrelated app state change.
5. Offer a **snapshot** toggle for frozen planning scenarios, visibly labeled as such.
6. Avoid copying task records into Canvas as a disconnected second schedule.

---

## 4. Data architecture and contracts

**The following is a logical schema, not an assumed current code or Firestore structure.** Map it to the actual existing store/persistence conventions and add versioned migrations. Keep IDs stable across updates and imports.

### 4.1 Logical entities

| Entity | Minimum fields / role |
|---|---|
| `CanvasBoard` | `id`, `projectId`, `ownerId`, `title`, `schemaVersion`, `revision`, `createdAt`, `updatedAt`, `archivedAt?`, `themePreference?`, `viewport`, `settings` |
| `CanvasObject` | `id`, `boardId`, discriminated `type`, `position`, `size`, `zIndex`, `rotation?`, `locked?`, `style`, type-specific `content`, optional `sourceLink`, `createdAt`, `updatedAt` |
| `CanvasConnector` | Stable `id`, origin/target anchors or free endpoints, optional label, arrow/style and routing information |
| `SourceLink` | `sourceType`, `sourceId`, `projectId`, `mode: live|snapshot`, relevant view options, last verified revision, captured metadata when snapshot |
| `CanvasCommentThread` | `id`, `boardId`, anchor `{objectId|x,y}`, messages (author/time/text), `resolvedAt?` and revisions |
| `CanvasGrant` | `boardId`, `userId`, `role: viewer|editor`, `grantedBy`, `grantedAt`, `revokedAt?` and auditable changes |
| `CanvasOperation` | Command/transaction for undo/redo, revision and optional persistence batching; never a duplicate canonical task mutation |

Use a stable coordinate system independent of screen pixels. For scalable diagrams, preserve source IDs and cached geometry references; avoid serializing entire React trees.

### 4.2 State separation

```text
Canonical Milvayo project models (unchanged source of truth)
            │
            ▼
  Read/permission-aware artifact adapters
            │      (select relevant fields and revisions)
            ▼
  Canvas projections / live source links ────────┐
            │                                    │
            ▼                                    ▼
 Board model + freeform objects              Diagram geometry cache
            │                                    │
            └──────────┬─────────────────────────┘
                       ▼
            Visible Canvas renderer
                 + gesture transforms
                       │
                       ▼
       Local autosave / versioned persistence
             + optional secure shared sync
```

- Keep store subscription selectors **narrow**. An unrelated status bar, settings change or another project update should not regenerate all Canvas objects.
- Separate **data revision**, **layout revision**, and **viewport transform**. Panning/zooming must not change any data/layout revision.
- Invalidate linked objects only when relevant source fields, hierarchy, filtering or orientation change.
- Memoize expensive projections; reuse the existing v0.7.13 WBS diagram cache rather than building a parallel parser.
- Use spatial indexing/visible-region culling or an equivalent approach for large boards, without clipping selected/dragged elements or disconnecting connectors.
- Keep a bounded in-memory board cache with explicit cleanup and lifecycle handling; never retain all opened boards' full native component trees.

### 4.3 Persistence and migrations

- Use the application's existing durable local-storage conventions, with per-board, versioned serialization and a migration path from `schemaVersion: 1` onward.
- Autosave at sensible transaction boundaries or with short batching; show unsaved/retry status for actual failures. Persist before navigating away where feasible and recover an interrupted edit on reopen.
- Keep undo/redo commands distinct from autosave snapshots; **undo must not mutate canonical project data unless that action was explicitly a canonical edit**.
- Support safe duplicate/import/export of board data with ID remapping where required. Do not import untrusted scripts, unsafe SVG markup or arbitrary executable content.
- Handle missing links, archived projects, renamed tasks, corrupt/partial saves and future schema versions explicitly and without silent data loss.
- If cloud persistence is available later, use revision checks/transactions and conflict detection to avoid silently overwriting another editor's saved board. This is **asynchronous shared editing**, not real-time multiplayer.

### 4.4 Practical source-link adapter contract

Implement a documented abstraction to:

1. Check `canViewSource` / `canEditSource` for each requested artifact (using real auth when present).
2. Load a **minimal projection** of the source object, rather than whole project databases.
3. Return a stable source identity and revision/fingerprint of relevant fields.
4. Serialize a safe linked display / explicit snapshot.
5. Open the originating task/document via the existing app route.
6. Handle absent or unauthorized records without leaking their content.

Use adapters for source types actually present in Milvayo; don't create speculative backend records just to fulfill the matrix.

---

## 5. Permissions and controlled collaboration

### 5.1 Access policy

The **designated project owner / project manager** is the sole authority to grant or revoke access to a Canvas board. A board is **private by default**. Grant roles are restricted to the selected board and a named authenticated user—no public editable links.

| Capability | Owner / PM | Editor (invited) | Viewer (invited) |
|---|---|---|---|
| Open board and inspect permitted content | Yes | Yes | Yes |
| Pan, zoom and navigate | Yes | Yes | Yes |
| Create/move/edit board-owned items | Yes | Yes | No |
| Edit/delete board comments | Yes | Own comments and permitted threads | No (view only) |
| Change linked canonical tasks/documents | Only with separate source permission | Only with separate source permission | No |
| Rename/archive/delete board | Yes | No | No |
| Invite/revoke/change board roles | **Yes, exclusively** | No | No |
| Export sensitive board content | Yes | Only if board policy permits | Off by default; owner may grant export separately in future |

If a project has multiple administrators, **do not automatically treat all project admins as board owners**. Determine the designated PM/owner from existing authoritative project membership rules. Handle owner transfer through a trusted, auditable administrative flow; never allow an Editor to self-promote.

### 5.2 Source authorization is independent

Canvas access alone **does not grant access to underlying WBS, risk, stakeholder or task records**. For a linked object, effective read/edit access is the intersection of board role and source-record permissions. If a user can view the board but cannot view a linked confidential risk, render a non-sensitive locked placeholder, not the cached risk text. A snapshot may be visible to an invited board user only after the owner intentionally chooses a sharing-safe representation and authorized backend policy permits it.

### 5.3 Backend dependency and safe launch gating

**No false security.** Client-only role flags or hidden buttons are not enforceable permissions.

- For a **local-only** release, implement private owner boards and the data/role model, but **disable invitations and shared-board access** until authenticated identities, persistent server ownership and server-enforced rules are available and tested.
- If Milvayo already has a suitable backend, implement genuine owner-only grants, read/write checks, revoke flows and server-side authorization in v0.8.0. Test denial of unauthorized reads, writes, grants and cross-project access.
- If secure sharing cannot be implemented within the current infrastructure, **do not label owner-controlled sharing as delivered**. Surface it as a documented release blocker or explicitly approved deferred feature, rather than shipping simulated access. Seek product approval before changing scope.
- Shared editing, if enabled, is **asynchronous**: one person can save a board and another authorized person can open the latest saved version later. Do not ship concurrent live editing or imply instant multi-user conflict-free sync.

### 5.4 Required authorization test matrix

- Anonymous/not signed in: denied where auth is required.
- Authenticated unrelated project member: denied.
- Viewer: can read only permitted board/link content; cannot edit/comment/grant/remove.
- Editor: can edit board-owned objects, not roles, ownership or unauthorized source records.
- Owner: can invite/revoke/change role, access board and audit grants.
- Revoked user: loses access on next enforced check and cached restricted content is invalidated appropriately.
- User opening a direct URL/deep link: receives the same authorization enforcement as navigation from More.
- Project owner transfer/deletion: permissions are reconciled; no orphaned public access.

---

## 6. Performance and responsiveness contract

**Primary constraint:** The user develops and tests on an Android phone with Expo Go/Hermes; heavy screens must not compromise the rest of Milvayo. These are **proposed acceptance budgets** to be measured against the same dataset/device, not claims of achieved production FPS. Compare at least phone portrait, phone landscape and web.

### 6.1 Performance scenarios

Define repeatable seeded cases:

- **Small:** 30 objects, 10 connections, one linked WBS diagram.
- **Typical:** 150–250 objects, 40–80 connections, several live-linked task cards, a roadmap, comments and one diagram.
- **Stress:** 750–1,000 objects, 200+ connections, mixed notes/shapes/links, including at least one complex Tree. Test graceful degradation and export limits; don't assume full native SVG mount scales indefinitely.

Use the same source data, device and capture windows before/after optimization. Report p50/p95 and outliers when samples support them.

### 6.2 Budgets and invariants

| Surface | Acceptance target |
|---|---|
| Open Canvas library | Responsive navigation without mounting any heavy full-board SVG scene |
| First blank/typical board | Aim for first usable local Canvas in **≤1.5 s p95 after app workspace is ready** on reference Android; report Expo Go/development overhead separately |
| Cached reopen | Aim for **≤350 ms p95** from selection to usable cached canvas with a typical board (excluding unrelated navigation animations); no full linked-source regeneration |
| Pan and pinch | Target visually smooth **~60 Hz where hardware allows**; aim for p95 sampled frame intervals **≤32 ms**, and no repeated perceptible freezes |
| Per-frame React work | No broad component re-renders or full graph recalculation on each pan/pinch tick; keep transforms on the most efficient available animation/native path |
| Linked data refresh | Changed source updates only affected Canvas objects; no whole-board rerender on unrelated task edits |
| Offscreen objects | Avoid mounting all offscreen heavy diagram content when culling/virtualization is appropriate; ensure connector correctness |
| Board lifecycle | No unbounded memory retention after repeated open/close; document memory samples or available proxy metrics |
| Autosave | Batch mutations; no noticeable input lag, no long synchronous serialization during drag; recover unsaved changes when safe |
| Export | High-fidelity **complete-board** PNG/SVG (not viewport crop), with safe resolution/memory limits and clear user feedback |
| Startup and other screens | Canvas must not initialize its heavy renderer before opening it; startup, Board, Timeline, Tasks, Sprints and WBS performance must not materially regress |
| Instrumentation | Measure diagram layout/cache, board render/commit, object count, gesture frame indicators, memory proxy, export time and file size; don't mislabel JS metrics as native FPS |

Where a budget is not realistically achievable with a specific dataset/device, report the failure honestly with evidence, device-specific limits and a concrete mitigation. Do **not** optimize by silently dropping visible content or compromising edit accuracy.

### 6.3 Architecture to meet performance targets

- Lazy-load the Canvas editor only after the user enters a board; the library displays lightweight thumbnails.
- Retain parsed board data and selected generated diagram geometry where reasonable, **not** all heavy native SVG views permanently mounted.
- Separate animated viewport transform from canonical object state. Pan/zoom should not trigger autosave or source recalculation.
- Window/virtualize heavy objects and batches of paths; maintain selected items and connector continuity.
- Use memoized source projections and stable keys. Keep subscriptions narrow and avoid require cycles.
- Throttle nonessential expensive UI operations at transaction boundaries, **not** user gesture frames; never use artificial pauses to disguise slow rendering.
- For large exports, compute content bounds and use platform-safe rendering/file APIs; consider tiling, resolution caps or explicit warning if requested megapixels exceed safe device capacity.
- Avoid allocating multiple large SVG/PNG base64 copies in JS; clean temporary files and release native resources on completion/cancel/error.

---

## 7. Export, import, safety and accessibility

### 7.1 Export behavior

- **PNG:** entire selected board or clearly chosen frame, high fidelity at 2× or 3× where safe; optional transparency/background, correctly embedded fonts, no clipped objects/lines/labels; Android save/share/gallery workflow is verified.
- **SVG:** complete vector geometry with appropriate bounds and safe serialized markup; preserve visible text/connections; inspect any unsupported embedded formats and warn instead of producing a misleading incomplete file.
- **Board backup:** structured, versioned board data for restore/migration; validate schema, size and IDs on import. **Do not treat raw export as an executable plugin format.**
- **CSV:** meaningful exports for task/roadmap/risk/stakeholder data **when such a structured selection exists**; do not force arbitrary freeform whiteboard shapes into a fake CSV table. Preserve the existing WBS diagram CSV flow.
- Provide export progress and accessible completion/error feedback, with native-safe accessibility roles; prevent duplicate rapid exports and state corruption.

### 7.2 Accessibility, responsiveness and security

- Touch targets target at least ~44×44 logical points when practical, with safe-area awareness.
- Provide text labels for symbol-only tools, readable contrast, accessible edit actions and keyboard controls on web/desktop.
- Reduced-motion settings disable cosmetic shimmer/transitions while preserving functional manipulation.
- Make dialogs, sheets, context menus and comment focus navigation predictable.
- Avoid rendering source data into a shared board when authorization is missing; scrub/revoke sensitive caches after permission loss.
- Sanitize pasted or imported text/SVG; never run arbitrary scripts from imported board data.
- Distinguish visual user notes from official project records so decisions and reporting aren't silently changed.

---

## 8. Implementation workstreams and milestones

Work in **small testable phases**, delivering evidence at each one. These are internal v0.8.0 implementation checkpoints, not additional published app versions.

### Phase A — Discovery, design and architecture lock

**Tasks**
1. Inventory More → Project Tools routing, Project Artifacts, WBS tabs, diagram components, Timeline/tasks projections, store/auth/persistence, exports and current design tokens.
2. Map existing permissions and whether real secure shared-board access can be provided. Do not assume Firebase rules are already present.
3. Produce concise `canvas.md` implementation alignment notes: actual file/module names, adapter map, data schema, performance baseline and scoped deviations from this plan.
4. Confirm interaction modes and mobile/desktop responsive behavior through sketches or lightweight screenshots before heavy implementation.

**Gate:** Verified source audit, implementation map, permission feasibility decision and baseline benchmarks.

### Phase B — WBS organization and Canvas foundation

**Tasks**
1. Consolidate WBS internals to **Outline | Diagram**, with Tree/Fishbone/Mind Map icon + label selector; preserve every existing diagram, cache, export and full-screen action.
2. Add More → Project Tools → Canvas library, board creation/rename/duplicate/archive and project affiliation.
3. Implement theme-aware Canvas editor with pan/zoom, selection, notes, text, shapes, connections, undo/redo and local autosave.
4. Implement versioned board data, recovery/migration and independent comment threads.
5. Keep Canvas lazily loaded; no impact on unrelated screen startup.

**Gate:** Board creation/edit/save/reopen works on Android/web; WBS navigation has no loss of existing features.

### Phase C — Canonical artifact connections and roadmaps

**Tasks**
1. Add source-link adapters for currently supported WBS, Charter, Risks, Stakeholders, Tasks, Timeline, Sprints and other existing artifacts where genuinely available.
2. Add **Add to Canvas** from suitable source screens with board picker and placement.
3. Insert live WBS Tree/Fishbone/Mind Map objects and editable Canvas-local diagrams with explicit conversion/linking rules.
4. Add task cards and timeline-derived roadmap templates/views, including linked status/date refresh.
5. Add snapshots, broken-link handling, safe permissions-aware previews and undo/redo consistency.

**Gate:** Source changes update linked Canvas representations; Canvas-only rearrangement does not alter any canonical data.

### Phase D — Sharing authorization, export, performance and polish

**Tasks**
1. Implement private owner boards as default, roles and owner-only management. Enable sharing only where server-enforced identity and board/source permissions exist; otherwise keep shared access disabled and flag as a release blocker requiring product decision.
2. Validate light/dark and portrait/landscape UX, large-board virtualization, gestures, comments, complete-board PNG/SVG export and board backup.
3. Run stress scenarios and fix regressions using measured evidence; verify Canvas editor stays unmounted on unrelated app screens.
4. Produce final accessibility, security, regression and manual Expo Go test matrix, screenshots and release notes.

**Gate:** Acceptance criteria met, any deferred sharing explicitly approved, user signs off on Expo Go before release commit.

---

## 9. Detailed acceptance criteria (Definition of Done)

### Information architecture and WBS

- [ ] WBS remains a **Project Artifact** with exactly **Outline** and **Diagram** internal tabs.
- [ ] Diagram has Tree / Fishbone / Mind Map selector with legible original SVG icons and labels.
- [ ] Full-screen Tree orientation switch works for Top Down and Left to Right, inherited from v0.7.13.
- [ ] No WBS data, hierarchy, diagram exports or existing controls are lost.
- [ ] Canvas is accessed through **More → Project Tools → Canvas**, not via a WBS tab or primary bottom tab.

### Canvas and core editing

- [ ] User can create, name, save, reopen, duplicate and archive multiple boards for a project.
- [ ] Board supports mobile and web pan/zoom, Fit, select, move/resize, notes, text, shapes, connectors, groups/frames, undo/redo and durable autosave.
- [ ] Board theme follows app light/dark mode; large fonts, reduced motion and safe areas are respected.
- [ ] Comments can be attached to an element or board position, saved/reopened and resolved (subject to role).
- [ ] Large-board objects do not disappear or become silently uneditable due to zoom, offscreen culling or orientation change.

### Integration, sources and roadmaps

- [ ] Source picker can insert **existing** WBS diagrams, tasks, dates/milestones and supported artifact excerpts using stable source IDs.
- [ ] `Add to Canvas` works from relevant source screens and respects project context.
- [ ] Linked task/WBS/roadmap displays react to relevant canonical changes without whole-board invalidation.
- [ ] An explicit snapshot stays frozen and visibly shows capture time/source.
- [ ] Moving/editing a linked object's Canvas geometry **never** silently edits task titles, WBS hierarchy, dates or risk scores.
- [ ] Explicit source-edit action is routed through canonical editor with appropriate permission checks.
- [ ] Deleted/missing/unauthorized links degrade safely without resurrecting source data or exposing confidential content.

### Permission and collaboration boundary

- [ ] Private by default; only the designated project owner/PM can invite, change or revoke a Viewer/Editor.
- [ ] Viewer cannot edit or grant access; Editor cannot grant access, transfer ownership or bypass source permissions.
- [ ] Shared access, if enabled, is backed by **real server-enforced authorization** and passes negative-path tests.
- [ ] If secure sharing isn't available, invitation controls are disabled rather than faked, and the deviation is explicitly approved before completion.
- [ ] No live cursors, simultaneous coediting engine or misleading multiplayer UI ships in v0.8.0.

### Performance and export

- [ ] No full board initialization on app startup or when opening unrelated project screens.
- [ ] Pan/zoom does not regenerate WBS geometry or serialize whole boards each frame.
- [ ] Reopening a cached typical board targets ≤350 ms p95; first typical opening targets ≤1.5 s p95 after workspace ready, measured in controlled runs.
- [ ] Typical-board gestures target smooth ~60 Hz with p95 sampled frame gaps ≤32 ms where possible; report objective Android evidence.
- [ ] Complete-board PNG/SVG export works; existing WBS SVG/PNG/CSV remains supported; no native accessibility error after export.
- [ ] Stress boards are handled with documented memory/export limits and no persistent navigation/input stall.
- [ ] Tests show no material regression to Overview, Board, Timeline, Tasks, Sprints, WBS and startup milestones.

### Engineering and release quality

- [ ] No broken canonical business logic, data corruption, unsupported Android accessibility properties or unbounded caches.
- [ ] Unit/integration/regression tests cover schemas, links, revisions, persistence, gestures, permissions and exports.
- [ ] The user completes manual Expo Go tests and approves the release before commit/push.
- [ ] Version bump and release notes identify v0.8.0 as new Canvas functionality, separate from v0.7.13/0.7.14.

---

## 10. Test plan (must be executable and evidence-based)

### Data and state correctness

1. Create a board in Project A; add notes and a linked Project A task; save, close/reopen and confirm stable IDs/content.
2. Rename/reparent the linked WBS task through Outline. The linked Canvas view updates; Snapshot remains frozen; unrelated Canvas notes remain unchanged.
3. Drag task card on Canvas. Canonical WBS hierarchy and Timeline dates remain identical.
4. Delete/archive a referenced source; Canvas shows unavailable source, not stale editable task data.
5. Open Project B; confirm no Project A leakage. Test project switch, archive and reopen.
6. Simulate interrupted autosave, invalid serialized data and newer schema; recover safely or show explicit failure.
7. Import/restore board backup; validate schema and remap IDs without duplicate source mutation.

### Gesture and UI behavior

1. Android portrait and landscape: pan, pinch around center and edges, quick reversals, drag a card, connect nodes, fit and reset.
2. Compare Top Down Tree and Left to Right Tree embedded within WBS and as linked Canvas diagrams; verify v0.7.13 fixes still hold.
3. Place sticky note, multi-select, move group, edit text with keyboard, undo/redo and verify connectors remain attached.
4. Large-font/light/dark/reduced-motion; keyboard and screen-reader affordances on platforms supported by the app.
5. Move between Board/Timeline/Tasks/Sprints and Canvas repeatedly; check no hidden render loop or restart of unrelated screen states.

### Security and sharing

1. Owner grants/removes Viewer and Editor to authenticated existing members when real backend sharing is enabled.
2. Viewer attempt to mutate board; Editor attempt to edit grant, owner or unauthorized WBS document—all denied at server.
3. Revoked member loses access even via direct link and stale app state.
4. Link to confidential risk/stakeholder source appears redacted/locked to board members without source permission.
5. If backend sharing is not enabled, assert that share/invite cannot succeed from client-only state.

### Performance and export

1. Benchmark small/typical/stress boards on reference Android with repeated cold/warm openings, fast gestures and export.
2. Check no per-frame layout/serialization and zero unintended full-diagram cache invalidations on pan/zoom.
3. Measure board mount/first interactive, cached reopen, frame gap indicators, render/commit samples, JS delays, export duration and available memory proxies.
4. Export full-bounds PNG and SVG at multiple scales; verify all nodes, lines and text, no viewport cropping, and no gallery/share feedback crash.
5. Test transient IO errors, insufficient storage, export cancellation, large output guardrails and temp-file cleanup.
6. Repeat source edits, 20+ board openings and theme changes to look for leaks or accumulating retained components.

**Metrics caution:** Expo Go development-Hermes diagnostics, JS timer delays, React render estimates and JS render-to-commit samples are **not** native FPS/memory/ANR measurement. Label results accurately and never claim unavailable release-build performance.

---

## 11. Deliverables and handoff artifacts

Codex must deliver the following **within the repository or as generated artifacts**, using real paths grounded in the source:

1. **Implemented v0.8.0 Canvas:** routes, manager, board editor, responsive controls, comments, project-aware linking, roadmap, WBS tab consolidation and exports, with feature flags only where explicitly justified.
2. **Technical architecture record:** actual module map, normalized schema, source-link adapter list, diagram cache integration, data revisions, lifecycle and permission checks. Update `canvas.md` with a succinct **implemented-vs-planned** status, without rewriting user requirements silently.
3. **Release changelog:** v0.8.0 new features, migrations, compatibility notes and changes to existing WBS navigation.
4. **Test evidence:** named test commands and results; unit/integration/security cases and focused export/gesture regression results.
5. **Visual review:** lightweight screenshots of Canvas library, blank/editing board, linked WBS diagram, roadmap, mobile portrait and dark mode, where tooling allows.
6. **Performance report:** comparable p50/p95 for first open, cached reopen, pan/zoom samples, layout/cache rebuild counts, export and impact on other screens; include test device/dataset/sample sizes.
7. **Security and sharing report:** whether secure owner-controlled Viewer/Editor sharing is active, disabled, or blocked, with server-side denial evidence if active. No unsupported claims.
8. **Manual Expo Go checklist:** precise user steps to verify gestures, imports/links, saves, exports, role controls and cross-screen regressions.
9. **Source control handoff:** changed-file summary, pending tests, git status and proposed commit message; stage only intended changes and do not touch `main`.

### Suggested release commit (after approval only)

```text
feat(milvayo): introduce linked project Canvas and unify WBS diagrams (v0.8.0)
```

### Commit/push policy

Work directly in `~/Milvayo` on branch `work`. **Test first, then request user approval after Expo Go validation.** Only with explicit approval, commit the tested changes and push to `origin/work`. Do not merge into `main` and do not stage the legacy `redesign/` folder or unrelated files. Use the project's established version and release workflow.

### Termux safety constraints

No Android APK build, Gradle, EAS or Playwright in the automated implementation pass. Use the existing test suite, targeted local diagnostics and lightweight headless Chromium screenshots. Avoid long-running heavy processes that stall the phone; the user performs native manual validation in Expo Go.

### Skill-driven implementation

Discover/read and actually use the available **Impeccable**, **Ponytail Audit**, **React animations / Reanimated**, **React Native performance**, **UI UX Pro Max / frontend design** and other genuinely applicable installed skills. Report substitutions if unavailable. Their output should produce specific performance, maintainability, accessibility and visual improvements—not a checklist of names.

---

## 12. Final release decision rule

**Ship v0.8.0 only when:**

1. v0.7.13 and v0.7.14 are stable and already approved;
2. WBS has **Outline | Diagram**, and Canvas is separate in **More → Project Tools**;
3. Canvas remains authoritative **only for Canvas-owned objects**, with safe, useful links to real Milvayo project information;
4. Required performance, data safety, export and mobile acceptance tests are met with measured evidence; and
5. owner-controlled sharing is **server-secure or explicitly gated/deferred with user approval**, never represented as secured by client UI alone.

**Final product outcome:** a private-by-default, responsive, theme-aware visual workspace that helps project managers combine WBS, project artifacts, tasks, risks, stakeholders and schedule-derived roadmaps into useful boards—without turning Milvayo into a multiplayer whiteboard or corrupting its structured project-management data.

---

## Implementation alignment — local candidate, 2026-11-07

The requirements above are preserved. Their original acceptance checkboxes remain owner/runtime gates, not automated claims.

- **Prerequisites:** work commits 6bd035d (0.7.13) and 1e8a972 (0.7.14). The owner subsequently authorized Canvas progression, confirmed export feedback and squeezed Tree/100% repairs, and confirmed the connector-drag repair. No 0.8.0 commit, staging, push, merge, build or agent-started Expo server.
- **Phase A:** repository/source/permission discovery and the architecture lock are recorded in docs/qa/release-080/PLAN.md. Source has no authenticated backend; local identity is not server authorization.
- **Phase B:** More → Project tools → Canvas library; lazy board editor and on-demand schematic previews; create/templates/search/archive/restore/duplicate/recovery-guarded deletion; WBS Outline | Diagram; versioned Canvas content and viewport, optimistic revisions, comments, undo/redo and save retry. Mobile library navigation stays; an open board hides it. The shared header has back, centered Canvas title and zoom/fit. A quiet idle-translucent pill groups tools.
- **Phase C:** src/canvas/sources.cjs adapts canonical Tasks, WBS, Charter/other existing documents, risks, stakeholders, sprints, project details, phase/sprint/milestone roadmaps and actual parent/subtask project diagrams. src/canvas/scene.js reuses canonical WBS geometry/cache and supplies complete exports. Source-screen Add to Canvas is explicit. Snapshots freeze content, preserve origin and redact/unavailable links safely. Local notes and local diagram nodes edit in place; linked canonical content is edited via its source.
- **Phase D implemented locally:** PNG/SVG, compact JSON backups and meaningful structured CSV; brush width/color and undoable stroke eraser; four-face obstacle-aware connections with live previews, path labels and double-edit/delete; fitted diagram bounds and faint outlines; cancellation/gesture cleanup; bounded native geometry payloads, shared routes and selective invalidation; regression/performance/source checks and lightweight headless Chromium fixtures. Export/persistence, WBS boundary round trips and global audit fixes are documented in docs/qa/release-080/AUDIT.md.
- **Phase D release gates remain:** final physical Expo Go and live Web acceptance, reference Android mount/reopen/frame measurements and explicit product approval of the secure-sharing dependency. Remote Viewer/Editor invitations remain disabled. No release or security enforcement is claimed from local state or source tests.

Actual module map: src/domain/canvas.cjs (schema/commands/revisions/import), src/store/canvasStorage.cjs (workspace budget and deletion recovery), src/canvas/{sources.cjs,scene.js,interaction.cjs,routing.cjs,connectionGeometry.cjs,history.cjs,drawing.cjs,localEditing.cjs}, platform CanvasSurface/CanvasObjectGroup pairs, src/screens/canvas/ and shared shell header registration. No separate source-of-truth task/schedule store was introduced.

Schema is additive project.canvases, version 1; board backup format is milvayo.canvas.v1. Board object/source/connection/comment IDs are stable; duplicate/import remaps Canvas IDs only. Source type taskDiagram projects canonical tasks, while wbs remains the separate artifact. Bounds include 50 boards/project, 1,000 objects, 2,000 connections, 2 MiB compact board data, a 1.4 MiB live-workspace headroom check against existing Android storage, and 4 MiB/30 entries per undo/redo stack. Diagram sources use existing bounded caches; project task diagrams explicitly cap 499 tasks plus root. Canonical WBS preserves 500 work elements plus its synthesized root across round trips. Oversize data fails without silent truncation.

Performance records are host-only in docs/qa/release-080/{host-measurements.json,global-host-performance.json,routing-host-performance.json}; they are not navigation/mount/native FPS measurements. Source/render evidence, test results, limitations and the manual acceptance matrix are in REPORT.md. Usage and reversible rollback are in docs/instructions/release-080.md. Existing data/import formats are retained; older code does not retain Canvas fields, so back up before rollback. No remote migration or Firebase project was created.

### Subsequent owner authorization

The owner explicitly requested the v0.8.0 commit and push to work after the engineering handoff. This supersedes the earlier local no-commit scope for the Git checkpoint only. Keep physical/runtime checks marked Not run where applicable, keep remote sharing disabled, and do not create a tag, deploy or merge to main.
