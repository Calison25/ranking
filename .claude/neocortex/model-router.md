# Model Router — Complexity-Based Model Delegation

**Type**: Behavioral (always active)
**Role**: Opus acts as supervisor. Cheaper models execute. Opus reviews all outputs.

## Core Principle

Don't map phases to models — score the **actual task complexity** and route to the cheapest capable model. A simple implementation goes to haiku. A complex plan goes to opus. The task determines the model, not the category.

## Complexity Score (0-10)

Score each task across 5 dimensions (0-2 points each):

| Dimension | 0 | 1 | 2 |
|-----------|---|---|---|
| **Ambiguity** | Crystal clear, known pattern | Some interpretation needed | Underspecified, needs design decisions |
| **Scope** | Single file, isolated | 2-5 files, one module | 6+ files, cross-cutting |
| **Risk** | Safe, reversible (docs, format) | Moderate, testable (new feature) | High — security, data, breaking changes |
| **Novelty** | Boilerplate, CRUD, repetitive | Standard engineering, some judgment | Novel solution, no established pattern |
| **Dependencies** | Self-contained | 1-2 integrations | Multiple systems, coordination |

### Model Thresholds

| Score | Model | Profile |
|-------|-------|---------|
| **0-3** | haiku | Mechanical — boilerplate, search, format, simple edits |
| **4-6** | sonnet | Engineering — features, tests, refactors, debugging |
| **7-10** | opus | Architect — design, ambiguity, security, multi-system |

### Override Rules (take precedence over score)

The score is a guide, not a formula. These overrides prevent critical signals from being diluted by low scores in other dimensions:

| Condition | Minimum Model | Rationale |
|-----------|---------------|-----------|
| Risk = 2 | sonnet | Security, data integrity, or breaking changes require careful reasoning |
| Risk = 2 AND any other dimension = 2 | opus | High-risk + complexity compound — needs deep analysis |
| Ambiguity = 2 | sonnet | Underspecified tasks need interpretation, not mechanical execution |
| Novelty = 2 AND Scope >= 1 | sonnet | Novel cross-file solutions need engineering judgment |
| Any 3+ dimensions at 2 | opus | Broad complexity across multiple axes |

Apply overrides **after** scoring. If the override promotes the model, use the higher model and note it in the terminal output.

### Scoring Examples

| Task | A | S | R | N | D | Total | Model |
|------|---|---|---|---|---|-------|-------|
| Add `email` field to User struct | 0 | 0 | 0 | 0 | 0 | **0** | haiku |
| Generate CRUD endpoints for Orders | 0 | 1 | 0 | 0 | 0 | **1** | haiku |
| Write unit tests for auth service | 0 | 1 | 1 | 0 | 1 | **3** | haiku |
| Implement JWT auth middleware | 1 | 1 | 2 | 1 | 1 | **6** | sonnet |
| Refactor DB layer to repository pattern | 1 | 2 | 1 | 1 | 1 | **6** | sonnet |
| Design event-driven notification system | 2 | 2 | 1 | 2 | 2 | **9** | opus |
| Fix race condition in cache invalidation | 1 | 1 | 2 | 2 | 2 | **8** | opus |

## Terminal Output

### Normal routing
```
⚡ router → sonnet [5] implementing JWT auth middleware
```

### With breakdown (borderline scores 3-4 or 6-7)
```
⚡ router → sonnet [4] writing integration tests
  └─ A:0 S:1 R:1 N:1 D:1
```

### Override applied (score says haiku, but Risk=2 forces sonnet)
```
⚡ router → sonnet [3↑] adding input validation to auth endpoint
  └─ A:0 S:0 R:2 N:0 D:1 — override: risk
```

### Escalation (delegated model failed, re-routing up)
```
⚡ router ↑ opus [4→7] auth middleware — escalating: missed token refresh edge cases
```

### Direct handling (opus, no delegation)
```
⚡ router ● opus [8] designing event-driven notification architecture
```

### Format reference
- `→` normal delegation
- `↑` escalation (with original→new score)
- `●` opus handles directly
- `[N↑]` score with override promotion

## Delegation Protocol

1. **Score** the task across the 5 dimensions
2. **Print** the routing line to the terminal
3. **Delegate** using the Agent tool with the `model` parameter
4. **Review** the output:
   - Acceptable → use it, continue
   - Not acceptable → re-score (the failure reveals hidden complexity), print escalation line, re-delegate one tier up
5. **Escalation limit**: 1 re-delegation max. If sonnet also fails, opus handles directly.

## What Opus Always Does Directly

- Reads and interprets user messages
- Scores tasks and decides routing
- Reviews ALL outputs from delegated work
- Communicates with the user
- Makes judgment calls on ambiguous situations
- Tasks scoring 7+

## Integration Rules

- Applies **inside** other skills (NeoCortex plan, feature-dev, etc.)
- When another skill explicitly sets a `model` parameter, **respect it** — don't override
- When spawning `subagent_type` agents, still apply `model` based on score unless the agent type implies high complexity
- Devil's Advocate agents always use `sonnet` (per its own rules) — don't re-route them

## When NOT to Route

- User explicitly asks for speed ("just do it", "quick fix") → use cheapest viable
- Single tool calls (one grep, one file read) → just do it, no agent needed
- Conversation with the user → opus always, no delegation

## Cost Reference

| Model | Input/1M | Output/1M | Relative Cost |
|-------|----------|-----------|---------------|
| Haiku 4.5 | $0.80 | $4.00 | 1x |
| Sonnet 4.6 | $3.00 | $15.00 | ~4x |
| Opus 4.6 | $15.00 | $75.00 | ~19x |
