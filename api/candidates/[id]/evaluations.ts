import type { ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCreateEvaluation, methodNotAllowed } from '../../../lib/http/handlers.js';
import { sendJson } from '../../../lib/http/send.js';
import { getRedisStore } from '../../../lib/storage/redisStore.js';

// POST /api/candidates/:id/evaluations
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const store = getRedisStore();
  const id = String(req.query.id);

  const result =
    req.method === 'POST'
      ? await handleCreateEvaluation(store, id, req.body)
      : methodNotAllowed();

  sendJson(res as unknown as ServerResponse, result.status, result.body);
}
