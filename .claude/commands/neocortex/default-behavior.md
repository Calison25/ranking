## Default Behavior

Always active in projects with `.neocortex` marker. No `/neocortex` needed.

### On conversation start
- `neocortex init` — if no active project (registers, indexes, patches CLAUDE.md)
- `neocortex knowledge search "<project>"` — load architecture, conventions, build commands

### Goal Detection
When the user provides a non-trivial goal, automatically apply the structured workflow below.

**Apply when**: multi-step task, feature, refactor, bug investigation with deliverable, any work benefiting from task tracking.
**Skip when**: questions, explanations, single quick fixes, lookups, user says "just do it" / "quick fix".

**Default mode**: semi-guided (2-4 clarifying questions before executing).
**Explicit `/neocortex auto <goal>`**: zero questions, full autonomy.
**Explicit `/neocortex <goal>`**: semi-guided with mode selection.

### Before acting
- `neocortex knowledge search "<topic>"` or `neocortex context for-task <id>` — check prior decisions
- `neocortex file symbols "<term>"` — locate functions/types without LSP
- Score task complexity (A/S/R/N/D) -> route to cheapest capable model
- Read existing code before creating. Follow codebase patterns, don't invent new abstractions
- **Source code is the authoritative reference.** NC knowledge context is supplementary — verify against actual code before acting.

---

### Structured Workflow

#### 1. Init & Session
- Ensure active project + session
- `neocortex knowledge search "<goal keywords>"` — load prior context

#### 2. Plan

##### 2a. Research automatico
Antes de montar tasks, o orquestrador DEVE investigar o codebase:
- `neocortex knowledge search "<goal keywords>"` — decisoes e patterns previos
- `neocortex file symbols "<termos relevantes>"` — localizar funcoes/tipos envolvidos
- `neocortex file deps <path>` / `neocortex file dependents <path>` — entender relacionamentos
- `neocortex file tree --prefix <dir>` — estrutura dos modulos afetados
- Web search apenas se envolver API/lib externa

Objetivo: coletar arquivos, patterns e constraints concretos que alimentam o brief de cada task.

##### 2b. Task brief enrichment
Para cada task planejada, montar description rica com este template:

> **O que**: descricao clara da entrega
> **Por que**: motivacao / como se conecta ao goal
> **Onde**: arquivos e simbolos afetados (com paths concretos do research)
> **Approach**: estrategia sugerida — pattern existente a seguir, funcao a estender, interface a implementar
> **Edge cases**: cenarios nao-obvios que o subagent deve cobrir (inferidos do codigo e dominio)
> **Nao fazer**: limites explicitos de escopo

O DoD deve ser especifico ao contexto, nao generico. Em vez de "funciona corretamente", usar "handler retorna 400 com body {error: ...} quando input X esta ausente".

##### 2c. Plan checkpoint (semi-guided only)
Apresentar plano detalhado ao usuario:

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

Se usuario escolhe (b): perguntar quais tasks refinar, investigar mais, atualizar.
Se usuario escolhe (c): redesenhar approach.
Iterar ate usuario escolher (a).

Em modo **autonomo**: pular checkpoint, executar direto. Mas o research e enrichment ainda sao OBRIGATORIOS.

- Devil's advocate on plan before committing
- **MANDATORY: Use `task slice`** to create ALL tasks at once with DoD:
  ```bash
  echo '{"tasks":[{"title":"...","description":"...","depends_on":[],"priority":1,"dod":["criterion 1","criterion 2"]}]}' | neocortex task slice --goal "..." --session <id>
  ```
- Score each task complexity for model routing

#### 3. Per-task loop

O loop abaixo tem dois papeis claros. **O orquestrador (contexto principal) NUNCA delega os passos marcados com 🔒.** Os passos marcados com 🔀 sao delegados para subagents.

