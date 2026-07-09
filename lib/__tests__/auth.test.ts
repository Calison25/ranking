import { describe, expect, it } from 'vitest';
import {
  createSessionToken,
  getAuthConfig,
  isAuthorizedHeader,
  SESSION_TTL_MS,
  tokenFromAuthorizationHeader,
  verifyCredentials,
  verifySessionToken,
  type AuthConfig,
} from '../auth.js';

const config: AuthConfig = { username: 'admin', password: 'secret123' };

describe('getAuthConfig', () => {
  it('retorna null quando AUTH_USERNAME/AUTH_PASSWORD nao estao definidas', () => {
    expect(getAuthConfig({})).toBeNull();
  });

  it('retorna null quando apenas uma das variaveis esta definida', () => {
    expect(getAuthConfig({ AUTH_USERNAME: 'admin' })).toBeNull();
    expect(getAuthConfig({ AUTH_PASSWORD: 'secret123' })).toBeNull();
  });

  it('retorna a config quando ambas as variaveis estao definidas', () => {
    expect(getAuthConfig({ AUTH_USERNAME: 'admin', AUTH_PASSWORD: 'secret123' })).toEqual({
      username: 'admin',
      password: 'secret123',
    });
  });
});

describe('verifyCredentials', () => {
  it('aceita usuario e senha corretos', () => {
    expect(verifyCredentials(config, 'admin', 'secret123')).toBe(true);
  });

  it('rejeita usuario errado', () => {
    expect(verifyCredentials(config, 'outro', 'secret123')).toBe(false);
  });

  it('rejeita senha errada', () => {
    expect(verifyCredentials(config, 'admin', 'errada')).toBe(false);
  });
});

describe('createSessionToken / verifySessionToken', () => {
  it('token recem-criado e valido (roundtrip)', () => {
    const token = createSessionToken(config);
    expect(verifySessionToken(config, token)).toBe(true);
  });

  it('token expirado e invalido', () => {
    const token = createSessionToken(config, 1000);
    expect(verifySessionToken(config, token, 1000 + SESSION_TTL_MS + 1)).toBe(false);
  });

  it('token com assinatura adulterada e invalido', () => {
    const token = createSessionToken(config, 1000);
    const separator = token.indexOf('.');
    const tampered = `${token.slice(0, separator)}.deadbeef`;
    expect(verifySessionToken(config, tampered, 1000)).toBe(false);
  });

  it('token malformado e invalido', () => {
    expect(verifySessionToken(config, 'abc')).toBe(false);
  });
});

describe('tokenFromAuthorizationHeader', () => {
  it('extrai o token de um header Bearer valido', () => {
    expect(tokenFromAuthorizationHeader('Bearer x')).toBe('x');
  });

  it('retorna null para header ausente', () => {
    expect(tokenFromAuthorizationHeader(undefined)).toBeNull();
  });

  it('retorna null para esquema diferente de Bearer', () => {
    expect(tokenFromAuthorizationHeader('Basic x')).toBeNull();
  });

  it('retorna null quando falta o token apos Bearer', () => {
    expect(tokenFromAuthorizationHeader('Bearer')).toBeNull();
  });
});

describe('isAuthorizedHeader', () => {
  it('retorna false quando o ambiente nao tem credenciais configuradas, mesmo com token valido de outra config', () => {
    const token = createSessionToken(config);
    expect(isAuthorizedHeader(`Bearer ${token}`, {})).toBe(false);
  });
});
