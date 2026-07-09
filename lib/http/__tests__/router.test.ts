import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionToken } from '../../auth.js';
import { createMemoryStore } from '../../storage/memoryStore.js';
import { dispatch } from '../router.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('dispatch — /api/login', () => {
  it('POST /api/login roteia para handleLogin', async () => {
    vi.stubEnv('AUTH_USERNAME', 'admin');
    vi.stubEnv('AUTH_PASSWORD', 'secret');

    const res = await dispatch(createMemoryStore(), 'POST', '/api/login', {
      username: 'admin',
      password: 'secret',
    });

    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    expect(res!.body).toHaveProperty('token');
  });
});

describe('dispatch — autorizacao de /api/candidates', () => {
  it('GET /api/candidates sem authHeader devolve 401', async () => {
    vi.stubEnv('AUTH_USERNAME', 'admin');
    vi.stubEnv('AUTH_PASSWORD', 'secret');

    const res = await dispatch(createMemoryStore(), 'GET', '/api/candidates', undefined);

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('GET /api/candidates com Bearer de token valido devolve 200', async () => {
    vi.stubEnv('AUTH_USERNAME', 'admin');
    vi.stubEnv('AUTH_PASSWORD', 'secret');
    const token = createSessionToken({ username: 'admin', password: 'secret' });

    const res = await dispatch(
      createMemoryStore(),
      'GET',
      '/api/candidates',
      undefined,
      `Bearer ${token}`,
    );

    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
  });
});

describe('dispatch — rotas fora de /api', () => {
  it('devolve null para rota nao-/api', async () => {
    const res = await dispatch(createMemoryStore(), 'GET', '/health', undefined);
    expect(res).toBeNull();
  });
});