| Passo | Quem | O que |
|-------|------|-------|
| **🔒 Iniciar** | Orquestrador | `neocortex context for-task <id> --budget 6000` → `neocortex task update <id> --status in_progress --phase implement` |
| **🔀 Explorar** (score ≥ 4) | Subagent | `code-explorer` para entender patterns e codigo existente (se feature-dev disponivel) |
| **🔀 Arquitetar** (score ≥ 6) | Subagent | `code-architect` para design com trade-offs (se feature-dev disponivel) |
| **🔀 Implementar** | Subagent | Trabalho real — codigo, testes, etc. Agent recebe: goal, file paths, constraints, NC read-only template. Sem replay de conversa. |
| **🔀 Revisar** (score ≥ 4) | Subagent | `code-reviewer` para bugs, DRY, conventions (se feature-dev disponivel) |
| **🔒 Verificar DoD** | Orquestrador | Ver bloco "DoD Gate Protocol" abaixo — NUNCA pular |
| **🔒 Registrar knowledge** | Orquestrador | `knowledge store` — OBRIGATORIO. Ver Guia de Knowledge em neocortex.md |
| **🔒 Fechar task** | Orquestrador | `task update <id> --status done` — SO executar apos DoD gate passar |

**Comandos exatos**: ver "Orchestrator Checklist" em neocortex.md.

##### DoD Gate Protocol (OBRIGATORIO — nunca pular, nunca abreviar)

Apos CADA subagent retornar, o orquestrador DEVE executar estes passos NA ORDEM. Nao avancar para a proxima task sem completar.

```
Passo 1: Conferir self-check do subagent
  → O retorno do subagent DEVE conter a secao "DoD Self-Check"
  → Se nao contiver: re-delegar pedindo o self-check, ou verificar manualmente

Passo 2: Atualizar fase
  → neocortex task update <id> --phase verify

Passo 3: Obter DoD IDs
  → neocortex task get <id> --json
  → Extrair os dod items e seus IDs

Passo 4: Verificar cada criterio
  → Para cada DoD item, avaliar se a evidencia do subagent (ou inspecao direta) confirma
  → Montar dod_results com passed true/false + evidence

Passo 5: Submeter verificacao
  → echo '{"dod_results":[{"dod_id":N,"passed":true,"evidence":"..."},...]}'  | neocortex think done <id>
  → Se ready=false: identificar gap, corrigir (re-delegar se necessario), repetir desde Passo 4
  → Se ready=true: prosseguir para knowledge store e task done

Passo 6: SO AGORA fechar
  → neocortex knowledge store ...
  → neocortex task update <id> --status done
```

**PROIBIDO**: mover task para done sem ter executado `think done` com ready=true. O CLI impede, mas o orquestrador tambem NAO deve tentar.

#### 4. Close
- Store remaining knowledge
- `neocortex session end <id> --summary "..."` — close automatically in both modes

---

### Agent Delegation Rules
- **Delegar trabalho pesado** para subagents: exploracao de arquivos, implementacao, testes, research, code review, refactoring.
- **Lancar em paralelo** quando tasks sao independentes (um message, multiplos Agent tool calls).
- Cada agent recebe **contexto minimo e auto-contido**: goal, file paths, constraints, e o bloco NeoCortex read-only abaixo.
- **Fazer diretamente** (sem agent): single tool calls, quick reads, comunicacao com usuario, **todos os comandos neocortex CLI de mutacao** (task update, knowledge store, session end).
- **Hook enforced**: `neocortex-force-delegation.sh` bloqueia Write/Edit/Bash(mutante) no contexto principal. Apenas subagents podem editar arquivos e executar comandos que modificam estado (git commit/push/reset, rm/mv/cp, npm install, etc). Comandos read-only (git status/log/diff, ls, grep, neocortex CLI) são permitidos no main. Se o hook bloquear, delegar a operação via Agent tool.

### Subagent NeoCortex Template

Incluir este bloco no prompt de TODO subagent delegado:

~~~
## NeoCortex (OBRIGATORIO — read-only)
Voce DEVE usar o CLI `neocortex` para consultas antes de implementar. Isso NAO e opcional.

### Antes de comecar a implementar (OBRIGATORIO):
1. `neocortex knowledge search "<termos relevantes>"` — buscar patterns, decisoes e code_patterns existentes
2. `neocortex file symbols "<nome>"` — localizar funcoes/tipos que voce vai modificar ou estender
3. `neocortex file deps <path>` — entender dependencias dos arquivos que vai tocar

