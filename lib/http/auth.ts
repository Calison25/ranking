import { createSessionToken, getAuthConfig, verifyCredentials } from '../auth.js';
import type { ApiResult } from './handlers.js';

/** POST /api/login — valida credenciais contra AUTH_USERNAME/AUTH_PASSWORD. */
export function handleLogin(rawBody: unknown, env: NodeJS.ProcessEnv = process.env): ApiResult {
  const config = getAuthConfig(env);
  if (!config) {
    return {
      status: 500,
      body: { error: 'Autenticação não configurada. Defina AUTH_USERNAME e AUTH_PASSWORD.' },
    };
  }

  const { username, password } = readCredentials(rawBody);
  if (!username || !password) {
    return { status: 400, body: { error: 'Informe usuário e senha' } };
  }
  if (!verifyCredentials(config, username, password)) {
    return { status: 401, body: { error: 'Usuário ou senha inválidos' } };
  }
  return { status: 200, body: { token: createSessionToken(config) } };
}

export function unauthorized(): ApiResult {
  return { status: 401, body: { error: 'Não autorizado' } };
}

function readCredentials(rawBody: unknown): { username: string; password: string } {
  const body = (rawBody ?? {}) as { username?: unknown; password?: unknown };
  return {
    username: typeof body.username === 'string' ? body.username.trim() : '',
    password: typeof body.password === 'string' ? body.password : '',
  };
}
