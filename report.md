# MILVAYO v0.6.3 — CODEX IMPLEMENTATION BRIEF
## New Product-Design Philosophy, Complete Experience Redesign, Android Stability & Performance

**Date:** 2026-11-06<br>
**Current working version:** Milvayo v0.6.3<br>
**Previous comparison version:** Milvayo v0.6.2<br>
**Primary environment:** Expo / React Native / React Native Web; Android 15 and web; development on an Android phone using Termux/Debian<br>
**Primary priorities:** P0 confirmed Android Timeline pinch crash; **P0 complete new product-design philosophy and mobile-first experience redesign**; P1 native responsiveness and warning fixes; P2 desktop Timeline scrolling if still reproducible<br>
**Execution type:** **Implement only inside the existing isolated redesign copy, verify lightly, and hand off.** This is not a request for another audit-only response.
**Sole working application:** `~/Milvayo/redesign` (already created and populated by the user).
**Screenshot/design references:** `~/Milvayo/redesign/docs/designexamples/` (exact spelling; **no space**).
**User-provided palette imagery:** `~/Milvayo/redesign/docs/design/`.
**Protected parent application:** `~/Milvayo` outside the `redesign/` subtree; do not change it.

> **NON-NEGOTIABLE ENVIRONMENT LIMITS:** Do **not** build or package any Android APK, run Gradle, run EAS builds, install or invoke Playwright, install a new browser-testing framework, run Android emulators, or perform resource-heavy profiling. These operations stall and lag the user's phone/Termux environment. Codex already has **Chromium** available for lightweight browser inspection and **screenshots**. Use the existing Chromium installation directly, only where useful and with minimal resource usage. Use quick static checks and focused existing Node tests. The user will perform APK/Expo Go testing manually and report results. **Do not push, merge, publish or release**, and do not create a commit unless explicitly requested.

> **ISOLATED WORKSPACE IS NON-NEGOTIABLE:** The user **has already copied the complete Milvayo app into `~/Milvayo/redesign`**. This folder is both the only place Codex may change files and the only app copy the user will test until they explicitly approve it. **Do not copy the project again**, create another nested `redesign/redesign`, delete/rebuild the parent, overwrite the main app, or synchronize redesign changes back to `~/Milvayo`. Do not edit the parent app's sources, configs, packages, `.git`, `.github`, lockfiles or other files. Read-only comparison against the parent, only if truly needed, is permitted. Keep any new screenshots, reports, code, tests and design tokens **inside `~/Milvayo/redesign/`**. Do not commit, merge, push or promote the redesign to the main app without explicit authorization.

> **EXACT USER-SUPPLIED DESIGN FOLDERS:** The already-present screenshots, downloaded dashboard images and mobile/web design examples are under **`~/Milvayo/redesign/designexamples/`**. The user also supplied **color-palette reference images to use for each theme (the multi color palette for each theme invoke richness and visually pleasing designs) under `~/Milvayo/redesign/designexamples/`** with hex codes. Codex must inspect the *contents* of both folders, not merely list filenames. Use the palettes to define Milvayo's new color system and cite concrete file paths in its handoff. Do not assume colors, filenames or palettes until actually viewed.

> **VISUAL REFERENCES ARE THE PRIMARY DESIGN BRIEF, NOT OPTIONAL INSPIRATION:** Before changing UI code, recursively inventory and **visually inspect the actual downloaded screenshots, dashboard images, mobile-app designs, desktop-web designs, illustrations and other image references in `docs/designexamples/`**. Do not merely list filenames, mention brands, or quote the folder path. Treat these images as the user's explicit direction for the *quality, composition, usability and visual craft* of the new Milvayo experience. Extract actionable design patterns, map each to real Milvayo screens (especially neglected sub-screens), and **implement a materially new interface**. Preserve Milvayo's identity and do not directly duplicate third-party trademarks or proprietary artwork. If the folder is absent or files are unreadable, disclose precisely what could not be inspected; never pretend they were reviewed.

> **FULL REDESIGN MANDATE:** Treat this as the beginning of **a new design path, philosophy, and product experience for Milvayo**, not a UI polish sprint, reskin, patch, or collection of visual fixes. Prior efforts did **not** produce noticeable visual transformation. Every screen and interaction pattern is eligible for conceptual redesign. Preserve business rules, information, storage schemas, and functional capabilities, but **do not preserve old compositions, button hierarchies, interaction conventions, or navigation layouts merely because they already exist**. Keep existing architecture only where it advances the new UX. The final app must look and feel like a new, mature, premium generation of Milvayo, especially on mobile portrait.
> Preserve the app business logics as they are unless you need to implement a new feature, an inline calendar, canvas or whiteboards, then tou are allowed.

---

## WORKSPACE FIRST — EXECUTION BOUNDARIES (READ BEFORE ANY OTHER STEP)

The project is **already copied**; **do not create a copy**. Start by confirming the correct working directory and inspecting the two actual image reference folders:

```bash
cd "$HOME/Milvayo/redesign"
pwd
find /designexamples -type f | sort
```

If Codex is running inside Debian with a Termux-mounted repository rather than a Termux shell, locate the **existing** `Milvayo/redesign` directory in that mount and change into it; do not run `cd ~/Milvayo/redesign` against a different/newly created home-directory tree. Resolve and verify the real path before editing. If either folder is missing, report exactly which folder is missing; **never silently substitute `~/Milvayo/docs` or create empty placeholder reference directories**. The project may contain a nested Git repository or symlinks; before any write, ensure it targets the redesign copy and does not resolve outside it. **Do not run bulk file copies, restores, cleanups or package reinstalls**.

**Source of truth:** `redesign/` is the candidate product. The parent `Milvayo/` is the untouched approved baseline. Do not edit or test the parent accidentally. Keep changes in this working tree and tell the user exactly how to launch **the redesign copy** for their own manual Expo Go / APK tests. Do not launch heavy test workloads or build an APK. The user will approve or reject this isolated work before any merge.

**Visual reference sources:**

- `/designexamples/`: Screenshots and downloaded images showing **mobile apps, web dashboards, detailed sub-screens, actions/buttons, floating pills, empty-state art, layouts and interactions**. Visually inspect real images and map actual patterns to screens.
- `/designexamples/`: **Image-based color palettes** selected by the user. Visually inspect those images, extract color families/roles and use them to create a cohesive, accessible light/dark token system. These are design-input assets, not necessarily images to ship inside the app.

