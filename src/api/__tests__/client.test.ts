import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CandidateWithEvaluations } from '../../../lib/domain/index.js';
import { makeEvaluationInput, makeEvaluation } from '../../../lib/domain/__fixtures__/evaluation.js';
import { ApiError, createCandidate, createEvaluation, deleteCandidate, fetchCandidates } from '../client.js';

function mockResponse(status: number, body: unknown, jsonThrows = false): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => (jsonThrows ? Promise.reject(new Error('invalid json')) : Promise.resolve(body)),
  } as unknown as Response;
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const sampleCandidate: CandidateWithEvaluations = {
  id: '1',
  nome: 'Ana Silva',
  linkedin: 'https://linkedin.com/in/ana',
  createdAt: 1700000000000,
  evaluations: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCandidates', () => {
  it('retorna array tipado em 200', async () => {
    const fetchMock = stubFetch(mockResponse(200, [sampleCandidate]));

    const result = await fetchCandidates();

    expect(result).toEqual([sampleCandidate]);
    expect(fetchMock).toHaveBeenCalledWith('/api/candidates', undefined);
  });
});

describe('erros HTTP', () => {
  it('lança ApiError com status e mensagem do body em 409', async () => {
    stubFetch(mockResponse(409, { error: 'Limite de avaliações atingido' }));

    await expect(fetchCandidates()).rejects.toBeInstanceOf(ApiError);
    stubFetch(mockResponse(409, { error: 'Limite de avaliações atingido' }));
    await expect(fetchCandidates()).rejects.toMatchObject({
      status: 409,
      message: 'Limite de avaliações atingido',
    });
  });

  it('usa mensagem fallback em PT-BR quando body de erro não é JSON válido', async () => {
    stubFetch(mockResponse(500, undefined, true));

    await expect(fetchCandidates()).rejects.toMatchObject({
      status: 500,
      message: 'Erro ao comunicar com o servidor',
    });
  });

  it('usa mensagem fallback quando body de erro é JSON mas sem campo error', async () => {
    stubFetch(mockResponse(400, {}));

    await expect(fetchCandidates()).rejects.toMatchObject({
      status: 400,
      message: 'Erro ao comunicar com o servidor',
    });
  });
});

describe('createCandidate', () => {
  it('envia POST com Content-Type application/json e body correto', async () => {
    const input = { nome: 'Ana Silva', linkedin: 'https://linkedin.com/in/ana' };
    const fetchMock = stubFetch(mockResponse(201, sampleCandidate));

    const result = await createCandidate(input);

    expect(result).toEqual(sampleCandidate);
    expect(fetchMock).toHaveBeenCalledWith('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it('lança ApiError em 400 de validação', async () => {
    stubFetch(mockResponse(400, { error: 'Nome é obrigatório' }));

    await expect(createCandidate({ nome: '', linkedin: '' })).rejects.toMatchObject({
      status: 400,
      message: 'Nome é obrigatório',
    });
  });
});

describe('createEvaluation', () => {
  const input = makeEvaluationInput({ comunicacao: 5, web: 4, elaboracaoPlano: 3, obs: 'ok' });
  const created = makeEvaluation({ id: 'eval-1', date: 1700000000000, ...input });

  it('envia POST com Content-Type application/json e body correto', async () => {
    const fetchMock = stubFetch(mockResponse(201, created));

    const result = await createEvaluation('cand-1', input);

    expect(result).toEqual(created);
    expect(fetchMock).toHaveBeenCalledWith('/api/candidates/cand-1/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it('lança ApiError em 409 de limite de avaliações', async () => {
    stubFetch(mockResponse(409, { error: 'Limite de avaliações atingido' }));

    await expect(createEvaluation('cand-1', input)).rejects.toMatchObject({
      status: 409,
      message: 'Limite de avaliações atingido',
    });
  });
});

describe('deleteCandidate', () => {
  it('resolve void em 200', async () => {
    stubFetch(mockResponse(200, { ok: true }));

    await expect(deleteCandidate('cand-1')).resolves.toBeUndefined();
  });

  it('usa encodeURIComponent no id na URL', async () => {
    const idWithSpecialChars = 'id com espaço/e-barra';
    const fetchMock = stubFetch(mockResponse(200, { ok: true }));

    await deleteCandidate(idWithSpecialChars);

    expect(fetchMock).toHaveBeenCalledWith(`/api/candidates/${encodeURIComponent(idWithSpecialChars)}`, {
      method: 'DELETE',
    });
  });

  it('lança ApiError em 404 quando candidato não existe', async () => {
    stubFetch(mockResponse(404, { error: 'Candidato não encontrado' }));

    await expect(deleteCandidate('inexistente')).rejects.toMatchObject({
      status: 404,
      message: 'Candidato não encontrado',
    });
  });
});
