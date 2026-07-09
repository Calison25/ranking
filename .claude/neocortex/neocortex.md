# NeoCortex — External Brain

CLI para knowledge, tasks, context e reflexao.
Binary: `~/.local/bin/neocortex` | DB: `~/.neocortex/brain.db` | Source: `~/workspace/neocortex`

## Regras

- NUNCA usar Obsidian — NeoCortex e o unico knowledge store
- Armazenar conhecimento PROATIVAMENTE (ver Guia de Knowledge abaixo)
- Usar `think` (mode: analyze) antes de decisoes complexas
- Buscar contexto com `context_for_task` antes de comecar tasks
- **SEMPRE usar `task slice` para criar tasks** — NUNCA criar tasks individualmente. Todas as tasks devem ter DoD (2-4 criterios testaveis)
- Encerrar sessao automaticamente em ambos os modos (semi-guiado e autonomo)

## CLI Reference

```bash
# Knowledge
neocortex knowledge search "query"                    # busca FTS knowledge
neocortex knowledge get <id>                          # detalhes de uma entry
neocortex knowledge list [--limit N] [--project <id>] # listar entries recentes
neocortex knowledge delete <id>                       # deletar entry
neocortex knowledge store --title "..." --body "..." --type <type> [--tags "a,b"] [--source "..."]
neocortex knowledge update <id> --title "..." --body "..."
neocortex knowledge link <src> <tgt> [--relation <rel>]
neocortex knowledge import <path>                     # importar transcripts JSONL
neocortex knowledge backfill-links                    # gerar links automaticos

# Tasks
neocortex task list [--status <s>] [--include-done] [--session <id>] [--phase <p>]
neocortex task get <id> [--json]                      # detalhes de task (inclui DoD items)
neocortex task update <id> [--status <s>] [--phase <p>] [--priority <n>]
echo '{"tasks":[...]}' | neocortex task slice --goal "..." [--session <id>]  # fatiar goal com array de tasks
neocortex task dod-check <id> [--check <dod-id>]      # checar definition of done
neocortex task phase <id>                              # avancar fase automaticamente
neocortex task link-memory <task-id> <knowledge-id>    # linkar task a knowledge
neocortex task autolink <id>                           # linkar automaticamente

# Context
neocortex context for-task <id> [--budget N] [--types <t1,t2>] [--complexity N] [--json]

# Reflection
neocortex think analyze "question" [--task <id>]      # reflexao estruturada
echo '{"dod_results":[...]}' | neocortex think done <task-id> [--json]  # verificar se task esta pronta

# Files
neocortex file search "query"                         # buscar arquivos por nome
neocortex file get <path>                             # conteudo de arquivo indexado
neocortex file scan [--path <p>]                      # re-indexar arquivos
neocortex file grep <pattern> [--regex]               # buscar conteudo em arquivos
neocortex file tree [--prefix <p>]                    # arvore do projeto

# File Intelligence
neocortex file symbols "query" [--limit N] [--json]   # buscar simbolos (func, type, class, etc)
neocortex file deps <path> [--json]                   # imports/dependencias de um arquivo
neocortex file dependents <path> [--json]             # quem importa este arquivo (reverse deps)
neocortex file impact <path> [--depth N] [--json]     # impacto transitivo (BFS reverse deps)
neocortex file health [--limit N] [--json]            # metricas de saude do projeto
neocortex file history <path> [--limit N] [--json]    # historico de mudancas de um arquivo
neocortex file changes --since-session <id> [--json]  # arquivos que mudaram desde uma sessao

# Worktrees
neocortex worktree list [--json]                                    # listar worktrees do projeto ativo
neocortex worktree add <branch> [--name <n>] [--base <ref>] [--copy-env]  # criar linked worktree (mutacao)
neocortex worktree remove <name> [--force]                          # remover linked worktree (mutacao)
neocortex worktree path <name>                                      # imprimir caminho absoluto de um worktree
neocortex worktree status [--name <n>] [--json]                     # estado por worktree: branch, ahead/behind, dirty, sessao, last commit
neocortex worktree sync <name> [--from <branch>] [--strategy merge|rebase]  # puxar target branch para dentro do worktree (default --from main, rebase) (mutacao)
neocortex worktree merge <name> [--into <branch>] [--strategy merge|rebase] [--abort]  # merge da branch do worktree em target (qualquer worktree na target serve, ou cria temp) (mutacao)
neocortex worktree conflicts [--base <branch>] [--json]             # pares de worktrees com arquivos modificados em comum vs base
neocortex worktree prune [--dry-run] [--force] [--json]             # remove brain rows de worktrees cujo path sumiu do filesystem (mutacao)
neocortex worktree fleet --plan <file.json> [--dry-run] [--json]    # cria N worktrees + sessions + tasks a partir de plano (mutacao)
neocortex worktree run <name> -- <command> [args...]                # rodar comando dentro de um worktree
neocortex worktree claude <name> [--task <id>] [--prompt <text>]    # spawn Claude Code dentro de um worktree

# Sessions
neocortex session start [--project <id>] [--name <n>] [--goal <g>]
neocortex session end <session-id> [--summary <text>] # encerrar sessao
neocortex session list [--json]                       # listar sessoes ativas

# Projects
neocortex project upsert --id <id> --name <n> [--set-active]
neocortex project list [--json]
neocortex project switch <id>
neocortex project deactivate <id>

# Token
neocortex token usage [--session <id>] [--task <id>] [--json]
neocortex token budget-set --model <m> --budget <n> [--json]

# LSP
neocortex lsp symbols <file> [--json]
neocortex lsp definition|references|hover <file> <line> <col> [--json]

# REM (Reflective Episodic Memory)
neocortex rem run [--deep] [--project <id>] [--dry-run] [--json]  # consolidacao de knowledge (light ou deep)
neocortex rem history [--limit N] [--project <id>] [--json]       # historico de runs
neocortex rem merge <keep-id> <merge-id> [--project <id>]         # merge manual de entries duplicadas

# Analytics
neocortex analytics report [--period 7d] [--project <id>]

# Status
neocortex status [--json]                             # orientacao inicial (projeto, sessao, tasks)
neocortex update                                      # atualiza binario + skills + hooks

```

