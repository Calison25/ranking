import type { ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorizedHeader } from '../../../lib/auth.js';
import { unauthorized } from '../../../lib/http/auth.js';
import { handleDeleteCandidate, methodNotAllowed } from '../../../lib/http/handlers.js';
import { sendJson } from '../../../lib/http/send.js';
import { getRedisStore } from '../../../lib/storage/redisStore.js';

// DELETE /api/candidates/:id
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!isAuthorizedHeader(req.headers.authorization)) {
    const denied = unauthorized();
    sendJson(res as unknown as ServerResponse, denied.status, denied.body);
    return;
  }

  const store = getRedisStore();
  const id = String(req.query.id);

  const result =
    req.method === 'DELETE' ? await handleDeleteCandidate(store, id) : methodNotAllowed();

  sendJson(res as unknown as ServerResponse, result.status, result.body);
}
