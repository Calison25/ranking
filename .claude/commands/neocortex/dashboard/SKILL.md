---
name: neocortex:dashboard
description: "Open the NeoCortex web dashboard in your browser. Shows knowledge, tasks (kanban), projects, and sessions."
allowed-tools:
  - Bash
---

# NeoCortex Dashboard

Open the web dashboard UI in the default browser.

<process>

## Step 1: Check if dashboard is running

```bash
curl -sf http://127.0.0.1:9742/api/status >/dev/null 2>&1 && echo "RUNNING" || echo "STOPPED"
```

## Step 2A: If RUNNING

Open the browser:

On macOS:
```bash
open http://127.0.0.1:9742
```

On Linux:
```bash
xdg-open http://127.0.0.1:9742
```

Print:
```
Dashboard: http://127.0.0.1:9742
```

## Step 2B: If STOPPED

Start the dashboard server in the background:

```bash
nohup neocortex tui --daemon > ~/.neocortex/logs/dashboard.log 2>&1 &
```

Wait for it to come up:
```bash
for i in 1 2 3 4 5; do
  curl -sf http://127.0.0.1:9742/api/status >/dev/null 2>&1 && break
  sleep 1
done
```

Then open browser (Step 2A).

If it still doesn't come up after 5 seconds:
```
Dashboard failed to start. Check logs: ~/.neocortex/logs/dashboard.err
Try manually: neocortex tui
```

</process>