**No copy-back:** Do not merge, sync, promote or move redesigned files into the parent after finishing. Provide a review-ready handoff, leave all code in `redesign/`, and wait for explicit approval before any integration.

---

## 0. PRODUCT-DESIGN RESET — A NEW PATH AND PHILOSOPHY (NON-NEGOTIABLE)

**This request supersedes any instruction to treat the existing redesign as visually complete.** The previous build is a **functional baseline**, not a design template to maintain. This is a complete product experience redesign, not a theme refresh or a "make it prettier" exercise.

### 0.1 North-star experience

Design Milvayo as a **calm, high-craft, mobile-native work management studio**: complex project operations feel effortless, information feels intentionally curated, and every action feels immediate and dependable. Aim for the polish, clarity, confidence, and delightful interaction craft seen in leading products such as ClickUp, Asana, and monday.com **without copying their visual identities, proprietary graphics, or precise screen layouts**.

The new philosophy must be recognizable in *every* screen:

- **Clarity before density:** show what matters now, reveal deeper power progressively, and never make a wall of similarly weighted buttons the primary interface.
- **Mobile is a first-class product:** compose portrait screens for thumbs, safe areas, keyboard and bottom sheets, not by squeezing desktop toolbars into columns.
- **Quiet confidence:** refined type, intentional whitespace, a restrained yet distinctive color strategy, beautifully proportioned cards and controls, and confident hierarchy. No random gradients, accent lines, or decorative noise.
- **Purposeful delight:** rich but restrained interactive states, original empty-state artwork, smooth transitions, responsive tactile feedback, and polished alerts, confirmations and feedback.
- **Action-oriented workflow:** every screen has a clear purpose and a visible primary path; secondary operations are discoverable without clutter.
- **Continuity:** task, board, project, sprint, portfolio and timeline surfaces speak the same visual language; navigation and interactions feel like one coherent product.
- **Speed as design:** preserve the excellent web feel and improved Android startup. An animation or image that makes the product sluggish violates the philosophy.
- **Accessibility by default:** legible density, contrast, screen-reader labels, reasonable touch areas, keyboard navigation, reduced motion and clear feedback.

### 0.2 Design freedom and protected boundaries

**Codex is authorized and expected to reconsider** screen composition, hierarchy, headers, secondary navigation, control grouping, button vocabulary, cards, filtering UX, overlays, contextual actions, forms, feedback patterns, typography, colors, empty states, iconography, motion, and mobile/desktop adaptations. Rework shared components and presentation architecture when needed to establish a consistent system; do not limit the work to CSS or theme tokens.

**Codex must protect** existing user data, persistence, schema compatibility, domain rules, feature coverage, permissions, relationships, scheduling logic, import/export, and reliable navigation behavior. Existing information architecture may be kept where it works, but is **not sacred**: improving how people discover and move between existing capabilities is in scope if feature reachability and behavior are preserved.

Do not invent new backend services, remove rarely used features, replace real data with aesthetic mock content, or create unreviewable wholesale rewrites of domain logic.

### 0.2A MANDATORY IMAGE-LED DESIGN WORKFLOW — RUN BEFORE WRITING UI CODE

**The screenshots, downloaded design images, and user-supplied color-palette images are supplied as first-class product-design requirements. This is a visual interpretation and implementation task, not a text-only design exercise.** Codex must work from the *actual pixels*, not simply from brand names or generic conventions.

**Step 1 — Discover the full visual library and palettes.** Recursively inspect `docs/designexamples/` **and** `docs/design/`, including their subfolders. Include files such as `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg` and other viewable design references. The images may cover **mobile app screens, desktop web dashboards, boards, task details, menus, pills, buttons, empty pages, illustrations, cards, filters, modals, alerts, bottom sheets, charts, gestures, and animated design references**. Identify what is actually present rather than assuming a category is represented. Keep the scan lightweight; do not download huge new collections, install new test tooling or do heavy batch conversions on Termux.

**Step 2 — Actually view the images AND palette sheets.** Open/inspect each relevant image visually using available Codex image-viewing capabilities or lightweight image previews. Reading filenames, EXIF metadata or directory listings **does not count** as reviewing design references. If viewing an image is impossible, list its path as *uninspected*. For a large collection, make a lightweight grouped contact sheet if it is safe for Termux, then open promising originals to inspect finer details. **Do not skip references merely because they are downloaded files rather than text documents.**

**Step 3 — Create a short, grounded reference-to-design matrix** before implementation. Capture concrete observations from files actually viewed, for example:

| Reference file (real relative path) | Observed visual/interaction pattern | Milvayo target screen/component | Implementation decision |
|---|---|---|---|
| `docs/designexamples/<actual-file>` | e.g. horizontal compact action rail with one emphasized action | Resources / Automations sub-screen | Replace tall button pile with header + contextual rail + overflow |
| `docs/designexamples/<actual-file>` | e.g. floating filter pill, aligned with content | Projects / Timeline | Implement anchored filter control with clear active-state indicator |
| `docs/designexamples/<actual-file>` | e.g. illustrated empty state with action and concise copy | Releases / Collaboration | Draw a new Milvayo-native lightweight illustration and primary CTA |

The paths above are **placeholders**, not evidence that those reference files exist. Replace them with real filenames, accurate observations, and true target components. Keep this artifact concise and usable; do not delay implementation with an enormous research report.

**Step 4 — Synthesize a new design language from the actual visual patterns AND selected palette imagery.** Study, among other things: action priority and placement; small vs prominent CTAs; mobile thumb reach; floating pills and tools; spacing rhythm; type scale; layout density; card hierarchy; contextual menus; bottom-sheet anatomy; polished status and error feedback; original empty-state illustration *art direction*; tasteful surface treatment; empty/loading/success states; animations and transitions; desktop adaptation. Use **Taste** and available UI/UX / frontend / motion skills to challenge generic AI styling and derive a coherent, **original Milvayo** design system. Do not simply imitate the closest screenshot one-for-one.

**Step 5 — Redesign actual screens, not just theme tokens.** Apply the synthesis to every major screen *and sub-screen*. In particular, fix cramped, hamburger-like vertical action-button piles and neglected utility screens, introducing deliberate mobile headers, grouped/contextual actions, floating compact controls, more refined buttons, expressive but efficient empty-state art, meaningful animation, toasts/alerts and accessibility. For each screen, choose a layout based on its use case rather than forcing one generic card/dashboard template onto all screens.

