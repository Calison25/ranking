const STORAGE_KEY = 'ranking.session.token';

/**
 * Guarda o token de sessao no localStorage. O prefixo do token e o timestamp
 * de expiracao, entao da para descartar tokens vencidos sem ida ao servidor.
 * Todos os acessos sao guardados: em ambiente node (testes) nao ha localStorage.
 */

export function getStoredToken(): string | null {
  const store = storage();
  if (!store) {
    return null;
  }
  const token = store.getItem(STORAGE_KEY);
  if (!token) {
    return null;
  }
  if (isExpired(token)) {
    store.removeItem(STORAGE_KEY);
    return null;
  }
  return token;
}

export function storeToken(token: string): void {
  storage()?.setItem(STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  storage()?.removeItem(STORAGE_KEY);
}

function isExpired(token: string): boolean {
  const exp = Number(token.slice(0, token.indexOf('.')));
  return !Number.isFinite(exp) || exp <= Date.now();
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // navegador pode bloquear storage (modo privado etc.)
  }
}
