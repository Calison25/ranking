import type { ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleDeleteCandidate, methodNotAllowed } from '../../../lib/http/handlers';
import { sendJson } from '../../../lib/http/send';
import { getRedisStore } from '../../../lib/storage/redisStore';

// DELETE /api/candidates/:id
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const store = getRedisStore();
  const id = String(req.query.id);

  const result =
    req.method === 'DELETE' ? await handleDeleteCandidate(store, id) : methodNotAllowed();

  sendJson(res as unknown as ServerResponse, result.status, result.body);
}