**Step 5A — Extract a palette-driven design system from `docs/design/`.** For every relevant palette image Codex can view, record the real relative file path and observed colors/mood. Use image sampling only where lightweight and reliable, and label precise HEX values as measured or approximated rather than guessing. Define a small coherent set of **semantic** tokens (background, surface, elevated surface, primary/secondary text, accent, border, success/warning/danger, focus/selection) with appropriate light/dark treatments. Maintain accessible contrast, avoid turning the UI into a rainbow of screenshot colors, and choose a consistent Milvayo brand direction. Show exactly which palette references influenced real components. The user supplied **palette screenshots specifically to be used**, not ignored.

**Step 6 — Prove the screenshots AND palette images changed the product.** Use the already-available lightweight Chromium screenshot workflow (mobile viewport and desktop) to compare key *Milvayo* screens before/after when feasible. In the final report, include a **reference → adopted pattern → redesigned screen → changed source files → screenshot path / native review pending** matrix. Screenshots of a reference image itself are not proof that Milvayo was redesigned. Do not report meaningful design work unless the actual UI code changed.

**Design fidelity rules:** The references convey quality and pattern expectations. Do **not** ship other companies' screenshots, logos, proprietary illustrations or exact copyrighted layouts as Milvayo assets. Create original Milvayo graphics and UI. If the user provided photos/images for internal benchmarking, do not assume reuse rights for shipping them in the product.

**Respect device constraints throughout:** No APK builds, Gradle, EAS, Playwright, new test frameworks, massive screenshot batches or resource-heavy visual pipelines. Use existing Chromium conservatively, existing source/assets, small tests and safe image-viewing methods. Label Android visuals as pending user device verification unless actually tested by the user.

### 0.3 Required design research and synthesis

1. **Inspect all available references** in both `docs/designexamples/` and `docs/design/` first (including nested folders), identifying the action patterns, floating pills, empty-state art, hierarchy, density and mobile interactions that the user wants to emulate at the quality level. If absent, say so and continue; do not pretend to have seen them.
2. **Read and actually apply** the locally available Taste skill plus Impeccable, UI UX Pro Max, Frontend Design, React/React Native animation, mobile UX, performance and accessibility skills (or closest available equivalents). Use existing skills; do not initiate heavy installations.
3. **Write a concise design north star** in the implementation handoff: name the new philosophy, design principles, visual grammar, interaction patterns and key before/after decisions. Then **implement it**—do not stop at the concept stage or ask for unnecessary approval.
4. **Design system first, screen transformations second:** establish reusable primitives and design tokens (e.g., screen headers, primary/quiet/icon buttons, compact floating actions, sheets, input fields, feedback, task/status presentations, art direction and motion). Apply them consistently to actual screens, including the neglected sub-screens.
5. **Inspect each screen as an independent product moment:** identify its main job-to-be-done, one top action, information priority, secondary actions, empty/loading/error state, narrow-portrait behavior and desktop adaptation. Redesign the composition rather than translating the old button arrangement into new colors.

### 0.4 Non-negotiable proof of a complete redesign

- **Every major screen and sub-screen** is reviewed; do not focus only on Overview, Board and Timeline. Implement substantive visual/interaction changes for all feasible screens in scope and disclose any untouched ones.
- At least the **headers, toolbar/action hierarchy, button styles and placements, forms/filters, empty-state treatment, feedback, and motion vocabulary** visibly differ from the old design where applicable.
- Fix **hamburger-like vertical stacks of unrelated action buttons** through proper action priority, contextual overflow, sheets, compact filters, floating pills or reorganized task flows—not through shrinking the same stack.
- Original, lightweight, coherent **empty-state illustrations/artwork** and thoughtful copy replace the appearance of unfinished empty pages. No copied corporate artworks.
- Redesign **alerts, toasts, undo, confirmations, loading states, success feedback, overlays, menus, and modal entry/exit** as product experiences rather than default dialogs everywhere.
- Motion is demonstrably implemented, graceful, and performance-sensitive; not simply listed in the final report.
- Capture lightweight Chromium **mobile-width and desktop screenshots**, when feasible from the already-running web app. Compare the changed screen layouts; do not portray browser screenshots as Android device validation.
- Final report must include a **screen-by-screen transformation matrix: old problem → new interaction/design choice → changed files → visual proof or native verification pending**.

### 0.5 What does NOT count as this redesign

New border radius, accent colors, a few shadows, reordered padding, renamed components, or moving all existing buttons into an identical vertical overflow menu are **not** a complete redesign. Nor is a polished landing dashboard surrounded by unchanged utility screens. The new visual and interaction philosophy must be **systemic, tangible and consistent**.

---

## 1. What must be delivered

1. **Fix the confirmed Android-native Timeline pinch-to-zoom crash.** This has been reproduced by the user in **Expo Go AND an installed Android APK (twice)**. A zero-JavaScript-exception report does not make it an Expo Go-only issue. The web pinch experience is already excellent; **preserve it**.
2. **Make Android feel much closer to the unusually fast web implementation**, concentrating on native animation/gesture paths, Board, Timeline, Projects and other avoidable render spikes. Do not compromise the web implementation.
3. **Eliminate root causes of 44 Reanimated render-read warnings** from the latest Android session; leave strict warnings enabled.
4. **Deliver a cohesive, complete new product-design language and premium mobile experience across ALL screens and sub-screens**: stop action buttons stacking as cluttered hamburger-like blocks; replace weak default controls with well-composed headers, action hierarchies, compact menus, tasteful floating controls, polished alerts, illustrations, meaningful motion and better empty states.
5. Use the user's screenshot references under **`docs/designexamples/`** and their **color-palette images under `docs/design/`** to study patterns from **ClickUp, Asana and monday.com**. These screenshots are **design references**, not source assets to blindly reproduce. Use the **Taste** skill and other available design/frontend/motion skills to create an original, coherent Milvayo experience.
6. Preserve existing app behaviors, project/task data, schemas, features, theme support, accessible controls, responsive web layouts, Metro/Fast Refresh and development workflow.
7. Provide concrete **before/after screen evidence** via lightweight Chromium screenshots for web where feasible, clear code changes for native screens, measured results from available tests, and a candid list of **Android changes awaiting user verification**.

---

## 2. Evidence-based performance comparison: Android v0.6.2 → v0.6.3

### 2.1 Observed run-to-run metrics

