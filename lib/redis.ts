import { Redis } from '@upstash/redis';

let client: Redis | undefined;

function readCredentials(): { url: string; token: string } {
  // Prioriza as variaveis KV_* (padrao Vercel KV / Marketplace) e cai para as
  // UPSTASH_* quando ausentes.
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Redis nao configurado. Defina KV_REST_API_URL e KV_REST_API_TOKEN ' +
        '(ou UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN) no ambiente. ' +
        'Ao conectar um banco Upstash Redis via Vercel Marketplace essas variaveis ' +
        'sao preenchidas automaticamente. Consulte .env.example.',
    );
  }
  return { url, token };
}

/** Singleton do cliente Upstash Redis (lazy, criado no primeiro uso). */
export function getRedis(): Redis {
  if (!client) {
    const { url, token } = readCredentials();
    client = new Redis({ url, token });
  }
  return client;
}
