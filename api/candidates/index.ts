import type { ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorizedHeader } from '../../lib/auth.js';
import { unauthorized } from '../../lib/http/auth.js';
import {
  handleCreateCandidate,
  handleListCandidates,
  methodNotAllowed,
  type ApiResult,
} from '../../lib/http/handlers.js';
import { sendJson } from '../../lib/http/send.js';
import { getRedisStore } from '../../lib/storage/redisStore.js';

// GET /api/candidates | POST /api/candidates
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!isAuthorizedHeader(req.headers.authorization)) {
    const denied = unauthorized();
    sendJson(res as unknown as ServerResponse, denied.status, denied.body);
    return;
  }

  const store = getRedisStore();

  let result: ApiResult;
  if (req.method === 'GET') {
    result = await handleListCandidates(store);
  } else if (req.method === 'POST') {
    result = await handleCreateCandidate(store, req.body);
  } else {
    result = methodNotAllowed();
  }

  sendJson(res as unknown as ServerResponse, result.status, result.body);
}