| Metric | v0.6.2 | v0.6.3 | Observed change | Interpretation |
|---|---:|---:|---:|---|
| Run start → shell mount | 4,549 ms | 705 ms | **−84.5%** | Dramatic observed startup improvement |
| Longest observed JS timer delay | 4,568 ms | 1,216 ms | **−73.4%** | Fewer/extremely shorter worst observed stalls |
| Timeline mean JS render | 46 ms | 28 ms | **−39.1%** | Significant improvement; remains expensive |
| Timeline max JS render | 390 ms | 227 ms | **−41.8%** | Still high |
| Board mean JS render | 31 ms | 20 ms | **−35.5%** | Improvement; still relatively expensive |
| Board max JS render | 267 ms | 156 ms | **−41.6%** | Noticeable spike remains |
| Projects mean JS render | 26 ms | 22 ms | **−15.4%** | Modest improvement |
| Projects max JS render | 143 ms | 144 ms | **+0.7%** | Essentially unchanged |
| Overview mean JS render | 33 ms | 12 ms | **−63.6%** | Improvement |
| Overview max JS render | 100 ms | 61 ms | **−39.0%** | Improvement |
| Settings mean JS render | 13 ms | 10 ms | **−23.1%** | Improvement |
| More mean JS render | 9 ms | 16 ms | **+77.8%** | Higher, though absolute durations remain modest |
| Console warnings | 36 | 44 | **+8** | Latest warnings all classified `reanimated-render-read` |
| Recorded JS exceptions | 0 | 0 | None | **Does not capture native crashes** |
| Session duration | 238 s | 433 s | Different | Different test workloads; do not infer standardized speedups |

**Methodological warning:** These are **single different Android sessions** with different navigation/workloads, not controlled benchmarks. Figures are the application's **JS timer/React profiler estimates**, not native FPS, ANR, memory or CPU samples. Do **not** treat render-count differences as pure optimizations. Do **not** claim a release-quality result solely from these percentages.

### 2.2 Rendering details (v0.6.3 Android)

| Screen | Renders | Mean | Maximum |
|---|---:|---:|---:|
| Overview | 35 | 12 ms | 61 ms |
| Board | 99 | 20 ms | 156 ms |
| Timeline | 74 | 28 ms | 227 ms |
| Tasks | 93 | 24 ms | 129 ms |
| Sprints | 19 | 10 ms | 63 ms |
| Projects | 144 | 22 ms | 144 ms |
| More | 32 | 16 ms | 52 ms |
| Settings | 19 | 10 ms | 48 ms |
| Releases | 6 | 19 ms | 46 ms |
| Scheduling | 13 | 22 ms | 51 ms |
| Automations | 33 | 9 ms | 57 ms |
| Resources | 2 | 40 ms | 78 ms |
| Portfolios | 1 | 37 ms | 37 ms |
| Programs | 1 | 42 ms | 42 ms |

Notable slow events: Projects JS timer delays of **741 ms** and **1,216 ms**, Board renders reaching **156 ms**, Timeline renders reaching **227 ms**, Tasks renders reaching **129 ms**, and navigation events around **198–300 ms**. Low-sample screens (Resources, Portfolios, Programs) cannot support reliable rankings.

**Projects caution:** v0.6.2's worst *Projects-specific* JS delay was **1,159 ms**; v0.6.3 reached **1,216 ms**. Do not incorrectly represent the overall 73.4% drop in longest session-wide delay as a Projects-specific improvement.

### 2.3 Startup improvements to protect

In the v0.6.3 Android run:

```text
01:29:27.078  run started
01:29:27.546  startup storage read started
01:29:27.572  startup storage read 26ms
01:29:27.621  startup normalize 49ms
01:29:27.783  shell mounted / Overview opened
```

Keep these improvements. Distinguish initialization / shell mount / first visible content / first responsive input. Do not introduce blocking startup animation, asset decoding or whole-app preprocessing in the pursuit of a richer design.

---

## 3. Web v0.6.3 is the reference for responsiveness — preserve it

The latest web report feels extremely fast to the user and contains **0 console errors, 0 warnings, 0 recorded JS exceptions and 0 observed JS timer delay** in that session.

| Metric | Web v0.6.3 | Android v0.6.3 |
|---|---:|---:|
| Run start → shell mount | **163 ms** | **705 ms** |
| Timeline mean render | **8 ms** | **28 ms** |
| Board mean render | **2 ms** | **20 ms** |
| Projects mean render | **10 ms** | **22 ms** |
| Overview mean render | 15 ms | 12 ms |
| Tasks mean render | 42 ms | 24 ms |
| Console warnings | **0** | **44** |

Web Timeline pinch-to-zoom worked successfully four times in quick succession:

```text
01:43:35.425 pinch started → 01:43:35.862 zoom committed: 12.935 px/day
01:43:36.484 pinch started → 01:43:36.721 zoom committed: 27.840 px/day
01:43:37.133 pinch started → 01:43:37.400 zoom committed: 12.860 px/day
01:43:37.924 pinch started → 01:43:38.149 zoom committed: 23.599 px/day
```

**Implication:** Retain web's effective interactions and successful rendering. Diagnose React Native/Android specifics; do not solve the Android problem by rewriting a functioning web gesture pipeline, globally disabling Timeline gestures or removing zoom capability.

Different runtime, hardware and interaction conditions mean these figures are directional, not hardware-normalized speed comparisons. Aim for similar **perceived responsiveness**, not artificially identical instrumentation numbers.

---

## 4. P0 — Confirmed Android Timeline pinch crash (Expo Go + APK)

### What the user personally verified

- Pinch-to-zoom **works on web**.
- Pinch-to-zoom **crashes Android in Expo Go**.
- Pinch-to-zoom **also crashes a previously installed Android APK**, reproduced **twice** by the user.
- The app's in-app crash reporter sees **zero JS exceptions**, so it cannot identify a native process death, runtime abort, activity recreation or reload.

The previous Android run ended immediately after:

```text
2026-11-06T01:28:43.912 | timeline opened
2026-11-06T01:28:44.409 | canvas 7310px, viewport 350px, 33 scheduled tasks
2026-11-06T01:28:54.600 | timeline preset: Weeks
2026-11-06T01:28:56.296 | timeline preset: Months
2026-11-06T01:28:57.929 | timeline preset: Days
2026-11-06T01:29:17.067 | timeline pinch started
2026-11-06T01:29:17.801 | timeline zoom committed: 18.890px/day
```

