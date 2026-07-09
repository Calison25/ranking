---
name: neocortex:status
description: "Show NeoCortex brain status: active project, session, pending tasks, and recent knowledge."
allowed-tools:
  - Bash
  - Read
---

# NeoCortex Status

Show the current state of the NeoCortex brain.

<process>

## Step 1: Get Status

Run `neocortex status` to get active project, session, and pending tasks.

## Step 2: List Active Tasks

List current tasks: `neocortex task list`

## Step 3: Present

Format as a clean dashboard:

```
🧠 NeoCortex Status
─────────────────────────────
Project:  {name} ({id})
Session:  {session_name or "none"}
Goal:     {session_goal or "—"}

Tasks:
  ● in_progress: {count}
  ○ pending:     {count}
  ✓ done:        {count}
  ✗ blocked:     {count}

{for each in_progress task:}
  → [{phase}] {title}
{end}

{for each pending task:}
  ○ [{phase}] {title}
{end}
```

</process>
