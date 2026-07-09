import { MAX_EVALUATIONS, validateCandidateInput, validateEvaluationInput } from '../domain/index.js';
import type { CandidateStore } from '../storage/store.js';

export interface ApiResult {
  status: number;
  body: unknown;
}

/**
 * Handlers PUROS: recebem um CandidateStore e devolvem {status, body}. Nao
 * conhecem HTTP nativo (req/res), o que os torna testaveis com qualquer store.
 * Toda regra de negocio (validacao, ids, limite) vem de lib/domain — aqui so
 * ha orquestracao e mapeamento para status HTTP.
 */

export async function handleListCandidates(store: CandidateStore): Promise<ApiResult> {
  try {
    return { status: 200, body: await store.listCandidates() };
  } catch {
    return internalError();
  }
}

export async function handleCreateCandidate(
  store: CandidateStore,
  rawBody: unknown,
): Promise<ApiResult> {
  const validation = validateCandidateInput(rawBody);
  if (!validation.ok) {
    return badRequest(validation.error);
  }
  try {
    return { status: 201, body: await store.createCandidate(validation.value) };
  } catch {
    return internalError();
  }
}

export async function handleDeleteCandidate(
  store: CandidateStore,
  id: string,
): Promise<ApiResult> {
  try {
    const existed = await store.deleteCandidate(id);
    return existed ? { status: 200, body: { ok: true } } : notFound();
  } catch {
    return internalError();
  }
}

export async function handleCreateEvaluation(
  store: CandidateStore,
  id: string,
  rawBody: unknown,
): Promise<ApiResult> {
  const validation = validateEvaluationInput(rawBody);
  if (!validation.ok) {
    return badRequest(validation.error);
  }
  try {
    const result = await store.addEvaluation(id, validation.value);
    if (result.ok) {
      return { status: 201, body: result.evaluation };
    }
    return result.reason === 'not_found'
      ? notFound()
      : { status: 409, body: { error: `Limite de ${MAX_EVALUATIONS} avaliações atingido` } };
  } catch {
    return internalError();
  }
}

export function methodNotAllowed(): ApiResult {
  return { status: 405, body: { error: 'Método não permitido' } };
}

function badRequest(error: string): ApiResult {
  return { status: 400, body: { error } };
}

function notFound(): ApiResult {
  return { status: 404, body: { error: 'Candidato não encontrado' } };
}

function internalError(): ApiResult {
  return { status: 500, body: { error: 'Erro interno' } };
}