The following session started at `01:29:27.078`; no clean exit was recorded. The *user's repeated APK reproductions* establish the Android crash defect, but the **exact native cause is not yet proven**. The zoom-commit boundary is a high-value inspection point.

### Required source-level investigation and repair (NO APK BUILD)

1. Map the Android Timeline gesture path: touch/pinch handler → worklet or JS callback → shared-value update → zoom commit → React state/store write → bar/grid/SVG re-layout → native view updates.
2. Inspect `Gesture.Pinch` / gesture-handler usage, Reanimated worklet boundaries, lifecycle teardown, races from stale closures, native view transforms, and SVG/layout changes after zoom commit. Check the **actual installed versions and APIs** rather than assuming a version-specific bug.
3. Check for nonfinite, negative, zero or extreme geometry values; invalid SVG dimensions/paths; large transforms; unbounded timescales; and synchronization races with horizontal scroll, vertical virtualization, and mounted/unmounted views.
4. Audit code for passing mutable Reanimated shared values or animation objects into ordinary React render props, and for reading `.value` / `.get()` during renders. These warnings are a defect to fix, but **do not claim they are the crash's root cause without evidence**.
5. Review Android-specific branches and differences from the working web path. Prefer **a safe native-specific fix** that preserves chart correctness and pinch UX on all platforms.
6. Add focused unit-level safety/regression tests for zoom bounds, gesture end/cancel, focal-anchor math, synchronous rapid zoom commits, and geometry validity using the test tooling already installed.
7. The issue must not be marked **verified fixed** until the user repeats pinch stress tests in Expo Go and an APK outside this Codex run. It is fine to report **source fix implemented; awaiting user validation**.

**Never mask the defect** by disabling pinch, setting a no-op handler, suppressing logs, removing date alignment, or silently falling back to broken controls.

### No-build approach

Do **not** run EAS/Gradle/APK builds, native compilation, device installation or emulators. Use source analysis, existing logs, narrow tests and any **already available** lightweight logs. If native evidence would be essential, document the exact relevant missing evidence and request it in the handoff; do not initiate heavy tooling.

---

## 5. P1 — Fix 44 Reanimated warnings at their source

Latest Android diagnostic classifies **all 44 warnings** as:

```text
reanimated-render-read
```

The associated Metro warning reported earlier was:

```text
[Reanimated] Reading from `value` during component render. Please ensure
that you don't access the `value` property nor use `get` method of a
shared value while React is rendering a component.
```

Actions:

- Trace render-time accesses (JSX expressions, render functions, render-invoked memo calculations/custom hooks, and component prop calculations). Distinguish them from **valid worklet/event/animated-style accesses**.
- Refactor to supported animated styles/animated props/derived values and deliberate React state synchronization as appropriate.
- Check gesture components and recently introduced animation components, including startup branding, but do not assume warning origin from screen timing alone.
- **Do not disable Reanimated strict mode**, blanket-filter console warnings, or hide diagnostics.
- Retain diagnostic grouping and report actual root-cause file locations.

Earlier v0.6.2 **web** output also included a `react-native-svg` `WebShape.js:74` error in `BoardMorph` (`src/components/brand/BoardMorph.js:37`, reached via `ColdStartGate` in `src/app/ModernApp.js`). **The latest v0.6.3 web run shows no errors**, so treat this as **historical/retest-only**, not proof of an ongoing issue. If source inspection or a cold-load Chromium check reveals recurrence, fix it; otherwise avoid needless rewrites to working startup branding.

---

## 6. P0 DESIGN — COMPLETE EXPERIENCE REINVENTION, ESPECIALLY MOBILE SUB-SCREENS

### 6.1 Prior iterations did not meet the complete-redesign objective

The user has **not seen noticeable improvements** in sub-screen clutter, button design/placement, interactive animations, or alert presentation. Some screens still show buttons stacked vertically like a makeshift hamburger/menu. Merely changing border radius, padding and a few colors **is insufficient**.

**Rethink the screen experience from the user journey outward.** Keep only information-architecture elements that genuinely work. Reorganize action flows, navigation presentation and compositions where necessary while preserving the underlying features. The new version must feel intentionally crafted by a senior mobile product designer, not generic dashboard UI.

### 6.2 Reference material is mandatory

1. Examine the screenshots already supplied in **`docs/designexamples/`**, and the palette images in **`docs/design/`**, within the **isolated redesign copy**, **before** redesigning. Look through nested files/subdirectories and inspect each relevant example. **Do not claim you viewed images that are not yet present.** If the directory is empty, continue using the named design principles and clearly note that visual-reference review was unavailable.
2. Study the **patterns** visible in the ClickUp, Asana, and monday.com references: action hierarchy, spacing, floating controls, navigation density, bottom sheets, menus, empty-state illustrations, card treatment and responsive behavior. The screenshots are inspiration **not** instructions to copy their logos, artwork, proprietary assets, exact compositions or branding.
3. Discover and apply the **Taste** skill. Also use available **Impeccable, UI UX Pro Max, Frontend Design, React/React Native Animation, performance, accessibility, mobile-first and web design/testing skills**, or closest installed equivalents. Follow real skill instructions, not just skill names. **Avoid installing substantial packages or resource-intensive tooling**.
4. Preserve Milvayo's independent visual identity and existing supported light/dark themes; refine rather than paste another brand's UI.

### 6.3 Concrete mobile action-layout redesign (must be visibly different)

For **every sub-screen** with cluttered buttons:

- Identify the **one primary action**, supporting secondary actions and low-frequency utilities. Do not treat all actions as equally prominent.
- Replace uncontrolled, vertically stacked action buttons with a deliberate, responsive **screen header / compact inline actions / contextual overflow** design. Use a **single clearly named overflow menu** for rare actions, not a column of pseudo-hamburger buttons or random ellipsis icons everywhere.
- Use **floating action buttons/pills only where they serve a clear frequent action** (e.g. add/create), with placement consistent across screens and respecting safe areas, bottom navigation, keyboard and scroll position.
- Prefer segmented tabs, compact filter chips or a filter sheet for contextual switching **where appropriate**, not a row of five unrelated competing button styles.
- Consolidate redundant destructive/secondary actions into contextual menus or selection states. Keep destructive actions clearly separated and confirmed.
- Introduce consistent **icon + label** logic: icon-only controls only when universally recognizable, accessible and sufficiently large as touch targets; small decorative icons should not imply tiny hitboxes.
- Fix cramped portrait headers: title truncation, responsive wrapping, overflows, hit targets, toolbar crowding and button clusters that become taller than the actual content.
- Make each screen's actions visually easy to understand **at a glance**. Reduce chrome while increasing discoverability.

