# Check for 0.8.33: receiving (phone + web)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices.

1. **Signal check.** Open Sync status on the web and on the phone. Write down "Live signal" (YES/NO) and the Mode line.
2. **Speed, both ways.** Change a task title on the phone, press Save; time how many seconds until the web shows it. Then web to phone. Write both numbers. Good: under 10 seconds with a live signal; under about 65 seconds in the worst case.
3. **Worst case.** Do step 2 three times in a row. If any took longer than 10 seconds, open Sync status on the slow side and copy the line "Safety checks that found changes the signal never announced" and the "Mode" line. This tells me whether the live signal works at all.
4. **Polling switch.** If the Mode line ever says "polling (the live signal missed changes...)", the signal does not work in your setup. Copy it and keep testing: changes should now arrive within about 5 to 10 seconds.
5. **Idle.** Leave both open for 3 minutes without touching them. Nothing should break, and the counter stays "0 waiting · 0 need review".

Write down for each step: as described, not as described, or unclear, and what you saw (numbers help).
