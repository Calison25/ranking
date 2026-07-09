import type { IncomingMessage } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { dispatch } from './lib/http/router';
import { sendJson } from './lib/http/send';
import { createMemoryStore } from './lib/storage/memoryStore';

// Testes de UI (componentes React) devem declarar no topo do arquivo:
// // @vitest-environment jsdom

/**
 * Plugin que serve a API em `npm run dev` SEM Redis, reutilizando exatamente os
 * mesmos handlers de producao via `dispatch`. Um memoryStore por instancia do
 * dev server mantem o estado entre requisicoes.
 */
function devApiPlugin(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      const store = createMemoryStore();

      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) {
          next();
          return;
        }

        const pathname = new URL(url, 'http://localhost').pathname;
        const method = req.method ?? 'GET';

        readJsonBody(req)
          .then((body) => dispatch(store, method, pathname, body))
          .then((result) => {
            if (!result) {
              next();
              return;
            }
            sendJson(res, result.status, result.body);
          })
          .catch(() => sendJson(res, 500, { error: 'Erro interno' }));
      });
    },
  };
}

/** Le e faz parse do corpo JSON; body vazio ou invalido vira `undefined`. */
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on('error', () => resolve(undefined));
  });
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'lib/**/*.test.{ts,tsx}', 'api/**/*.test.{ts,tsx}'],
  },
});
