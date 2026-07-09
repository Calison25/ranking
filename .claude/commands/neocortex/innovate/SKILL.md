---
name: neocortex:innovate
description: "Brainstorm 3 divergent approaches (Conservative/Standard/Radical) for a topic via innovator agent."
argument-hint: "<topic or problem for brainstorm>"
allowed-tools:
  - Agent
---

# NeoCortex Innovate

Generate 3 genuinely distinct design approaches for a problem or topic.

<process>

## Step 1: Validate Input

If `$ARGUMENTS` is empty, ask the user:
```
neocortex:innovate <topic>

Example: neocortex:innovate "caching strategy for user sessions"
```

Stop and wait for input.

## Step 2: Spawn Innovator Agent

Delegate to `Agent` tool with:
- `model: sonnet` (default) — escalate to `opus` if topic involves security, data integrity, or breaking changes
- `subagent_type: general-purpose`
- Full prompt template from `.claude/neocortex/innovator.md`

Agent prompt:
```
You are a design innovator. Your job is to generate 3 genuinely distinct approaches to solve this problem — not variations of the same idea.

## Problem
$ARGUMENTS

## Context
You are working on a software project. Reference existing patterns from the codebase and domain constraints as needed. Focus on mechanisms that differ fundamentally, not just implementation details.

## Your task
Produce exactly 3 options. Each must differ in mechanism, not just implementation detail.

### Conservative
A safe, proven approach that minimizes change and risk. Leverages existing patterns and infrastructure.
- **Rationale**: Why this is the safe choice
- **Key Tradeoff**: What you give up by playing it safe
- **Implementation Sketch**: Concrete approach in 1-3 sentences

### Standard
The canonical engineering solution for this class of problem. Balances quality, effort, and risk.
- **Rationale**: Why this is the "textbook" answer
- **Key Tradeoff**: What this trades against simpler or bolder alternatives
- **Implementation Sketch**: Concrete approach in 1-3 sentences

### Radical
A fundamentally different mechanism — rethinks the problem framing, uses a different abstraction, or applies an unconventional pattern.
- **Rationale**: What insight makes this viable (not just different)
- **Key Tradeoff**: The real cost of this approach (complexity, reversibility, learning curve)
- **Implementation Sketch**: Concrete approach in 1-3 sentences

Rules:
- The 3 options MUST differ in mechanism, not just in implementation detail. "Use Redis" vs "Use Redis with TTL" is NOT a valid pair.
- Be specific. "Use a cache" is useless. "Add an LRU cache keyed by user_id in the session middleware, invalidated on logout" is useful.
- Max 200 words total across all three options.
- Do not recommend a winner. Present options neutrally.
```

## Step 3: Present Results

Print the agent's output directly.

Then add summary line:
```
[innovator] 3 options generated for: "{topic}"
```

</process>
