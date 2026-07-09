import type { ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleCreateCandidate,
  handleListCandidates,
  methodNotAllowed,
  type ApiResult,
} from '../../lib/http/handlers';
import { sendJson } from '../../lib/http/send';
import { getRedisStore } from '../../lib/storage/redisStore';

// GET /api/candidates | POST /api/candidates
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
