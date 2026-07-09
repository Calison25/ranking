import { describe, expect, it } from 'vitest';
import { MAX_EVALUATIONS } from '../../domain/index.js';
import type { EvaluationInput } from '../../domain/index.js';
import { createMemoryStore } from '../../storage/memoryStore.js';
import type { CandidateStore } from '../../storage/store.js';
import {
  handleCreateCandidate,
  handleCreateEvaluation,
  handleDeleteCandidate,
  handleListCandidates,
} from '../handlers.js';

const validEvaluation: EvaluationInput = {
  comunicacao: 3,
  tecnico: null,
  softskill: 5,
  obs: '',
};

async function createCandidate(store: CandidateStore, nome = 'Ana'): Promise<string> {
  const res = await handleCreateCandidate(store, { nome, linkedin: '' });
  return (res.body as { id: string }).id;
}

describe('handleCreateCandidate', () => {
  it('devolve 400 com {error} quando o nome e vazio', async () => {
    const res = await handleCreateCandidate(createMemoryStore(), { nome: '', linkedin: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('devolve 201 com o candidato criado (evaluations vazio)', async () => {
    const res = await handleCreateCandidate(createMemoryStore(), { nome: 'Maria', linkedin: 'x' });
    expect(res.status).toBe(201);
    const body = res.body as { id: string; nome: string; evaluations: unknown[] };
    expect(body.nome).toBe('Maria');
    expect(body.evaluations).toEqual([]);
    expect(typeof body.id).toBe('string');
  });
});

describe('handleListCandidates', () => {
  it('devolve 200 e array vazio inicialmente', async () => {
    const res = await handleListCandidates(createMemoryStore());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('handleDeleteCandidate', () => {
  it('devolve 404 para candidato inexistente', async () => {
    const res = await handleDeleteCandidate(createMemoryStore(), 'inexistente');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('devolve 200 {ok:true} ao deletar candidato existente', async () => {
    const store = createMemoryStore();
    const id = await createCandidate(store);
    const res = await handleDeleteCandidate(store, id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('handleCreateEvaluation', () => {
  it('devolve 400 para payload invalido', async () => {
    const store = createMemoryStore();
    const id = await createCandidate(store);
    const res = await handleCreateEvaluation(store, id, {
      comunicacao: 0,
      tecnico: null,
      softskill: 3,
      obs: '',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('devolve 404 para candidato inexistente', async () => {
    const res = await handleCreateEvaluation(createMemoryStore(), 'inexistente', validEvaluation);
    expect(res.status).toBe(404);
  });

  it('devolve 409 na avaliacao que excede o limite', async () => {
    const store = createMemoryStore();
    const id = await createCandidate(store);
    for (let i = 0; i < MAX_EVALUATIONS; i++) {
      await handleCreateEvaluation(store, id, validEvaluation);
    }
    const res = await handleCreateEvaluation(store, id, validEvaluation);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: `Limite de ${MAX_EVALUATIONS} avaliações atingido` });
  });

  it('devolve 201 com a avaliacao e preserva tecnico null', async () => {
    const store = createMemoryStore();
    const id = await createCandidate(store);
    const res = await handleCreateEvaluation(store, id, validEvaluation);
    expect(res.status).toBe(201);
    const body = res.body as { id: string; tecnico: number | null; date: number };
    expect(body.tecnico).toBeNull();
    expect(typeof body.id).toBe('string');
    expect(typeof body.date).toBe('number');
  });
});