Adicionar `--json` para output parseavel quando necessario.

```
neocortex <domain> <verb> [args] [flags]

Domains: analytics, context, file, knowledge, lsp, project, rem, session, task, think, token, worktree
Help:    neocortex --help | neocortex <domain> --help
```

## Skills

Slash commands disponiveis:
- `/neocortex [auto] <goal>` — entry point principal (init + plan + execute)
- `/neocortex:init` — apenas inicializar projeto (sem workflow)
- `/neocortex:status` — status do brain
- `/neocortex:update` — atualiza binario + skills + hooks
- `/neocortex:dashboard` — web UI
- `/neocortex:coop <slash-command> [args]` — invoca skill externa com tracking NC (sessão, task wrapper, DoD gate, knowledge)

---

## Orchestrator Checklist (per-task)

**Estes comandos sao responsabilidade EXCLUSIVA do orquestrador (contexto principal). NUNCA delegar para subagents.**

### ANTES de delegar trabalho
```bash
neocortex context for-task <id> --budget 6000          # carregar contexto
neocortex task update <id> --status in_progress --phase implement  # marcar inicio
neocortex file impact <path> --depth 2                 # blast radius dos arquivos afetados
```

O prompt do subagent DEVE incluir o brief completo da task (description rica com O que/Por que/Onde/Approach/Edge cases/Nao fazer). Nao enviar apenas titulo e DoD.

### DELEGAR trabalho → subagent faz codigo/implementacao

O prompt do subagent DEVE conter:
1. **Brief completo da task** — description rica (O que/Por que/Onde/Approach/Edge cases/Nao fazer)
2. **DoD explicito** — criterios especificos, nao genericos
3. **Subagent NeoCortex Template** (definido em default-behavior.md) — acesso read-only ao CLI
4. **Contexto do `context for-task`** — knowledge e patterns relevantes

NAO enviar apenas titulo + "implemente isso". O subagent precisa de contexto suficiente para entregar com qualidade sem precisar redescobrir o codebase.

### DEPOIS que subagent retorna (DoD Gate — NUNCA PULAR)

**STOP. Antes de qualquer outra acao, executar o DoD Gate completo.**
O subagent DEVE ter retornado uma secao "DoD Self-Check". Se nao retornou, re-delegar pedindo o self-check ou verificar manualmente cada criterio.

```bash
# Passo 1: Atualizar fase para verify
neocortex task update <id> --phase verify

# Passo 2: Obter DoD IDs
neocortex task get <id> --json
# → Extrair os dod items e seus IDs do JSON

# Passo 3: Avaliar cada criterio contra evidencia do subagent
# Para cada DoD item: a evidencia do self-check confirma? Inspecionar codigo se necessario.

# Passo 4: Submeter verificacao
echo '{"dod_results":[{"dod_id":N,"passed":true,"evidence":"descricao concreta"},...]}'  | neocortex think done <id>
# → Se ready=false: identificar gap, corrigir (re-delegar se necessario), repetir desde Passo 3
# → Se ready=true: prosseguir para Passo 5

# Passo 5: Registrar conhecimento (OBRIGATORIO — ver Guia abaixo)
neocortex knowledge store --title "..." --body "..." --type <type> --tags "..."

# Passo 6: SO AGORA fechar task
neocortex task update <id> --status done
```

**PROIBIDO**: pular para `task update --status done` sem `think done` retornando ready=true. O CLI bloqueia, e o orquestrador NAO deve tentar contornar.

---

## Guia de Knowledge — O Que Registrar

Knowledge store e OBRIGATORIO apos cada task. Use o tipo adequado:

| Situacao | type | Exemplo de title |
|----------|------|-----------------|
| Feature nova implementada | `pattern` | "API pattern: handler → service → repo" |
| Bug corrigido | `bug-fix` | "Race condition em cache: causa era buffer nao-sincronizado" |
| Decisao de design tomada | `decision` | "Escolheu repository pattern por testabilidade" |
| Refactor feito | `learning` | "Extrair interface antes de refatorar reduz blast radius" |
| API/servico externo integrado | `reference` | "Stripe API: webhook signing usa HMAC-SHA256" |
| Padrao de codigo reutilizavel | `code_pattern` | "Middleware de auth com JWT" (tags: `lang:go,category:auth`) |
| Erro que custou tempo | `failure_pattern` | "Mock de DB escondeu migration quebrada em prod" |
| Abordagem que funcionou bem | `success_pattern` | "TDD para handlers: test primeiro, impl depois" |

**Regra**: se voce aprendeu algo que pouparia tempo no futuro, registre. Na duvida, registre.

## Entry Types

decision, learning, bug-fix, pattern, architecture, reference, note, success_pattern, failure_pattern, domain_knowledge, best_practice, retrospective, code_pattern

### code_pattern type
Store reusable code patterns with metadata via tags: `lang:go`, `framework:gin`, `category:middleware`.
Auto-injected into context during implement phase via `context_for_task`.

## Manutencao

Rebuild: `cd ~/workspace/neocortex && make install`
