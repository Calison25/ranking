---
name: neocortex:coop
description: "Invoca outra skill (slash command) envelopada com tracking NeoCortex — sessão, task wrapper, DoD gate, knowledge capture."
argument-hint: "<slash-command> [args]"
allowed-tools:
  - Skill
  - Bash
  - Read
  - Write
  - Edit
---

> **⚠️ Constraint do hook**: o hook `neocortex-force-delegation.sh` bloqueia heredoc (`<<EOF`), here-string (`<<<`) e `echo '...' |` no contexto principal. Por isso, Phases 3 e 5 abaixo delegam a criação de arquivos JSON a um subagent (Write tool) e depois usam `cat <file> | neocortex ...` (pipe simples passa). Não modifique este padrão.

# NeoCortex Coop

Invoca uma skill externa com rastreamento NeoCortex completo: sessão, task wrapper, DoD gate, knowledge capture.

**Objetivo**: permitir ao usuário chamar QUALQUER skill (feature-dev, security-review, cypress, atlassian, frontend-design, etc.) mantendo contexto, tracking de tarefas e registro de conhecimento.

---

## Phase 1: Parse Arguments

Extrair target slash command + args de `$ARGUMENTS`:

1. **Aceitar formatos variados**:
   - `/feature-dev ...` (com prefixo `/`)
   - `feature-dev ...` (sem prefixo)
   - `plugin:skill ...` (nome qualificado de plugin)

2. **Detectar e bloquear recursão**: Se target começa com `neocortex` ou `neocortex:coop`:
   ```
   ERRO: Recursão não permitida
   NeoCortex coop não pode invocar a si mesmo ou outras skills neocortex:*.
   Tente invocar a skill diretamente: /{target} {args}
   ```

3. **Validar argumentos**: Se `$ARGUMENTS` contiver APENAS o nome da skill (sem args), usar skill sem argumentos adicionais.

4. **Variáveis resultado**:
   - `TARGET_SKILL`: nome da skill (sem `/` prefixo, normalizado)
   - `TARGET_ARGS`: resto dos argumentos (vazio se não houver)

---

## Phase 2: Ensure NeoCortex Ativo

1. Executar `neocortex status`:
   ```bash
   neocortex status
   ```

2. Se retornar sem projeto/sessão ativo: instruir o usuário:
   ```
   NeoCortex não está inicializado. Execute:
   /neocortex:init
   
   Depois retorne e tente:
   /neocortex:coop {target_skill} {args}
   ```

3. Se status bem-sucedido, extrair:
   - `PROJECT_ID` (id do projeto ativo)
   - `SESSION_ID` (id da sessão ativa, ou vazio se nenhuma)

---

## Phase 3: Criar Wrapper Task

Se não houver SESSION_ID, iniciar uma sessão:
```bash
neocortex session start --name "coop-$(date +%s)" --goal "Cooperação com skill: $TARGET_SKILL"
```
Capturar `SESSION_ID`.

**Criar wrapper task** (em 2 passos, devido ao constraint do hook):

**Passo 3a — delegar criação do JSON a um subagent**:
Use a tool `Agent` (model: haiku) com prompt:

> Criar `/tmp/nc-coop-wrapper-$(date +%s).json` via tool Write. Conteúdo:
> ```json
> {"tasks":[{"title":"Coop com <TARGET_SKILL>: <TARGET_ARGS truncado a 60 chars>","description":"Invocar skill externa via NeoCortex coop.\n\n**Skill**: <TARGET_SKILL>\n**Args**: <TARGET_ARGS>\n\n**Contexto**: executar skill com rastreamento completo (sessao, DoD gate, knowledge capture).","depends_on":[],"priority":1,"dod":["Skill <TARGET_SKILL> foi invocada e completou sem erro","Output relevante capturado como knowledge","Decisoes/artefatos da skill registrados no brain"]}]}
> ```
> Retorne o path do arquivo criado.

**Passo 3b — passar o JSON para `task slice`** (no contexto principal):
```bash
cat /tmp/nc-coop-wrapper-<timestamp>.json | neocortex task slice --goal "Cooperar com $TARGET_SKILL" --session "$SESSION_ID"
```

Capturar `TASK_ID` da resposta.

Executar:
```bash
neocortex task update "$TASK_ID" --status in_progress --phase implement
```

---

## Phase 4: Invocar Skill

Usar o **Skill tool** para invocar:

```
Skill(skill: "$TARGET_SKILL", args: "$TARGET_ARGS")
```

**Comportamento de erro**: Se o Skill tool retorna erro (skill não existe, permissão negada, etc.):
```
ERRO: Skill não encontrada ou não acessível

Skill invocada: $TARGET_SKILL
Args: $TARGET_ARGS

Mensagem de erro: {erro do Skill tool}

Dica: Verifique se a skill está instalada.
Skill disponíveis: /simplify, /feature-dev, /security-review, /cypress, /atlassian:*, /frontend-design, etc.
Se a skill é um plugin, garanta que está configurado em ~/.claude/settings.json.
```

**Se sucesso**: capturar output da skill para uso na fase 5.

