import { describe, expect, it } from 'vitest';
import { MAX_EVALUATIONS } from '../../domain/index.js';
import type { EvaluationInput } from '../../domain/index.js';
import { createMemoryStore } from '../memoryStore.js';

const validEvaluation: EvaluationInput = {
  comunicacao: 3,
  tecnico: 4,
  softskill: 5,
  obs: 'ok',
};

describe('createMemoryStore', () => {
  it('createCandidate seguido de listCandidates devolve o candidato com evaluations vazio', async () => {
    const store = createMemoryStore();
    const created = await store.createCandidate({ nome: 'Maria', linkedin: '' });
    expect(created.evaluations).toEqual([]);

    const list = await store.listCandidates();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);
    expect(list[0].nome).toBe('Maria');
    expect(list[0].evaluations).toEqual([]);
  });

  it('deleteCandidate devolve true para existente e false para inexistente', async () => {
    const store = createMemoryStore();
    const c = await store.createCandidate({ nome: 'Ana', linkedin: '' });

    expect(await store.deleteCandidate(c.id)).toBe(true);
    expect(await store.deleteCandidate(c.id)).toBe(false);
    expect(await store.deleteCandidate('inexistente')).toBe(false);
  });

  it('deleteCandidate remove tambem as avaliacoes do candidato', async () => {
    const store = createMemoryStore();
    const c = await store.createCandidate({ nome: 'Ana', linkedin: '' });
    await store.addEvaluation(c.id, validEvaluation);

    await store.deleteCandidate(c.id);

    expect(await store.listCandidates()).toHaveLength(0);
    // avaliacoes foram apagadas junto: readicionar ao mesmo id nao encontra o candidato
    expect(await store.addEvaluation(c.id, validEvaluation)).toEqual({
      ok: false,
      reason: 'not_found',
    });
  });

  it('addEvaluation aceita ate MAX_EVALUATIONS e recusa a seguinte com limit', async () => {
    const store = createMemoryStore();
    const c = await store.createCandidate({ nome: 'Ana', linkedin: '' });

    for (let i = 0; i < MAX_EVALUATIONS; i++) {
      expect((await store.addEvaluation(c.id, validEvaluation)).ok).toBe(true);
    }
    expect(await store.addEvaluation(c.id, validEvaluation)).toEqual({
      ok: false,
      reason: 'limit',
    });

    const list = await store.listCandidates();
    expect(list[0].evaluations).toHaveLength(MAX_EVALUATIONS);
  });

  it('addEvaluation em candidato inexistente devolve not_found', async () => {
    const store = createMemoryStore();
    expect(await store.addEvaluation('inexistente', validEvaluation)).toEqual({
      ok: false,
      reason: 'not_found',
    });
  });

  it('10 addEvaluation simultaneos resultam em exatamente MAX ok e o restante limit', async () => {
    const store = createMemoryStore();
    const c = await store.createCandidate({ nome: 'Ana', linkedin: '' });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => store.addEvaluation(c.id, validEvaluation)),
    );

    const ok = results.filter((r) => r.ok).length;
    const limit = results.filter((r) => !r.ok && r.reason === 'limit').length;
    expect(ok).toBe(MAX_EVALUATIONS);
    expect(limit).toBe(10 - MAX_EVALUATIONS);
  });
});
