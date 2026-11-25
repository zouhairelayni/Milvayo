# Check for 0.8.32: edits leave the phone fast (phone + web)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices.
This checks the SENDING side. The receiving side is still the old one (0.8.33 improves it), so the web may still take a while to show it; use the Compare check or "Last send" to tell the two apart.

1. **Rename.** On the phone change a task title and press Save. Open Sync status. Within about 3 seconds "Last send" says "just now" or "2 s ago" and "quick sends" went up by one.
2. **Reorder.** Drag a task to a new place on the phone. Within about 3 seconds "Last send" updates again. Do not press Synchronize.
3. **Canvas.** Move a note on the Canvas on the phone. Within about 3 seconds "Last send" updates.
4. **Typing burst.** Type in a task title for 5 seconds without stopping, then stop. You should see only one or two sends, not one per letter.
5. **Counter.** About 5 seconds after you stop, the Cloud screen says "0 waiting".
6. **Web.** On the web, note how many seconds until each change appears. Write the numbers down: this is the receiving side and it is the next fix.

Write down for each step: as described, not as described, or unclear, and what you saw (numbers help).
