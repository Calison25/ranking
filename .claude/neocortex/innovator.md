# Innovator — Divergent Design Space Generator

**Type**: Behavioral (always active)
**Role**: Before committing to a design approach, spawn a creative agent that generates 3 genuinely distinct alternatives. Opus selects one, then devil's advocate challenges it.

## Core Principle

Good designs emerge from explored alternatives. Before locking in an approach for non-trivial problems, generate a structured option space — Conservative, Standard, Radical — so the decision is made by choice, not default.

## When to Trigger

Spawn an Innovator agent in **any of these three cases**:

| Trigger | Example |
|---------|---------|
| **Manual** via `/neocortex:innovate` | User explicitly asks for alternatives |
| **Auto in plan phase** | Before finalizing `task_slice` when Novelty >= 1 OR Scope >= 2 |
| **Auto when Risk >= 2 OR Novelty >= 2** | Security-sensitive or novel-mechanism tasks |

## When NOT to Trigger

- Boilerplate, scaffolding, repetitive CRUD
- Single-file edits with obvious implementation
- Formatting, renaming, documentation
- Bug fixes with clear root cause and known fix
- User explicitly asked for speed ("just do it", "quick fix")
- Tasks already passed through a previous Innovator pass

## How It Works

### 1. Spawn the Innovator

Use `Agent` tool with `model: "sonnet"` (escalate to `opus` if Risk = 2 — see Integration):

```
[innovator] Generating options for: {brief description of design problem}
```

The agent prompt must include:
- The problem/goal to solve
- Relevant context (constraints, codebase state, existing patterns)
- Instruction to produce 3 genuinely distinct approaches

### 2. Agent Prompt Template

```
You are a design innovator. Your job is to generate 3 genuinely distinct approaches to solve this problem — not variations of the same idea.

## Problem
{description of the design problem or goal}

## Context
{relevant constraints, codebase state, existing patterns, requirements}

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

### 3. Process the Options

After receiving the Innovator response, the orchestrator:

1. Evaluates options against constraints and complexity score
2. Selects one option (document rationale inline)
3. Passes the chosen option to devil's advocate for challenge (see devils-advocate.md)

| Selection | Next Step |
|-----------|-----------|
| **Conservative** | Proceed to devil's advocate with "minimize-risk" framing |
| **Standard** | Proceed to devil's advocate with "canonical-tradeoffs" framing |
| **Radical** | Proceed to devil's advocate — higher scrutiny, devil's advocate is especially useful here |

### 4. Report to User

Print a brief line:

```
[innovator] options generated → selected: {Conservative|Standard|Radical} — {one-line rationale}
```

## Integration with Other Behaviors

- **Model Router**: Innovator agents use `sonnet` by default. Escalate to `opus` if Risk = 2 (security, data integrity, breaking changes) — aligns with model-router.md override rules.
- **Devil's Advocate**: Innovator and devil's advocate form a chain — innovator generates the option space, orchestrator picks one, devil's advocate challenges the chosen option. See devils-advocate.md for the challenge protocol. Do not run devil's advocate on all three options — only on the selected one.
- **NeoCortex**: In plan phase, run innovator before finalizing the task brief. The selected option feeds directly into the task description's `Approach` field. If the Radical option is chosen and later succeeds, store it as a `success_pattern`.

## Anti-Patterns — What the Innovator Must NOT Do

- Generate 3 variations of the same mechanism (e.g., "use function X" vs "use function X with flag Y")
- Add options for trivial tasks where the implementation is obvious
- Produce options longer than the 200-word total budget — verbosity inflates context without value
- Recommend a winner — that is the orchestrator's decision
- Run recursively (no Innovator on the Innovator's output)
- Replace devil's advocate — the two roles are complementary, not interchangeable
