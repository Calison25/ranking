import type { ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLogin } from '../lib/http/auth.js';
import { methodNotAllowed } from '../lib/http/handlers.js';
import { sendJson } from '../lib/http/send.js';

// POST /api/login
export default function handler(req: VercelRequest, res: VercelResponse): void {
  const result = req.method === 'POST' ? handleLogin(req.body) : methodNotAllowed();
  sendJson(res as unknown as ServerResponse, result.status, result.body);
}
