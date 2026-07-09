# Orchestration — Master Decision Layer

**Type**: Behavioral (top-level, always active)
**Role**: Orchestration runs BEFORE other behavioral specs decide. It selects which path the request follows through innovator, devil's advocate, supervisor, direct delegation, or pass-through. No other spec activates until orchestration has chosen the path.

---

## Core Principle

Route by **intent + complexity + risk**, not by keyword matching. Every user request is classified into exactly ONE path at the top level. Paths are mutually exclusive at entry, but can chain internally (e.g., `plan-creative` chains innovator → orchestrator selection → devil's advocate → task_slice). The orchestrator scores the request once (Ambiguity / Scope / Risk / Novelty / Dependencies per `model-router.md`), reads the intent (plan, implement, review, ask, fix), then dispatches.

The goal is to prevent the three quality mechanisms (innovator, devil's advocate, supervisor) from either (a) all firing together with no order, or (b) competing and cancelling each other out. Orchestration is the contract that says: given the score and intent, here is the single path; here is what chains inside it.

---

## Decision Tree

Each path is named, has explicit entry conditions, and a defined chain. The orchestrator picks ONE path per request.

### plan-creative
**Entry condition**: intent = plan AND (`Novelty >= 1` OR `Scope >= 2` OR user explicitly asks for alternatives / "what are the options" / "compare approaches").
**Chain**:
1. Spawn innovator (per `innovator.md`) → receive 3 distinct options (Conservative / Standard / Radical)
2. Orchestrator selects one option, documenting rationale inline
3. Spawn devil's advocate (per `devils-advocate.md`) on the selected option only
4. Apply verdict (PROCEED / ADJUST / RETHINK) and finalize approach
5. `task slice` with the locked-in approach feeding each task's `Approach` field
**Notes**: This is the highest-leverage planning path. Skip steps 1-3 only if user has already chosen an option in a prior turn.

### plan-standard
**Entry condition**: intent = plan AND NOT creative-trigger (Novelty = 0 AND Scope < 2 AND no alternatives request) AND task is non-trivial (multi-step / multi-file).
**Chain**:
1. Spawn devil's advocate on the proposed plan (no innovator — the approach is canonical)
2. Apply verdict and adjust
3. `task slice`
**Notes**: This is the default planning path for "standard engineering" work — building a feature with a known pattern, refactoring within a known architecture.

### implement-coordinated
**Entry condition**: intent = implement AND (`complexity_score >= 6` OR `>= 3 specialist roles needed` OR multi-file structural change spanning `>= 3 files`) — per `dev-team.md`.
**Chain**:
1. Spawn Supervisor (opus) with full task brief + DoD per `dev-team.md`
2. Supervisor manages Architect → Implementer → Reviewer → Tester sequentially
3. Supervisor returns one aggregated DoD self-check to main
4. Main runs DoD Gate (per `default-behavior.md`) and `knowledge store`
**Notes**: One level of hierarchy only. Supervisor never recurses. Main retains all neocortex mutations.

### implement-simple
**Entry condition**: intent = implement AND `complexity_score < 6` AND single specialist role needed AND `<= 2 files` touched.
**Chain**:
1. Score task per `model-router.md` (haiku / sonnet / opus)
2. Spawn ONE subagent directly with the brief + NeoCortex read-only template + DoD
3. Main runs DoD Gate and `knowledge store`
**Notes**: No supervisor overhead. This is the cheapest path and the most common for small features and bug fixes.

### review-gate
**Entry condition**: triggered AFTER any implement-* path completes AND (`Risk >= 2` OR (`Scope >= 2` AND task touches data access)). May also be triggered standalone if user asks "review this code".
**Chain**:
1. Run convention-reviewer (haiku) — always, lightweight
2. Run security-reviewer (sonnet) if `Risk >= 2`
3. Run perf-reviewer (sonnet) if `Scope >= 2` AND task touches data / DB / network
4. Main aggregates findings; FAIL findings re-open the task (back to implement-* with the failed criteria)
**Notes**: Reviewers come from `default-behavior.md`. Never runs as the primary path for "implement and review" requests — it always chains AFTER implementation.

### pass-through
**Entry condition**: intent = ask OR explanation OR lookup OR single quick fix OR user said "just do it" / "quick fix" / "rapidinho" / similar speed signal.
**Chain**:
- Direct answer OR single tool call. NO innovator, NO devil's advocate, NO supervisor, NO reviewers.
**Notes**: Speed-first path. If the user requests speed explicitly, this path is forced regardless of complexity score.

---

## Phase × Trigger × Handler

| Phase | Trigger | Handler | Notes |
|-------|---------|---------|-------|
| **Plan** | Novelty >= 1 OR Scope >= 2 OR user asks for alternatives | `plan-creative` → innovator + devil's advocate | Innovator produces 3 options; orchestrator picks; devil's advocate challenges. |
| **Plan** | Multi-step task, canonical approach, no creative ambiguity | `plan-standard` → devil's advocate only | Skip innovator when the design space is well-trodden. |
| **Plan** | Trivial task, single-step, obvious fix | `pass-through` | No planning ceremony; act directly. |
| **Implement** | complexity_score >= 6 OR >= 3 specialist roles OR >= 3 files | `implement-coordinated` → supervisor (opus) | Supervisor delegates Architect/Implementer/Reviewer/Tester. |
| **Implement** | complexity_score < 6, single role, <= 2 files | `implement-simple` → direct subagent (model per router) | Cheapest viable path. |
| **Implement** | User said "just do it" / "quick fix" | `pass-through` | Speed override beats complexity score. |
| **Review** | After implement-* AND Risk >= 2 | `review-gate` → security-reviewer + convention-reviewer | Security-critical surfaces require explicit security review. |
| **Review** | After implement-* AND Scope >= 2 AND data access touched | `review-gate` → perf-reviewer + convention-reviewer | Catches N+1, missing indices, unbounded queries. |
| **Review** | After any implement-*, low risk | `review-gate` → convention-reviewer only (haiku) | Cheap baseline check — naming, structure, patterns. |

---

## Anti-Patterns

1. **Supervisor recursion** (a supervisor spawning another supervisor) — context explosion and broken hand-off protocol. Max hierarchy is main → supervisor → specialist.
2. **Devil's advocate on a quick-fix** — violates the user's explicit speed request and burns tokens on ceremony for a task that does not need it.
3. **Innovator on CRUD / boilerplate** — zero added value (the mechanism is obvious), pure token cost. Innovator exists for design ambiguity, not for "add a field to a struct".
4. **Two supervisors in parallel** for the same goal — duplicate planning, fragmented results, no clear DoD aggregation. If a goal needs two supervisors, split it into two top-level tasks first.
5. **Innovator AFTER implementation** — design alternatives explored after the code is written are wasted; innovator must run before commitment, not as retrospective second-guessing.
6. **Devil's advocate on all three innovator options** — multiplies cost 3x with no decision benefit. The orchestrator picks ONE option, then challenges it.
7. **Skipping pass-through for declared quick-fixes** — if the user said "just do it" and the orchestrator still runs devil's advocate, the system is ignoring an explicit signal. Speed signals are hard overrides.

---

## Edge Cases

- **`/neocortex auto` mode**: skip user confirmation checkpoints, but quality gates (innovator, devil's advocate, supervisor, reviewers) STILL trigger whenever their conditions are met. Auto removes user-in-the-loop, not the quality layer.
- **Explicit speed signal** ("quick fix", "just do it", "rapidinho", "só faz aí"): force `pass-through` regardless of complexity score. The user's explicit choice beats the heuristic.
- **Ambiguous request without clear score**: default conservative → `plan-standard` (no innovator, no supervisor). Devil's advocate still runs because it is cheap and catches assumption gaps. If the conversation reveals higher complexity later, escalate then.
- **Conflict between model-router and supervisor**: `model-router.md` may score the overall task as warranting haiku, but `dev-team.md` always uses **opus for the supervisor itself** (specialists then follow the router). Supervisor coordination is always opus; specialist execution follows the score.
- **Review-only request** ("review this code" / "audit this"): treat as standalone `review-gate` with no implement-* phase. Pick reviewers based on what the code does (data access → perf; auth/input → security; everything → convention).

---

## References

- **`innovator.md`** — Generates 3 divergent options (Conservative / Standard / Radical) before design lock-in. Triggered inside `plan-creative` only.
- **`dev-team.md`** — Hierarchical supervisor pattern: main → supervisor (opus) → 4 specialists. Owns the `implement-coordinated` path.
- **`devils-advocate.md`** — Adversarial quality gate that challenges plans and high-impact decisions. Runs inside both `plan-creative` (on selected option) and `plan-standard` (on the proposed plan).
- **`model-router.md`** — Complexity scoring (A / S / R / N / D, 0–10 total) that feeds every routing decision in this spec, including path selection and per-subagent model choice.
- **`default-behavior.md`** — The per-task loop, DoD Gate Protocol, knowledge store guide, and the specialized reviewers (security / perf / convention) that `review-gate` orchestrates.
