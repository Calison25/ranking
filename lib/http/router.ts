import type { CandidateStore } from '../storage/store';
import {
  handleCreateCandidate,
  handleCreateEvaluation,
  handleDeleteCandidate,
  handleListCandidates,
  methodNotAllowed,
  type ApiResult,
} from './handlers';

const API_PREFIX = '/api/';

/**
 * Mapeia (method, pathname) para o handler correspondente e devolve seu
 * ApiResult. Retorna `null` quando a rota nao pertence a este router (fora de
 * /api ou desconhecida), para que o chamador delegue ao proximo middleware.
 *
 * Rotas:
 *   GET    /api/candidates
 *   POST   /api/candidates
 *   DELETE /api/candidates/:id
 *   POST   /api/candidates/:id/evaluations
 *
 * Metodo errado numa rota conhecida => 405. Rota desconhecida/nao-/api => null.
 */
export async function dispatch(
  store: CandidateStore,
  method: string,
  pathname: string,
  body: unknown,
): Promise<ApiResult | null> {
  const segments = apiSegments(pathname);
  if (!segments || segments[0] !== 'candidates') {
    return null;
  }

  // /api/candidates
  if (segments.length === 1) {
    if (method === 'GET') return handleListCandidates(store);
    if (method === 'POST') return handleCreateCandidate(store, body);
    return methodNotAllowed();
  }

  // /api/candidates/:id
  if (segments.length === 2) {
    const id = decodeURIComponent(segments[1]);
    if (method === 'DELETE') return handleDeleteCandidate(store, id);
    return methodNotAllowed();
  }

  // /api/candidates/:id/evaluations
  if (segments.length === 3 && segments[2] === 'evaluations') {
    const id = decodeURIComponent(segments[1]);
    if (method === 'POST') return handleCreateEvaluation(store, id, body);
    return methodNotAllowed();
  }

  return null;
}

function apiSegments(pathname: string): string[] | null {
  if (!pathname.startsWith(API_PREFIX)) {
    return null;
  }
  const segments = pathname
    .slice(API_PREFIX.length)
    .split('/')
    .filter((segment) => segment.length > 0);
  return segments.length ? segments : null;
}
