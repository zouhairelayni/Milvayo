# Check for 0.8.31: the counter and the banner (phone + web)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices.

1. **Normal state.** Connect both. In Settings, "Firebase emulator", the line should read "0 waiting · 0 need review". No banner on the main screen.
2. **Make a conflict.** Change the same task's title on the web (save), then on the phone (save).
3. **Banner.** On the phone, the main screen shows a banner: "1 change needs your review: someone else changed the same thing." with "Review". Press it: you land in Settings.
4. **Counter with a conflict.** The line reads "0 waiting · 1 need review" once the other edits have gone out. Edit a different task: it briefly reads "1 waiting", then "0 waiting · 1 need review".
5. **Resolve.** Review conflicts, "Keep cloud version". The banner disappears and the line reads "0 waiting · 0 need review".

Write down for each step: as described, not as described, or unclear, and what you saw.