---

## Phase 5: Finalizar (DoD Gate + Knowledge + Close Task)

Após a skill retornar com sucesso:

1. **Atualizar fase**:
   ```bash
   neocortex task update "$TASK_ID" --phase verify
   ```

2. **Executar DoD Gate** (em 3 passos, devido ao constraint do hook):

   **Passo 2a — obter DoD IDs**:
   ```bash
   neocortex task get "$TASK_ID" --json
   ```
   Extrair os `dod.id` da resposta.

   **Passo 2b — delegar criação do JSON de dod_results a um subagent**:
   Use Agent (model: haiku) com prompt:

   > Criar `/tmp/nc-coop-dod-$TASK_ID.json` via Write. Conteúdo:
   > ```json
   > {"dod_results":[{"dod_id":<id1>,"passed":true,"evidence":"<evidência concreta do output da skill>"},{"dod_id":<id2>,"passed":true,"evidence":"..."},...]}
   > ```
   > Retorne o path.

   **Passo 2c — submeter via `think done`**:
   ```bash
   cat /tmp/nc-coop-dod-$TASK_ID.json | neocortex think done "$TASK_ID" --json
   ```

   Verificar `ready` na resposta. Se `ready: true`, prosseguir. Se `ready: false`, corrigir gaps (re-delegar Passo 2b com novas evidências) e repetir.

3. **Registrar knowledge** (OBRIGATÓRIO):
   ```bash
   neocortex knowledge store \
     --title "Coop: $TARGET_SKILL com $TARGET_ARGS" \
     --type "reference" \
     --body "Skill $TARGET_SKILL foi invocada com sucesso.
   
   Args: $TARGET_ARGS
   
   Decisões/artefatos relevantes:
   - (extraído do output da skill)
   
   " \
     --tags "coop,$TARGET_SKILL"
   ```

4. **Fechar task** (APENAS após ready=true):
   ```bash
   neocortex task update "$TASK_ID" --status done
   ```

5. **NÃO fechar sessão automaticamente** — usuário pode encadear mais coops ou continuar com `/neocortex`.

---

## Exemplo End-to-End

```
/neocortex:coop /feature-dev implementar autenticação JWT com refresh tokens

Step 1 (Parse): TARGET_SKILL=feature-dev, TARGET_ARGS="implementar autenticação JWT com refresh tokens"
Step 2 (Ensure): neocortex status → ✓ projeto ativo, session ativo
Step 3a (Wrapper task — delegar): Agent cria /tmp/nc-coop-wrapper-<ts>.json com task payload
Step 3b (Wrapper task — slice): cat /tmp/nc-coop-wrapper-<ts>.json | neocortex task slice → TASK_ID
Step 4 (Invoke): Skill(skill: "feature-dev", args: "implementar autenticação JWT...")
         → feature-dev executa com tracking NeoCortex completo
Step 5.2a (DoD — obter IDs): neocortex task get $TASK_ID --json → extrair dod.id
Step 5.2b (DoD — delegar): Agent cria /tmp/nc-coop-dod-<id>.json com dod_results
Step 5.2c (DoD — submeter): cat /tmp/nc-coop-dod-<id>.json | neocortex think done $TASK_ID → verificar ready
Step 5.3 (Knowledge): neocortex knowledge store ... → registrar decisões da skill
Step 5.4 (Close): neocortex task update $TASK_ID --status done

Output do usuário:
[neocortex:coop] ✓ feature-dev completou
├── Task: Coop com feature-dev: implementar autenticação... [DONE]
├── Knowledge: capturada
└── Sessão: aberta para próximo coop
```

---

## Edge Cases

| Situação | Comportamento |
|----------|---------------|
| **Skill inexistente** | Skill tool retorna erro; exibir mensagem clara orientando verificar instalação |
| **Recursão `/neocortex:coop /neocortex:foo`** | Bloquear no phase 1 com mensagem "Recursão não permitida" |
| **Args vazios** | Invocar skill sem argumentos adicionais; DoD e wrapper task ajustam-se |
| **Skill pede confirmação ao usuário** | NeoCortex não interfere; skill e usuário interagem diretamente |
| **Skill falha** | Skill tool retorna erro; NeoCortex exibe erro e NOT marca task como failed (usuário decide retry) |
| **Sessão não existe** | Phase 2 cria nova sessão automaticamente; identifica projeto ativo via `neocortex status` |

---

## Notes

- **Sem allowlist**: NeoCortex coop aceita qualquer skill instalada. Não há validação pré-invocação contra uma lista fixa.
- **Erro de skill inexistente**: é responsabilidade do **Skill tool** validar se a skill existe. Se não existir, retorna erro; NeoCortex exibe mensagem clara.
- **Multi-invocação**: Usar coop múltiplas vezes na mesma sessão é suportado. Cada invocação cria sua própria task wrapper.
- **Mutações NeoCortex**: Phase 5 executa `task update`, `knowledge store`, `think done` — operações que mutam estado NeoCortex. Estas são OBRIGATÓRIAS para completar o rastreamento.
