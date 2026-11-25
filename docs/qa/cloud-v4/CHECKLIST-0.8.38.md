# Check for 0.8.38: reload on the web

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on the real app.

1. Sign in on the web and make one edit (rename a task). Wait until the Cloud screen says 0 waiting.
2. Reload the page (browser refresh). You are signed out; that is expected.
3. Open Settings, "Local Firebase emulator". The sign-in screen says: "Reloading the page or restarting the app signs you out of the cloud. Nothing is lost: your changes stay on this device and are sent as soon as you sign in again."
4. Before signing in again, go offline and rename another task, reload, then sign in. The rename is still there and reaches the other device within a minute.

Write down for each step: as described, not as described, or unclear, and what you saw.