**Design requirement:** Render mobile portrait sub-screens with obvious improvement in the **placement, hierarchy, size, density and style of buttons**; don't just revise CSS variables.

### 6.4 Reusable premium design language

Implement a coherent product-wide system for:

- **Typography:** distinct page title, section title, body, metadata and numeric roles; restrained scale; readable contrast and line-height.
- **Spacing and rhythm:** systematic alignment, grids, vertical grouping, consistent card padding and comfortable touch spacing.
- **Buttons:** redesigned primary, secondary, quiet, destructive, icon and floating-pill variants; consistent dimensions, pressed/disabled/loading/focus states, with accessible targets.
- **Surfaces:** carefully chosen elevation, subtle borders, section backgrounds, radius and deliberate restraint. Avoid card-inside-card clutter and arbitrary accent lines.
- **Status and metadata:** attractive semantic badges and progress visualizations with accessible colors; avoid a sea of pills.
- **Navigation:** distinctive but calm mobile bottom tabs, clear screen headers/back actions, well-designed nested navigation, no accidental state resets.
- **Menus/sheets/forms:** polished, compact, useful popovers, dropdowns, selection menus, confirmation dialogs, text inputs, filters and contextual actions.
- **Feedback:** custom styled and accessible snackbars/toasts, inline success/error messages, undo where appropriate, progress indicators and humane confirmations. Do not trigger repetitive alerts or obstruct the user's work.
- **Empty states:** **original lightweight SVG/vector illustrations or purpose-built artwork**, meaningful title/description and one helpful action. Every empty page should feel finished, not abandoned. Favor local, performant assets; avoid heavyweight remote illustrations or copying branded art.
- **Motion:** feedback that clarifies hierarchy and interactions; use performant primitives and reduced-motion support. No animation spam.

### 6.5 Visible screen-by-screen redesign requirements

The assignment is incomplete without concrete changes **inside** these screens (not just a global theme edit):

| Area | Required visible design and interaction change |
|---|---|
| **Overview** | Stronger dashboard composition, readable priorities, cleaner action groups, refined summary modules and quick creation affordance |
| **Board / Kanban** | Professional card density, hierarchy and color restraint; better card actions/menus; tactile drag states; no toolbar clutter |
| **Timeline / Gantt** | Beautiful precise date ribbon, task bars and dependencies; compact floating chart zoom controls; well-composed presets, selectors and toolbars; stable gestures |
| **Tasks + task details** | Redesigned task actions, filters, metadata layout, edit and detail views; context-aware rather than stacked controls |
| **Sprints** | Clearly composed planning actions, progress visualization, tidy sprint panels, informative empty state |
| **Projects** | Clean project list/cards and quick actions, visually distinct progress/health, restrained filters and view controls |
| **Programs / Portfolios** | Properly designed sub-screen headers/actions, summaries, hierarchy, status and empty states |
| **Releases / Scheduling / Costs** | Purposeful buttons, structured data and useful content hierarchy; no raw unstyled stacks |
| **Resources / Automations / Collaboration / Specifications / Testing** | Audit and **redesign actual sub-screen button clusters, forms, empty states, actionable feedback, and layout**; these are especially important, not out of scope |
| **More / Settings** | Reduce menu clutter, improve grouped navigation, settings controls, toggles and compact preference descriptions |
| **All modals, alerts and bottom sheets** | Purpose-designed layouts, sensible CTA hierarchy, attractive action sheets and meaningful entry/exit feedback |

Adapt per-screen concepts to actual implemented functionality. Do not invent backend operations or fake data to fill designs.

### 6.6 Illustrations and artwork

The user explicitly wants the kind of **finished, rendered empty-state artwork** seen in leading productivity apps. This is an instruction to implement appropriate attractive, original lightweight visuals, not to leave pages with an empty icon and text. Create illustrations/vector compositions that are inexpensive to render on Android. Pair them with a useful action and concise copy. Ensure they adapt to light/dark themes and do not obstruct navigation.

### 6.7 Design proof, not promises

At completion, include a **screen-by-screen change log**, naming **actual UI components modified** and what changed visually. Capture **before/after Chromium screenshots** for representative web views (mobile-width emulation and desktop) if the browser can access the already-running web app. For changes whose mobile-native output cannot be verified without an APK, describe the exact files and screen paths and label them **pending user device review**. Do not claim screenshot-validated Android UI from browser-only rendering.

**REQUIRED:** Enumerate the actual `docs/designexamples/` screenshots and `docs/design/` palette images inspected, name specific patterns/colors adopted from relevant files, and show exactly which Milvayo screens/components changed as a result. If references exist but could not be opened visually, explicitly mark them uninspected; never substitute generic design claims for visual evidence. Do not copy reference artwork.

---

## 7. Timeline behavior and zoom-control details (preserve prior requirements)

The mobile calendar ribbon previously **stretched its date numerals during live pinch**, reverting only after release. Verify that any repaired native gesture path fixes the distortion without compromising chart/ribbon alignment, text shape, or date anchor.

**Zoom controls:** Two **small semitransparent SVG magnifying-glass** buttons (**plus**, **minus**) floating in the **top-right of the chart**. Approximate icon size **16–18 px**, with **40–44 px practical touch targets**; elegant in both themes, compact, unintrusive, positioned so they do not cover date ribbon or content. Include hover/focus/accessible names on web and good pressed states on mobile. Do **not** enlarge the SVGs simply to increase hit area.

A zoom-button press previously took **about one second** to show its effect. Give immediate tactile/visual feedback and prompt chart scale updates; target smooth short transitions (~150–250 ms when appropriate) without a one-second JS pause. Keep pinch, buttons and preset scales synchronized; coalesce rapid clicks safely.

**Web desktop vertical scroll:** Earlier reports described Timeline stopping around the middle and failing to render/reach bottom tasks. This may have been fixed already; **recheck lightly with Chromium** rather than assuming it remains broken. If reproducible, repair scroll-container ownership, viewport height/flex constraints, clipping/overflow and vertical virtualization (including overscan). Preserve sticky calendar ribbon and horizontal synchronization. Do not replace virtualization with unconditional rendering of all tasks.

