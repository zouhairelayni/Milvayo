# Check for 0.8.36: two people, conflicts and Compare (phone + web)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices.

1. **Conflict does not block the rest.** On the phone and the web, change the SAME task name at the same moment, wait a minute. One device shows "needs your review". Now change a DIFFERENT task name on the web. Within about a minute the phone shows that new name even though the first conflict is still waiting.
2. **Resolve it.** "Review conflicts" > pick "Keep cloud version". Both devices end with the same name and "0 waiting · 0 need review".
3. **Same Canvas, two people.** On both devices add a note on the SAME board at about the same time, then move different notes. No "needs review" appears for the board; both notes show on both devices.
4. **Compare.** Settings > Sync > "Compare with cloud" on both devices after steps 1 to 3. It says same records. Also try it after you delete a task and after you reorder tasks.
5. **Evidence.** If you can, run `node scripts/qa-evidence.cjs` (or `--skip-cloud`) and send the zip it prints, with both devices' Diagnostics text.

Write down for each step: as described, not as described, or unclear, and what you saw.
