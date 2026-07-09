import { describe, expect, it } from 'vitest';
import { verifySessionToken } from '../../auth.js';
import { handleLogin } from '../auth.js';

const envWithConfig = { AUTH_USERNAME: 'admin', AUTH_PASSWORD: 'secret123' };

describe('handleLogin', () => {
  it('devolve 500 com {error} quando AUTH_USERNAME/AUTH_PASSWORD nao estao configuradas', () => {
    const res = handleLogin({ username: 'admin', password: 'secret123' }, {});
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('devolve 400 quando o body nao tem usuario/senha', () => {
    const res = handleLogin({}, envWithConfig);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Informe usuário e senha' });
  });

  it('devolve 401 com credenciais erradas', () => {
    const res = handleLogin({ username: 'admin', password: 'errada' }, envWithConfig);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Usuário ou senha inválidos' });
  });

  it('devolve 200 com token valido para credenciais corretas', () => {
    const res = handleLogin({ username: 'admin', password: 'secret123' }, envWithConfig);
    expect(res.status).toBe(200);
    const body = res.body as { token: string };
    expect(typeof body.token).toBe('string');
    expect(verifySessionToken({ username: 'admin', password: 'secret123' }, body.token)).toBe(true);
  });
});
