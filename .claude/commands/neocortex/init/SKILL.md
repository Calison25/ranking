---
name: neocortex:init
description: "Initialize NeoCortex for the current project. Detects project, creates marker, registers in brain."
allowed-tools:
  - Bash
  - Read
  - Glob
---

# NeoCortex Init

Idempotent project initialization. Safe to call multiple times — skips steps already done.

<process>

## Step 1: Check Status

Run `neocortex status` to see if project is already registered and active.

If project is already active and `.neocortex` marker exists, skip to report and return early.

## Step 2: Detect Project

```bash
basename "$(pwd)"
```

```bash
pwd
```

Check project type:
```bash
ls -1 CLAUDE.md package.json go.mod Cargo.toml pyproject.toml mix.exs *.csproj *.sln 2>/dev/null
```

## Step 3: Activate (marker + CLAUDE.md)

```bash
touch "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.neocortex"
```

Patch project CLAUDE.md with NeoCortex behaviors (idempotent):
```bash
PATCH_SCRIPT="${HOME}/.claude/hooks/neocortex-patch-claude-md.sh"
if [ -x "$PATCH_SCRIPT" ]; then "$PATCH_SCRIPT"; fi
```

## Step 4: Register Project

Run `neocortex project upsert --id <project_id> --name <name> --set-active`:
- `project_id`: directory basename (slugified, lowercase, hyphens)
- `name`: human-readable name
- `path`: absolute path from `pwd`

## Step 5: Load Prior Context

Search prior knowledge: `neocortex knowledge search "<project_name>" --limit 5`.

If results found, briefly note what the brain already knows.

## Step 6: Report

```
[neocortex:init] Project: {name} ({project_id}) | Path: {path} | Knowledge: {count} entries
```

</process>