### Durante a implementacao (usar conforme necessidade):
- `neocortex file dependents <path>` — quem importa este arquivo (blast radius)
- `neocortex file impact <path>` — impacto transitivo de mudancas
- `neocortex file tree [--prefix <p>]` — estrutura do projeto

### Antes de retornar resultado (OBRIGATORIO — auto-verificacao):
Verifique CADA criterio do DoD recebido no brief. Para cada criterio:
- Confirme que sua implementacao atende o criterio
- Descreva a evidencia concreta (arquivo, linha, teste, output)
- Se algum criterio NAO foi atendido, corrija ANTES de retornar

Formato de retorno obrigatorio:
```
## DoD Self-Check
- [x] <criterio 1>: <evidencia>
- [x] <criterio 2>: <evidencia>
- [ ] <criterio N>: <motivo do gap + o que foi feito para corrigir>
```

NAO execute comandos de mutacao (task update, knowledge store, session end) — o orquestrador cuida disso.
~~~

### During work
- `neocortex file symbols "<name>"` to find definitions without LSP
- `neocortex file deps <path>` / `neocortex file dependents <path>` to understand file relationships
- `neocortex file impact <path>` before changing critical files (score ≥ 4)
- `neocortex think analyze "question"` before complex decisions
- Devil's advocate before high-impact changes (architecture, security, data model)
- Do only what was asked. No extras, no cleanup, no refactoring beyond scope
- On failure: read the error, diagnose root cause, fix. Don't retry blindly or give up

### After work
- Verify the change works (build, test, lint) before reporting complete
- Be concise. Report result, not process

### Sessions
- Hooks manage session lifecycle automatically
- On conversation close: `neocortex session end <id> --summary "..."`

### Working in worktrees

NC supporta uso paralelo de git worktrees — multiplos Claudes rodando em checkouts diferentes do mesmo projeto, sem cross-contamination.

**Auto-attribution by Claude session**
- Hook `SessionStart` cria 1 NC session por Claude session (cooldown 60s, branch slugificado no name)
- Cada NC session e bound ao `worktree_id` do checkout — tasks/knowledge/tokens atribuidos corretamente
- `tasks.worktree_id` e auto-populado via session.worktree_id em task slice/create

**Workflow recomendado (paralelismo end-to-end)**

1. **Provisionar fleet** (1 comando substitui N comandos manuais):
   ```bash
   neocortex worktree fleet --plan plan.json [--dry-run]
   ```
   Schema do plan.json: `{goal, base, workers[{name, branch, session_name, session_goal, tasks[{title, description, depends_on, priority, dod}]}]}`. Cria N worktrees + N NC sessions + N task sets bindados.

2. **Trabalhar em paralelo** (em cada worktree, opcionalmente):
   ```bash
   neocortex worktree claude <name>     # spawn Claude no worktree
   ```

3. **Acompanhar estado** (em qualquer momento):
   ```bash
   neocortex worktree status            # ahead/behind, dirty, sessao, last commit
   neocortex task list --worktree <n>   # tasks do worktree
   ```

4. **Sincronizar com main** (quando main avancou):
   ```bash
   neocortex worktree sync <name>       # rebase main no worktree
   ```

5. **Detectar overlap antes de mergear**:
   ```bash
   neocortex worktree conflicts         # pares com arquivos sobrepostos
   ```

6. **Integrar em main** (NAO precisa primary em main — relax constraint):
   ```bash
   neocortex worktree merge <name> --into main
   ```
   Detalhes: usa qualquer worktree em main, ou cria temp em `/tmp/nc-merge-*` e remove apos. Conflito preserva temp para resolucao manual.

7. **Limpeza**:
   ```bash
   neocortex worktree remove <name> --force   # worktree vivo
   neocortex worktree prune                   # brain rows de worktrees que sumiram do FS
   ```