---

## 8. Performance engineering without overloading Termux

### Investigate sources of expensive work

- **Native Timeline:** worklet/native gesture path, JS updates at zoom commit, redundant grid/date computation, SVG geometry, shared-state coupling, unnecessary commits, virtualization, expensive animated layouts.
- **Board:** avoidable parent/column/card rendering, card drag work, expensive derived props, state subscription granularity and drag feedback timing.
- **Projects and Tasks:** grouping, sorting, filtering, selectors, persisted-data writes, expensive list updates and delayed effects.
- **Navigation:** unnecessary remounts and rerenders, slow path for retained screens and layout measurements.
- **Start-up:** protect the excellent v0.6.3 startup and avoid new large assets or global work.

Optimize based on evidence. Do not add pervasive memoization, caching or new dependencies without showing the use case. Prioritize **interaction latency and perceived smoothness** over superficial render-count targets. Native UI-thread gestures/animations are helpful when used correctly; the unresolved Android crash takes precedence.

### Strict testing/resource budget

**ALLOWED:**

- Source inspection and diffs.
- Lightweight existing Node unit tests or focused `node --test` subsets.
- Static checks/lint where already available and resource-safe.
- Existing Metro/Fast Refresh if already running; avoid unnecessary restarts or cache-clearing rebuilds.
- **Direct Chromium CLI**, already installed, for limited browser smoke checks and screenshots at mobile and desktop viewport sizes. Use flags appropriate to the user's Debian/Termux container (such as `--headless --no-sandbox --disable-dev-shm-usage`), reuse existing app server, avoid large parallel browser processes, and close browser processes after checks.

**FORBIDDEN:**

- `expo run:android`, `gradlew`, Gradle builds, Android APK compilation, EAS builds or any production/staging APK packaging.
- Playwright CLI, Playwright libraries, Playwright browsers, or new browser-testing installations.
- Android emulators/device automation; native compilers or heavy debugger sessions.
- Heavy profiling suites, enormous end-to-end runs, full app rebuilds, new large dependencies or screenshot farms.
- Long-running CPU/memory stress tests on the phone.

If a validation step would require a forbidden tool, **mark it as awaiting user verification** instead of running it. Do not treat the absence of a build as permission to claim Android is validated.

---

## 9. Motion design: apply skills + these 20 complementary rules

Do not apply every effect everywhere. Use purposeful, resource-efficient native/compositor-friendly motion, with reduced-motion accessibility.

1. Ease-out for entrances.
2. Dropdowns around 150–250 ms.
3. Stagger list rows by ~30 ms when it clarifies grouped content.
4. Scale suitable controls to ~0.97 on press.
5. Stretch slider/knob movement ~12% where useful.
6. Stagger details as the primary element settles.
7. Use arcs for meaningful object motion.
8. Use a restrained pulse for success confirmation.
9. Ease-in-out for repositioning.
10. Start popovers near 0.95 scale.
11. Enter from the triggering control.
12. Exit toward the triggering control.
13. Avoid bounce for everyday UI.
14. Do not tween while a gesture is held; track fingers directly.
15. Make exits about 20% shorter than entrances where appropriate.
16. Overlap outgoing and incoming states to preserve continuity.
17. Use masks selectively for reveals/color changes.
18. Crossfade icons; use blur only if efficient and helpful.
19. Use restrained rubber-band behavior beyond bounds where appropriate.
20. Preserve layout identity for related transitions.

Concrete priority examples: elegant pressed states for redesigned buttons; a short filter-sheet opening; subtle Kanban drag lift; polished toast and undo; transitions between task details and list; coordinated chart zoom and preset switching. **The animations must actually be implemented and visible**, not merely mentioned in a design plan. Do not trigger repeated reanimated-render-read warnings.

---

## 10. Implementation order and safeguards

1. **Confirm workspace is the EXISTING `~/Milvayo/redesign` copy**. Inspect the app and the relevant skill instructions; check both `docs/designexamples/` and `docs/design/` **first** for visual and palette references. Identify active vs historical defects, and establish a minimal baseline of screenshots / existing logs without heavy tools.
2. **P0 crash fix:** source-level repair of Android pinch and zoom-commit path; focused math/regression tests; explain suspected/verified native failure separately. No APK build. Preserve working web gestures.
3. **P1 Reanimated warning fixes:** remove illegal render-time reads, keep strict mode; avoid regression in native animation behavior.
4. **P0 complete-design implementation:** deliver a **new end-to-end design philosophy** with redesigned shared primitives, app-wide interaction conventions, navigation presentation where beneficial, and meaningful composition changes throughout **every screen and sub-screen**. This includes action hierarchy, empty states, menus, alerts, art and motion—not just top-level tabs or theme tokens. Do not defer this because performance fixes are easier to demonstrate.
5. **P1 performance:** optimize important native render/interaction paths without slowing web or startup.
6. **P2 Timeline web check:** verify complete vertical scroll and chart/ribbon sync using lightweight Chromium; fix only if still broken. Check historical web `BoardMorph` error on a cold start.
7. **Lightweight validation:** existing focused tests, code checks, a small number of Chromium screenshots at mobile portrait and desktop widths. Document manual Android acceptance steps for the user.
8. **Handoff:** clear changed-file summary, actual screenshot paths if created, screen-by-screen UX changes, metrics and what is still unverified.

### Preserve business logic

Do not break task persistence, project relationships, scheduling, dependencies, sprints, programs, portfolios, Kanban drag, filters, import/export behavior, navigation state, existing data schemas, themes, or settings. Keep modifications reviewable. No branch merges, commits or remote pushes without instructions.

---

## 11. Explicit acceptance criteria

### Android reliability and performance

- [ ] Android Timeline pinch/zoom-commit code has been investigated and a source-level fix implemented for the repeated reported crash.
- [ ] Web pinch remains fully functional and responsive.
- [ ] No calendar-digit stretching during native pinch after manual verification.
- [ ] 44 Reanimated warning instances traced to their source(s); fix(s) made **without suppressing strict warnings**.
- [ ] Android APK/Expo Go stability marked **awaiting user device verification** if not retested by the user; do **not** falsely mark as passed.
- [ ] Good v0.6.3 startup and core web performance not knowingly regressed.
- [ ] Timeline, Board and Projects expensive paths optimized with specific code-level evidence and/or focused tests.

