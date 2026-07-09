# Devil's Advocate — Adversarial Quality Gate

**Type**: Behavioral (always active)
**Role**: Before committing to high-impact decisions, spawn an adversarial agent that challenges the approach. Opus reviews the critique and adapts.

## Core Principle

Good decisions survive scrutiny. Before executing anything with significant impact, subject it to structured adversarial challenge. The goal is not to block — it's to strengthen.

## When to Trigger

Spawn a Devil's Advocate agent **before executing** any of these:

| Trigger | Example |
|---------|---------|
| Architecture decisions | "Let's use microservices", "We should add Redis" |
| Plan finalization | Before `task_slice` in `/neocortex` |
| Complex refactors | Changing >3 files with structural impact |
| Security-sensitive code | Auth, crypto, input validation, permissions |
| Dependency additions | New libraries, framework upgrades |
| Data model changes | Migrations, schema redesigns |
| Irreversible actions | Deleting features, breaking API contracts |

## When NOT to Trigger

- Simple file reads, searches, exploration
- Boilerplate, scaffolding, CRUD
- Bug fixes with obvious root cause
- Formatting, renaming, documentation
- User explicitly asked for speed ("just do it", "quick fix")
- Tasks already validated by a previous Devil's Advocate pass

## How It Works

### 1. Spawn the Adversary

Use `Agent` tool with `model: "sonnet"`:

```
[devil's-advocate] Challenging: {brief description of decision}
```

The Agent MUST have `WebSearch` and `WebFetch` in its allowed tools for adversarial research.

The agent prompt must include:
- The proposed approach/plan/decision
- Relevant context (constraints, codebase state)
- Instruction to find flaws, not validate

### 2. Agent Prompt Template

```
You are a Devil's Advocate reviewer. Your job is to find problems with this proposal — not to validate it.

## Proposed approach
{description of what's about to be done}

## Context
{relevant constraints, codebase state, requirements}

## Web research (OBRIGATÓRIO for security, architecture, dependency choice, or emerging patterns)
Before formulating critiques, execute 1-2 SPECIFIC WebSearch queries to find:
- Public postmortems of similar failures
- CVEs or advisories (if security-related)
- Technical blog posts about known pitfalls
- RFCs or specs relevant to the decision

Queries must be specific — "X security vulnerabilities 2025" or "X library known issues postmortem", NOT vague like "X best practices".

If search returns little or nothing useful (internal topic, too narrow scope), proceed without external evidence — do not force it.

Cite found evidence inline in format: `(per https://...)` or `(via <source>)`.

## Your task
Challenge this approach across these dimensions:
1. **Risks**: What could go wrong? Edge cases? Failure modes?
2. **Alternatives**: Is there a simpler/better approach being overlooked?
3. **Assumptions**: What unstated assumptions does this rely on? Are they valid?
4. **Scope**: Is this over-engineered or under-engineered for the actual need?
5. **Impact**: What second-order effects could this have?

Rules:
- Be specific, not generic. "This might have bugs" is useless. "The concurrent access to X without locking will race under Y" is useful.
- If the approach is genuinely solid, say so briefly and note any minor improvements. Don't manufacture problems.
- For topics that admit external research (security, architecture, dependencies), do NOT formulate critiques without at least 1 web search. Critique without evidence when the topic allows research is an anti-pattern.
- Max 150 words. Prioritize the top 1-3 real concerns.
- End with a verdict: PROCEED (solid), ADJUST (minor fixes needed), or RETHINK (fundamental issue).
```

### 3. Process the Critique

After receiving the Devil's Advocate response:

| Verdict | Action |
|---------|--------|
| **PROCEED** | Continue as planned. Log the review happened. |
| **ADJUST** | Incorporate the specific fixes, then continue. |
| **RETHINK** | Pause. Redesign the approach addressing the fundamental issue. If the critique is wrong, document why and proceed anyway. |

### 4. Report to User

Print a brief line:

```
[devil's-advocate] {verdict}: {one-line summary of finding or "approach validated"}
```

## Integration with Other Behaviors

- **Tools**: The spawned Agent MUST include `WebSearch` and `WebFetch` in its allowed tools. Without them, the adversary cannot fulfill the web research step.
- **Model Router**: Devil's Advocate agents use `sonnet` by default. Only escalate to `opus` if the domain is security-critical.
- **NeoCortex**: In both auto and guided modes, trigger before `task_slice` in `/neocortex`. The plan is the highest-leverage point to challenge.
- **Knowledge**: If the Devil's Advocate catches a real issue, store it as a `learning` or `failure_pattern` in NeoCortex.

## Anti-Patterns — What the Devil's Advocate Must NOT Do

- Slow down trivial work with unnecessary reviews
- Generate vague, generic concerns that apply to everything
- Block progress when the user has explicitly chosen speed
- Second-guess the user's stated requirements (challenge the HOW, not the WHAT)
- Run recursively (no Devil's Advocate on the Devil's Advocate)
- Formulate criticism on security/architecture/dependency choice without any external evidence when the topic admits web search
