# Classificador de Entrevistas

Aplicação web simples para registrar candidatos e avaliações de entrevista, e acompanhar um ranking geral por pontuação. É um **projeto temporário**, feito para uso interno pontual: **não tem login/autenticação** — qualquer pessoa com o link acessa e edita os mesmos dados.

Cada candidato pode receber até **4 avaliações**, cada uma com três critérios (Comunicação, Conhecimento técnico, Soft skill) em notas de 1 a 5 (o critério "Conhecimento técnico" também aceita "Não sei opinar"). O ranking ordena os candidatos pela soma total de pontos das avaliações registradas.

## Stack

- **Frontend**: React 18 + TypeScript, SPA única sem roteador (Vite)
- **Backend**: funções serverless na Vercel (`api/`), reutilizando os mesmos handlers HTTP tanto em produção quanto em desenvolvimento
- **Persistência**: Redis (via [Upstash](https://upstash.com), provisionado pelo Vercel Marketplace) em produção; store em memória em desenvolvimento local
- **Testes**: Vitest

## Como rodar local

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

O `npm run dev` **funciona sem Redis**: um plugin do Vite (`vite.config.ts`) serve a API `/api/*` localmente usando um store em memória, chamando exatamente os mesmos handlers (`lib/http`) que rodam em produção. Não é preciso configurar nenhuma variável de ambiente para desenvolver.

> **Atenção**: como os dados ficam em memória, eles são perdidos sempre que o dev server é reiniciado.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe o ambiente de desenvolvimento (Vite + API em memória) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm test` | Roda a suíte de testes (Vitest) |
| `npm run test:watch` | Testes em modo watch |

## Testes

```bash
npm test
```

Cobre o domínio (`lib/domain`), os handlers HTTP (`lib/http`), o store em memória (`lib/storage`), o cliente da API (`src/api`), o hook de dados (`src/hooks`) e componentes de UI (`src/components`).

## Deploy na Vercel

O projeto é composto pela SPA (build via Vite) e pelas funções serverless em `api/`, que a Vercel detecta e publica automaticamente.

### 1. Subir o repositório e importar o projeto

- Suba este repositório no GitHub.
- Na [Vercel](https://vercel.com), clique em **Add New → Project** e importe o repositório.
  - O framework é auto-detectado como **Vite** (configurado em `vercel.json`); não é necessário alterar build/output settings.
- Alternativa via CLI: instale o [Vercel CLI](https://vercel.com/docs/cli) e rode `vercel` na raiz do projeto para linkar e fazer o primeiro deploy.

### 2. Provisionar o storage (Redis)

A aplicação precisa de um banco Redis para persistir dados em produção:

1. No dashboard da Vercel, abra o projeto e vá em **Storage**.
2. Clique em **Marketplace** e selecione **Upstash for Redis** (o plano free é suficiente).
3. Conclua a criação do banco e **conecte-o ao projeto**.
4. A Vercel injeta automaticamente as variáveis de ambiente `KV_REST_API_URL` e `KV_REST_API_TOKEN` no projeto — não é preciso configurá-las manualmente.

### 3. Redeploy

Após conectar o storage, dispare um novo deploy (redeploy pelo dashboard, ou um novo `git push`/`vercel --prod`) para que as funções serverless passem a enxergar as novas variáveis de ambiente.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `KV_REST_API_URL` | Sim (produção) | URL REST do Redis. Preenchida automaticamente ao conectar o Upstash via Vercel Marketplace. |
| `KV_REST_API_TOKEN` | Sim (produção) | Token REST do Redis. Preenchida automaticamente ao conectar o Upstash via Vercel Marketplace. |
| `UPSTASH_REDIS_REST_URL` | Não | Fallback usado quando `KV_REST_API_URL` não está definida (ex.: conexão manual a um Upstash fora do Marketplace). |
| `UPSTASH_REDIS_REST_TOKEN` | Não | Fallback usado quando `KV_REST_API_TOKEN` não está definida. |

A aplicação usa `KV_REST_API_*` quando presentes e cai para `UPSTASH_REDIS_REST_*` caso contrário (ver `lib/redis.ts`). Localmente nenhuma dessas variáveis é necessária — veja `.env.example`.

### Nota sobre uso em produção

Como não há login, **os dados em produção são compartilhados entre todos os avaliadores** que acessarem a URL do deploy — todo mundo vê e edita a mesma lista de candidatos. O limite de **4 avaliações por candidato é garantido atomicamente no Redis** (via script Lua executado com `EVAL`), então mesmo com avaliadores simultâneos não é possível ultrapassar o limite por condição de corrida.

## Estrutura

- `src/` — aplicação React (SPA única, sem roteador)
- `lib/domain/` — regras de domínio puras (validação, ranking, cálculo de pontuação)
- `lib/storage/` — stores de persistência (`memoryStore` para dev, `redisStore` para produção) atrás de uma interface comum (`CandidateStore`)
- `lib/http/` — handlers HTTP e roteamento compartilhados entre as funções Vercel e o middleware de dev do Vite
- `api/` — funções serverless da Vercel, finas: delegam para `lib/http`
- `design/` — referência visual (fonte de verdade de estilos)
