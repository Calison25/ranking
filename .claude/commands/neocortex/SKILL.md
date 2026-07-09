---
name: neocortex
description: "NeoCortex brain — main entry point. /neocortex <goal> to plan and execute. Always initializes the project first."
argument-hint: "[auto] <goal or question>"
allowed-tools:
  - Agent
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# NeoCortex

Main entry point. Initializes the project and runs the best workflow for the goal.

## Mode Detection

- `$ARGUMENTS` starts with `auto` (case-insensitive): **autonomous mode**. Strip "auto", rest is the goal.
- Otherwise: **semi-guided mode**. Full `$ARGUMENTS` is the goal.

---

## Step 1: Init (always)

1. Run `neocortex status` to check project/session state
2. If no active project: detect from `pwd` and run `neocortex project upsert --id <slug> --name <name> --set-active`
3. Ensure `.neocortex` marker: `touch "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.neocortex"`
4. Patch project CLAUDE.md (idempotent): `PATCH="${HOME}/.claude/hooks/neocortex-patch-claude-md.sh"; [ -x "$PATCH" ] && "$PATCH"`

## Step 2: Session

Start session: run `neocortex session start --name <slugified-goal> --goal "<goal>"`

## Step 3: Gather Context

1. Search prior knowledge: `neocortex knowledge search "<goal keywords>"`
2. Explore codebase as needed (read files, check structure)

---

## Autonomous Mode

Zero questions. AI makes ALL decisions. Executes start-to-finish.

### Research automatico (OBRIGATORIO)
Antes de montar tasks, investigar o codebase:
- `neocortex knowledge search "<goal keywords>"` — decisoes e patterns previos
- `neocortex file symbols "<termos relevantes>"` — localizar funcoes/tipos envolvidos
- `neocortex file deps <path>` / `neocortex file dependents <path>` — entender relacionamentos
- `neocortex file tree --prefix <dir>` — estrutura dos modulos afetados
- Web search apenas se envolver API/lib externa

Objetivo: coletar arquivos, patterns e constraints concretos que alimentam o brief de cada task.

### Plan

Break the goal into 3-8 tasks. For each, montar **description rica** com:

> **O que**: descricao clara da entrega
> **Por que**: motivacao / como se conecta ao goal
> **Onde**: arquivos e simbolos afetados (com paths concretos do research)
> **Approach**: estrategia sugerida — pattern existente a seguir, funcao a estender, interface a implementar
> **Edge cases**: cenarios nao-obvios que o subagent deve cobrir (inferidos do codigo e dominio)
> **Nao fazer**: limites explicitos de escopo

Additionally:
- **title**: clear, actionable (imperative form)
- **depends_on**: 0-based indexes of prerequisite tasks
- **priority**: 2=high, 1=normal, 0=low
- **dod**: 2-4 testable, context-specific Definition of Done criteria (NOT generic — e.g., "handler returns 400 with {error: ...} when field X is missing", not "works correctly")

Print the plan summary:
```
Plan: {goal}
1. [P{n}] {title}
   Approach: {approach resumido}
   Files: {arquivos principais}
   Edge cases: {lista}
   DoD: [criterios]
2. ...
```

**MANDATORY**: Run `task slice` to create all tasks at once:
```bash
echo '{"tasks":[{"title":"...","description":"...","depends_on":[],"priority":1,"dod":["criterion 1","criterion 2"]}]}' | neocortex task slice --goal "<goal>" --session <id>
```

### Execute All Tasks

Para cada task, seguir o **per-task loop** definido em default-behavior.md:

1. **🔒 Iniciar**: `context for-task` → `task update --status in_progress --phase implement`
2. **🔀 Explorar/Arquitetar** (se score justifica e feature-dev disponivel)
3. **🔀 Implementar**: delegar para subagent com **brief completo da task** (description rica + DoD + NC template + contexto do context-for-task). NAO enviar apenas titulo. O subagent DEVE retornar com secao "DoD Self-Check".
4. **🔀 Revisar** (se score ≥ 4 e feature-dev disponivel)
5. **🔒 Verificar DoD (NUNCA PULAR)**: Seguir o DoD Gate Protocol completo de default-behavior.md:
   - Conferir "DoD Self-Check" do subagent → `task update --phase verify` → `task get --json` → montar dod_results → `think done` com dod_results
   - Se ready=false: corrigir e repetir. Se ready=true: prosseguir.
   - **PROIBIDO avancar para o passo 6 sem ready=true.**
6. **🔒 Registrar knowledge**: `knowledge store` — OBRIGATORIO (ver Guia de Knowledge em neocortex.md)
7. **🔒 Fechar task**: `task update --status done` — so apos DoD gate passar (ready=true)

**Comandos exatos de cada 🔒 passo**: ver "Orchestrator Checklist" em neocortex.md.

### Finalize

1. Run `neocortex session end <session_id> --summary "<summary>"`
2. Print final report:
```
Done: {goal}
├── Tasks: {done}/{total}
├── Knowledge: {entries_stored} entries captured
└── Session: closed
```

---

## Semi-Guided Mode (default)

### Clarify Goal

Ask 2-4 targeted questions covering:
- Scope boundaries (what's in, what's out)
- Success criteria
- Known constraints
- Preferences

#### Question Format (MANDATORY)

Each question with multiple options **MUST include exactly one recommendation** marked with `(recomendado)`. Base the recommendation on:
- Codebase context (existing patterns, conventions)
- Risk/complexity tradeoffs
- Common best practices for the domain

Format example:
```
1. Escopo do refactor:
   (a) Apenas o módulo de auth
   (b) Auth + session management (recomendado)
   (c) Todo o subsistema de identidade

2. Estratégia de migração:
   (a) Big bang — uma release
   (b) Feature flags + rollout gradual (recomendado)
   (c) Parallel run por 2 semanas
```

If a question is open-ended (not multiple choice), no recommendation needed — just ask directly.

Wait for answers before proceeding.

### Plan (with checkpoint)

Same research + enrichment as autonomous. Then present plan with checkpoint:

```
Plan: {goal}
1. [P{n}] {title}
   Approach: {approach resumido}
   Files: {arquivos principais}
   Edge cases: {lista}
   DoD: [criterios]
2. ...

Opcoes:
(a) Executar — plano esta bom
(b) Detalhar — quero refinar tasks especificas
(c) Repensar — quero mudar a abordagem
```

Se usuario escolhe (b): perguntar quais tasks refinar, investigar mais, atualizar. Apresentar checkpoint novamente.
Se usuario escolhe (c): redesenhar approach do zero.
Iterar ate usuario escolher (a).

### Execute

Same as autonomous (task_slice → execute all → finalize).

---

## Other Commands

| Command | Description |
|---------|-------------|
| `/neocortex:init` | Just initialize project (no workflow) |
| `/neocortex:status` | Show brain status |
| `/neocortex:dashboard` | Open web dashboard |