**Critical rule: merge com sessao ativa e bloqueado**
- Hook `pre-merge` retorna exit 2 quando `worktree merge <name>` e chamado e o source worktree tem NC session ativa
- Antes de mergear, encerrar a session: `neocortex session end <session-id> --summary "..."`
- `--abort` nao dispara a guard (sempre passa); abort descobre automaticamente qual worktree esta em merge state

**Shared brain, isolated file index**
- Brain SQLite (`~/.neocortex/brain.db`) e compartilhado: knowledge/tasks/sessions visiveis globalmente
- File index isolado por `worktree_id`: `file search/symbols/deps` retornam so arquivos do worktree atual
- Marker `.neocortex` herdado: linked worktrees sem marker proprio caem no primary via `git-common-dir` (hook `project-guard`)

**Dashboard com worktree filter**
- Dropdown "Worktree" abaixo do seletor de projeto filtra tasks e sessions
- Selecao persistida em `nc_worktree_filter` no localStorage
- Endpoint `/api/worktrees` lista worktrees do projeto ativo

**Limitations**
- Hooks fail-open: erros internos nao bloqueiam Claude
- Conflict prediction pre-fleet e v1 stub (parsing de descricoes nao implementado); `worktree conflicts` cobre detecao pos-criacao via diff real
- Fleet nao spawna Claude automaticamente — usuario faz com `worktree claude <name>` apos

### Cooperacao com Skills Externas

NC pode cooperar com qualquer skill externa instalada (feature-dev, security-review, cypress, frontend-design, claude-md-management, atlassian:*, etc.) via `/neocortex:coop <slash-command> [args]`. A invocacao envelopa a skill com tracking NC (session, wrapper task, DoD gate, knowledge capture).

#### Quando cooperar
- Tarefa matchea workflow pronto de skill externa:
  - Feature estruturada com discovery + design + impl → `/neocortex:coop /feature-dev <desc>`
  - Auditoria de seguranca em codigo recem-escrito → `/neocortex:coop /security-review`
  - Teste E2E de UI → `/neocortex:coop /cypress <spec>`
  - UI nova com design polido → `/neocortex:coop /frontend-design <desc>`
  - Auditoria/melhoria de CLAUDE.md → `/neocortex:coop /claude-md-management:claude-md-improver`
  - Workflows Atlassian (Jira/Confluence) → `/neocortex:coop /atlassian:<command>`
- Skill encapsula multi-step workflow que seria caro replicar
- Output da skill vai virar knowledge / artefato registravel

#### Quando NAO cooperar
- Tarefa atomica (1 arquivo, 1 mudanca simples) → fazer direto ou subagent unico
- Subagent ja resolve com brief + DoD (sem necessidade de fluxo multi-fase da skill)
- Modo `auto` E a skill faz perguntas ao usuario (skill interrompe o fluxo autonomo)
- Recursao: NUNCA `/neocortex:coop /neocortex*` (coop bloqueia em phase 1)

#### Regras de runtime
- **Sem allowlist**: NC nao mantem lista de skills permitidas. Tenta invocar via Skill tool e reporta erro se skill nao existe (Skill tool valida).
- **Nao interferir**: durante execucao da skill, NC NAO intervem em checkpoints, perguntas ou TodoWrite da skill. A skill e dona do fluxo interno.
- **DoD gate pos-retorno**: assim que a skill retorna controle, NC executa DoD gate do wrapper task (criterios genericos: skill completou sem erro, output capturado, decisoes registradas).
- **Knowledge captura output relevante**: pos DoD gate, NC registra `knowledge store` extraindo decisoes/artefatos da skill (type: reference ou pattern conforme natureza).
- **Sessao permanece aberta**: coop NAO fecha sessao automaticamente — usuario pode encadear coops.

#### Anti-padroes
- Cooperar para tarefas atomicas (overhead de wrapper task supera benefit)
- Cooperar em modo `auto` com skills que pedem confirmacao ao usuario (quebra autonomia)
- Tentar mid-flight intervir no fluxo da skill (NC e wrapper, nao supervisor)
- Esquecer de extrair output como knowledge pos-retorno (perde o ponto de tracking)
- Re-invocar a mesma skill por falta de visibilidade do que ja foi feito — sempre consultar `task list` antes
