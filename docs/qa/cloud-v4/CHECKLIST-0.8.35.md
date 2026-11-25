# Check for 0.8.35: "not shared yet" (phone + web)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices.

1. **Rename a Canvas board** on the phone (Canvas library, rename). Wait 10 seconds.
2. **Counter.** The Cloud screen (Settings, "Firebase emulator") reads "0 waiting · 0 need review · 1 not shared yet" and says the change stays on this device. No red or review banner on the main screen; a quiet note with "Details" is fine.
3. **Not a conflict.** "Review conflicts" shows no conflict for it.
4. **Still shown on the phone.** The new board name is still shown on the phone. On the web it keeps the old name (expected: the cloud cannot take a board rename yet).
5. **Other edits still go.** On the phone rename a task and move a note. Both reach the web within about a minute.
6. **Reverse a list.** If you can, reorder several tasks quickly in one list on the phone. After a minute the web shows the same order and the counter shows no extra waiting.
7. **Restart.** Close and reopen the app, reconnect. The renamed board is still renamed on the phone and still counted as "1 not shared yet".

Write down for each step: as described, not as described, or unclear, and what you saw.
