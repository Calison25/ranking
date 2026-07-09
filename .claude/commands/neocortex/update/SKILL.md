---
name: neocortex:update
description: "Update NeoCortex to latest release. Says Already up to date if current."
allowed-tools:
  - Bash
---

# NeoCortex Update

Update NeoCortex CLI to the latest release version.

<process>

## Step 1: Run Update

```bash
neocortex update
```

This command checks the current version against the latest release and upgrades if needed. If already at the latest version, it reports "Already up to date".

## Step 2: Report Result

Output from `neocortex update` is prefixed with `[neocortex]` and displayed directly to the user.

</process>
