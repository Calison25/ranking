import type { ServerResponse } from 'node:http';

/**
 * Escreve uma resposta JSON usando apenas a API nativa de ServerResponse.
 *
 * MOTIVO: no runtime novo da Vercel os metodos `res.status()`/`res.json()` dos
 * tipos @vercel/node podem nao existir em producao (TypeError). Usar sempre o
 * ServerResponse nativo evita esse acoplamento.
 */
export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
