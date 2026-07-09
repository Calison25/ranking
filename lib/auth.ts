import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Autenticacao por usuario/senha unicos definidos via variaveis de ambiente
 * (AUTH_USERNAME / AUTH_PASSWORD). Nenhuma credencial vive no codigo.
 *
 * A sessao e um token stateless `exp.assinatura`, onde a assinatura e um
 * HMAC-SHA256 do timestamp de expiracao usando as credenciais como segredo.
 * Trocar usuario ou senha invalida imediatamente todos os tokens emitidos.
 */

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export interface AuthConfig {
  username: string;
  password: string;
}

export function getAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig | null {
  const username = env.AUTH_USERNAME?.trim();
  const password = env.AUTH_PASSWORD;
  if (!username || !password) {
    return null;
  }
  return { username, password };
}

export function verifyCredentials(config: AuthConfig, username: string, password: string): boolean {
  // Executa as duas comparacoes sempre, para nao vazar via timing qual campo errou.
  const usernameOk = safeEqual(username, config.username);
  const passwordOk = safeEqual(password, config.password);
  return usernameOk && passwordOk;
}

export function createSessionToken(config: AuthConfig, now: number = Date.now()): string {
  const exp = now + SESSION_TTL_MS;
  return `${exp}.${sign(String(exp), config)}`;
}

export function verifySessionToken(
  config: AuthConfig,
  token: string,
  now: number = Date.now(),
): boolean {
  const separator = token.indexOf('.');
  if (separator <= 0) {
    return false;
  }
  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const exp = Number(expiresAt);
  if (!Number.isFinite(exp) || exp <= now) {
    return false;
  }
  return safeEqual(signature, sign(expiresAt, config));
}

export function tokenFromAuthorizationHeader(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/** Guard unico usado pelas funcoes Vercel e pelo dev server. Sem config => nega tudo. */
export function isAuthorizedHeader(
  header: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  now: number = Date.now(),
): boolean {
  const config = getAuthConfig(env);
  if (!config) {
    return false;
  }
  const token = tokenFromAuthorizationHeader(header);
  return token !== null && verifySessionToken(config, token, now);
}

function sign(payload: string, config: AuthConfig): string {
  return createHmac('sha256', `${config.username} ${config.password}`)
    .update(payload)
    .digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