### Complete new Milvayo design philosophy visibly implemented

- [ ] **All major mobile screens and sub-screens** reviewed under the new philosophy, with meaningful redesign implemented wherever feasible (not merely theme tokens).
- [ ] No unexplained vertical stacks of action buttons masquerading as a menu in narrow portrait views.
- [ ] Primary actions immediately distinguishable; secondary/rare actions accessible without clutter.
- [ ] Original and polished **empty-state illustrations/artwork** on relevant empty pages.
- [ ] Attractive reusable alerts, confirmations, toasts, form controls, action sheets and loading states.
- [ ] A coherent family of compact buttons, floating pills, icon controls, filters and semantic feedback.
- [ ] Subtle, working press/motion/transition effects that do not hinder performance or accessibility.
- [ ] Distinct and consistent Milvayo design language in light/dark mode; no copy-pasted brand artwork.
- [ ] **All relevant downloaded screenshots in `docs/designexamples/` and palette images in `docs/design/` were opened and visually inspected where accessible**, not merely discovered by filename; any uninspected assets are listed.
- [ ] A reference-to-implementation matrix identifies real screenshot/palette image filenames, observed design patterns and colors, Milvayo target screens, changed components, and visual evidence.
- [ ] The final handoff lists **which specific sub-screens now look different and exactly how**.

### Timeline & cross-platform

- [ ] Zoom icons are **small semitransparent magnifier +/− SVGs** at chart top-right; large visible buttons were not substituted.
- [ ] Zoom-button feedback is immediate, with no apparent one-second lockup.
- [ ] Days/Weeks/Months and pinch/button zoom agree on scale and date alignment.
- [ ] Web desktop vertical scrolling reaches the final task row with correct virtualization (if earlier defect persists, fix it).
- [ ] Sticky calendar ribbon and horizontal task/grid alignment remain correct.
- [ ] Browser screenshot checks use **Chromium**, not Playwright.

### Environment and reporting

- [ ] All modifications, tests, screenshot outputs and reports stay **inside the already-existing `~/Milvayo/redesign/` copy**. No new project copy created.
- [ ] Parent `~/Milvayo/` remains untouched; no copy-back, sync, merge or replacement until the user explicitly approves the redesign.
- [ ] User-supplied **`docs/design/` palette imagery actually influences the semantic color tokens and new UI**, with specific evidence.

- [ ] **No Android APK, Gradle or EAS build** run.
- [ ] **No Playwright** installed or run.
- [ ] No new heavyweight test/browsing tool introduced.
- [ ] Focused existing tests run and their real results disclosed.
- [ ] Any remaining native validation delegated to the user in a simple manual checklist.
- [ ] No unsolicited Git commit, push or release.

---

## 12. Codex final report format

Provide a concise but thorough handoff with:

1. **Root causes:** Android pinch crash path (proven vs suspected), Reanimated warnings, measured rendering issues and any still-active web defects.
2. **Code changes:** exact important files, purpose and preservation of behavior.
3. **Complete redesign proof:** the new design philosophy; a **screen-by-screen transformation matrix (old UX problem → new design/interaction solution → changed files → screenshot or Android verification pending)** covering main screens **and all sub-screens**. Include action hierarchy, page composition, alerts/feedback, original illustrations, floating pills, motion and responsive adaptations; identify anything untouched and why.
4. **Design references and skills:** A grounded **image-file → observed pattern or palette → changed screen/component/design token** mapping for actual downloaded dashboard/mobile/web screenshots in `docs/designexamples/` **and palette images in `docs/design/`**, plus Taste/Impeccable/UI UX Pro Max/Frontend/etc. skills actually used. Clearly list unviewable images and unavailable skills; do not claim otherwise.
5. **Screenshots:** path to lightweight Chromium screenshots for mobile-width web and desktop where taken; do not call them Android screenshots.
6. **Performance:** v0.6.2 → v0.6.3 baseline above, plus truly measured after-change evidence where available. No invented speedups/FPS.
7. **Validation:** commands and pass/fail results for **lightweight** tests; explicit statement that no APK was built and native pinch still requires user confirmation.
8. **Open issues and instructions for user:** minimal Expo Go/APK pinch stress-test steps the user can run independently, and any information needed if it still crashes.

**Final success standard:** The entire result must stay within **`~/Milvayo/redesign/`** until explicit user approval. This is **a new product-design chapter for Milvayo**—a coherent, unmistakably different, premium mobile-first experience throughout the app, not a refinement of the old layouts. It must be more beautiful, effortless, comprehensible, interactive, accessible and fluid on Android portrait, while preserving its exceptionally snappy web behavior, all business capabilities, and the lightweight Termux development environment. Deliver tangible UI and functional code changes, not only recommendations; never run APK builds or Playwright.

---

## 13. READY-TO-RUN CODEX DIRECTIVE (IN ADDITION TO THIS ENTIRE BRIEF)

> **FIRST confirm your working directory is the existing `~/Milvayo/redesign` app copy. The user already copied the full project there; DO NOT duplicate it, edit `~/Milvayo` outside `redesign/`, or copy changes back before approval.** Before writing UI code, recursively inventory and visually OPEN the actual screenshot/image contents in **`~/Milvayo/redesign/docs/designexamples/`** (no space) and the user-supplied **color-palette images in `~/Milvayo/redesign/docs/design/`**. These references are mandatory primary design inputs. Read the entire brief and available **Taste, Impeccable, UI UX Pro Max, Frontend Design, animations and performance** skills. Make a concise real-file screenshot/palette-to-implementation matrix; derive a premium, original Milvayo color system from the palette images. **Implement a complete new product-design philosophy across every screen, including neglected sub-screens**: recompose cluttered action button stacks, modernize headers/controls, design refined floating pills, menus, navigation, alerts/toasts, empty-state illustrations, modal/sheet interactions and purposeful animations. Fix the confirmed Android pinch-to-zoom native crash and 44 Reanimated render-read warnings at source; preserve the exceptionally fast working web interactions and existing business logic. **Work ONLY in `redesign/`; no APK builds, Gradle, EAS, Playwright, emulators, resource-heavy profiling, Git commits, merges or pushes.** Use only lightweight existing Chromium screenshots and focused tests where useful. Deliver real changes, a screen-by-screen transformation report with actual reference filenames, screenshot proof where possible, and a clear manual Android acceptance checklist. Wait for user approval before touching the main app.
