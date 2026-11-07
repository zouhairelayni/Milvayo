# Milvayo 0.7.12 — work-structure diagrams

Current source: 0.7.12, Android versionCode 82 / iOS buildNumber 82. This update uses the existing dependencies and storage format. The owner authorized the main source and commit/push only to `work`; no merge into `main` or agent build.

In Projects, open a project → Work breakdown structure. Choose Tree, Fishbone or Mind map. Only that diagram is generated. Previously visited diagrams reuse calculated geometry and drawing primitives while they remain in the bounded memory cache. The cache survives screen changes, but is cleared on process restart and may evict older entries when its budget is reached.

Use **Expand** for the full-screen view. Pinch or use the mouse wheel/trackpad to zoom; drag to pan. The floating bar provides Fit, Reset to 100%, Zoom out and Zoom in. The move menu offers Pan left/right/up/down as alternatives to dragging. On web, Shift-wheel pans; Ctrl-wheel also zooms. Close returns to the same embedded diagram, zoom and pan position. Fit can show an entire large structure; zoom back in to read small labels.

Tap a work element to inspect its full name, owner, rolled-up hours and description. Work elements belong to the explicit WBS outline. They are not automatically linked to tasks by matching titles. Use Outline to edit the structure. Changing a project task title alone does not change its WBS work elements.

Use the download icon in either view to open exports:

- **SVG:** complete editable vector paths/text in the current theme, with full work-element names in SVG metadata.
- **PNG:** complete diagram, including parts outside the viewport. Choose 2× or 4× quality and theme background or transparency. The sheet shows the actual output dimensions. To protect memory, native images are limited to 4,194,304 pixels / 4,096 per side; web images to 12,582,912 pixels / 8,192 per side. Large diagrams are scaled down explicitly. Use SVG for unrestricted vector detail.
- **CSV:** current WBS code, level, full name, owner, hours and description, including metadata edited since the diagram was cached.

Web downloads the file. Android/iOS opens the system sharing sheet: choose an available Save/Files or sharing destination. The app retains up to three PNG source files in its dedicated cache directory after successful sharing, rather than treating the cache as permanent user storage. Export preparation can be cancelled. Rejected exports keep the sheet open for retry.

No reinstall, storage clearing, new package installation or data migration is required. Use the existing compatible Expo/Metro session and Fast Refresh. Keep app storage, signing files and backups.

For Android acceptance, switch among diagrams repeatedly; expand and close each; pinch/pan/rotate; add/remove a third finger; verify Fit, Reset and menu actions; inspect a node and dismiss layers with Back; resume from background; and export 2× opaque and 4× transparent PNG, SVG and CSV. Check announced dimensions, complete edges/labels and system Save/Share. Also verify the existing Timeline pinch/scroll/move/resize workflow. Copy diagnostics before/after: layout counts should not increase on unchanged revisits or unrelated task/budget/owner/note changes. `diagram/svg-build` counts primitive generation; screen commit probes are estimates, not FPS.

To reverse the source update, preserve an app backup and any newer local edits first, then restore the selected checkpoint and its matching package/lock/Expo metadata together. The preceding 0.7.11 checkpoint is `074a734`. Do not blindly reset this tree or delete the owner's ZIP changes. No storage conversion needs reversing. [Engineering report and acceptance limits](../qa/release-0712/ENGINEERING-REPORT.md).
