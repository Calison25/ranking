import { describe, expect, it } from 'vitest';
import { buildRanking, calcCandidateAvg, calcCandidateTotal, decorateCandidate, round1 } from '../ranking.js';
import type { CandidateWithEvaluations, Evaluation } from '../types.js';

function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    id: overrides.id ?? 'e1',
    comunicacao: overrides.comunicacao ?? 3,
    tecnico: overrides.tecnico === undefined ? 3 : overrides.tecnico,
    softskill: overrides.softskill ?? 3,
    obs: overrides.obs ?? '',
    date: overrides.date ?? 0,
  };
}

function makeCandidate(overrides: Partial<CandidateWithEvaluations> = {}): CandidateWithEvaluations {
  return {
    id: overrides.id ?? 'c1',
    nome: overrides.nome ?? 'Candidato',
    linkedin: overrides.linkedin ?? '',
    createdAt: overrides.createdAt ?? 0,
    evaluations: overrides.evaluations ?? [],
  };
}

describe('calcCandidateTotal', () => {
  it('retorna 0 quando não há avaliações', () => {
    expect(calcCandidateTotal([])).toBe(0);
  });

  it('conta 0 pontos quando técnico é null', () => {
    const evs = [makeEvaluation({ comunicacao: 5, tecnico: null, softskill: 4 })];
    expect(calcCandidateTotal(evs)).toBe(9);
  });

  it('soma os pontos de múltiplas avaliações', () => {
    const evs = [
      makeEvaluation({ comunicacao: 5, tecnico: 4, softskill: 3 }), // 12
      makeEvaluation({ comunicacao: 2, tecnico: null, softskill: 1 }), // 3
    ];
    expect(calcCandidateTotal(evs)).toBe(15);
  });
});

describe('calcCandidateAvg', () => {
  it('retorna 0 quando não há avaliações', () => {
    expect(calcCandidateAvg([])).toBe(0);
  });

  it('calcula a média correta', () => {
    const evs = [
      makeEvaluation({ comunicacao: 5, tecnico: 5, softskill: 5 }), // 15
      makeEvaluation({ comunicacao: 1, tecnico: 1, softskill: 1 }), // 3
    ];
    expect(calcCandidateAvg(evs)).toBe(9);
  });
});

describe('round1', () => {
  it('arredonda para 1 casa decimal', () => {
    expect(round1(9.05)).toBe(9.1);
    expect(round1(9.04)).toBe(9);
    expect(round1(3)).toBe(3);
  });
});

describe('decorateCandidate', () => {
  it('adiciona total, count e avg ao candidato', () => {
    const c = makeCandidate({
      evaluations: [makeEvaluation({ comunicacao: 4, tecnico: 4, softskill: 4 })],
    });
    const decorated = decorateCandidate(c);
    expect(decorated.total).toBe(12);
    expect(decorated.count).toBe(1);
    expect(decorated.avg).toBe(12);
  });
});

describe('buildRanking', () => {
  it('exclui candidatos com 0 avaliações', () => {
    const cs = [makeCandidate({ id: 'a', nome: 'A', evaluations: [] })];
    expect(buildRanking(cs)).toHaveLength(0);
  });

  it('ordena por soma total desc', () => {
    const cs = [
      makeCandidate({
        id: 'a',
        nome: 'Ana',
        evaluations: [makeEvaluation({ comunicacao: 3, tecnico: 3, softskill: 3 })], // 9
      }),
      makeCandidate({
        id: 'b',
        nome: 'Bia',
        evaluations: [makeEvaluation({ comunicacao: 5, tecnico: 5, softskill: 5 })], // 15
      }),
    ];
    expect(buildRanking(cs).map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('em empate de soma, ordena por média desc', () => {
    const cs = [
      makeCandidate({
        id: 'a',
        nome: 'Ana',
        evaluations: [
          makeEvaluation({ comunicacao: 5, tecnico: 5, softskill: 5 }), // 15
          makeEvaluation({ comunicacao: 1, tecnico: 1, softskill: 1 }), // 3 -> total 18, avg 9
        ],
      }),
      makeCandidate({
        id: 'b',
        nome: 'Bia',
        evaluations: [
          makeEvaluation({ comunicacao: 2, tecnico: 2, softskill: 2 }), // 6
          makeEvaluation({ comunicacao: 2, tecnico: 2, softskill: 2 }), // 6
          makeEvaluation({ comunicacao: 2, tecnico: 2, softskill: 2 }), // 6 -> total 18, avg 6
        ],
      }),
    ];
    const ranking = buildRanking(cs);
    expect(ranking[0].id).toBe('a');
    expect(ranking[0].total).toBe(18);
    expect(ranking[1].id).toBe('b');
    expect(ranking[1].total).toBe(18);
  });

  it('em empate de soma e média, ordena por nome asc (pt-BR)', () => {
    const cs = [
      makeCandidate({
        id: 'z',
        nome: 'Zé',
        evaluations: [makeEvaluation({ comunicacao: 3, tecnico: 3, softskill: 3 })],
      }),
      makeCandidate({
        id: 'alvaro',
        nome: 'Álvaro',
        evaluations: [makeEvaluation({ comunicacao: 3, tecnico: 3, softskill: 3 })],
      }),
      makeCandidate({
        id: 'ana',
        nome: 'Ana',
        evaluations: [makeEvaluation({ comunicacao: 3, tecnico: 3, softskill: 3 })],
      }),
    ];
    expect(buildRanking(cs).map((c) => c.nome)).toEqual(['Álvaro', 'Ana', 'Zé']);
  });
});
