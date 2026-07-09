import { describe, expect, it } from 'vitest';
import { makeEvaluation } from '../__fixtures__/evaluation.js';
import { SCORE_MAX_PER_EVALUATION } from '../constants.js';
import {
  buildRanking,
  calcCandidateAvg,
  calcCandidateTotal,
  decorateCandidate,
  evaluationScore,
  round1,
  tallyVeredicto,
} from '../ranking.js';
import type { CandidateWithEvaluations, Evaluation } from '../types.js';

function makeCandidate(overrides: Partial<CandidateWithEvaluations> = {}): CandidateWithEvaluations {
  return {
    id: overrides.id ?? 'c1',
    nome: overrides.nome ?? 'Candidato',
    linkedin: overrides.linkedin ?? '',
    createdAt: overrides.createdAt ?? 0,
    evaluations: overrides.evaluations ?? [],
  };
}

describe('evaluationScore', () => {
  it('soma as 9 notas de uma avaliação', () => {
    const e = makeEvaluation({
      comunicacao: 5,
      organizacao: 5,
      proatividade: 5,
      cultura: 5,
      elaboracaoPlano: 5,
      promptEngineering: 5,
      conhecimentoModelos: 5,
      web: 5,
      conhecimentoAplicacao: 5,
    });
    expect(evaluationScore(e)).toBe(SCORE_MAX_PER_EVALUATION);
    expect(evaluationScore(e)).toBe(45);
  });

  it('trata critérios hard nulos como 0', () => {
    const e = makeEvaluation({
      comunicacao: 3,
      organizacao: 3,
      proatividade: 3,
      cultura: 3,
      elaboracaoPlano: null,
      promptEngineering: null,
      conhecimentoModelos: null,
      web: null,
      conhecimentoAplicacao: null,
    });
    expect(evaluationScore(e)).toBe(12);
  });

  it('o máximo possível é 45', () => {
    const e = makeEvaluation({
      comunicacao: 5,
      organizacao: 5,
      proatividade: 5,
      cultura: 5,
      elaboracaoPlano: 5,
      promptEngineering: 5,
      conhecimentoModelos: 5,
      web: 5,
      conhecimentoAplicacao: 5,
    });
    expect(evaluationScore(e)).toBeLessThanOrEqual(SCORE_MAX_PER_EVALUATION);
  });
});

describe('calcCandidateTotal', () => {
  it('retorna 0 quando não há avaliações', () => {
    expect(calcCandidateTotal([])).toBe(0);
  });

  it('soma os pontos de múltiplas avaliações', () => {
    const evs: Evaluation[] = [
      makeEvaluation({
        id: 'e1',
        comunicacao: 5,
        organizacao: 4,
        proatividade: 3,
        cultura: 2,
        elaboracaoPlano: 1,
        promptEngineering: null,
        conhecimentoModelos: null,
        web: null,
        conhecimentoAplicacao: null,
      }), // 15
      makeEvaluation({
        id: 'e2',
        comunicacao: 2,
        organizacao: 2,
        proatividade: 2,
        cultura: 2,
        elaboracaoPlano: null,
        promptEngineering: null,
        conhecimentoModelos: null,
        web: null,
        conhecimentoAplicacao: null,
      }), // 8
    ];
    expect(calcCandidateTotal(evs)).toBe(23);
  });
});

describe('calcCandidateAvg', () => {
  it('retorna 0 quando não há avaliações', () => {
    expect(calcCandidateAvg([])).toBe(0);
  });

  it('calcula a média correta', () => {
    const evs = [
      makeEvaluation({
        comunicacao: 5,
        organizacao: 5,
        proatividade: 5,
        cultura: 5,
        elaboracaoPlano: 5,
        promptEngineering: 5,
        conhecimentoModelos: 5,
        web: 5,
        conhecimentoAplicacao: 5,
      }), // 45
      makeEvaluation({
        comunicacao: 1,
        organizacao: 1,
        proatividade: 1,
        cultura: 1,
        elaboracaoPlano: 1,
        promptEngineering: 1,
        conhecimentoModelos: 1,
        web: 1,
        conhecimentoAplicacao: 1,
      }), // 9
    ];
    expect(calcCandidateAvg(evs)).toBe(27);
  });
});

describe('round1', () => {
  it('arredonda para 1 casa decimal', () => {
    expect(round1(9.05)).toBe(9.1);
    expect(round1(9.04)).toBe(9);
    expect(round1(3)).toBe(3);
  });
});

describe('tallyVeredicto', () => {
  it('retorna 0/0 sem avaliações', () => {
    expect(tallyVeredicto([])).toEqual({ ajuda: 0, total: 0 });
  });

  it('conta votos de ajuda e total', () => {
    const evs = [
      makeEvaluation({ veredicto: 'ajuda' }),
      makeEvaluation({ veredicto: 'ajuda' }),
      makeEvaluation({ veredicto: 'nao_ajuda' }),
    ];
    expect(tallyVeredicto(evs)).toEqual({ ajuda: 2, total: 3 });
  });
});

describe('decorateCandidate', () => {
  it('adiciona total, count, avg, ajudaVotes e ajudaPct ao candidato', () => {
    const c = makeCandidate({
      evaluations: [
        makeEvaluation({
          comunicacao: 4,
          organizacao: 4,
          proatividade: 4,
          cultura: 4,
          elaboracaoPlano: 4,
          promptEngineering: 4,
          conhecimentoModelos: 4,
          web: 4,
          conhecimentoAplicacao: 4,
          veredicto: 'ajuda',
        }),
      ],
    });
    const decorated = decorateCandidate(c);
    expect(decorated.total).toBe(36);
    expect(decorated.count).toBe(1);
    expect(decorated.avg).toBe(36);
    expect(decorated.ajudaVotes).toBe(1);
    expect(decorated.ajudaPct).toBe(1);
  });

  it('ajudaPct é 0 quando count é 0', () => {
    const c = makeCandidate({ evaluations: [] });
    const decorated = decorateCandidate(c);
    expect(decorated.ajudaPct).toBe(0);
    expect(decorated.ajudaVotes).toBe(0);
  });
});

describe('buildRanking', () => {
  it('exclui candidatos com 0 avaliações', () => {
    const cs = [makeCandidate({ id: 'a', nome: 'A', evaluations: [] })];
    expect(buildRanking(cs)).toHaveLength(0);
  });

  it('ordena por % de veredicto "ajuda" desc: 100% > 75% > 50%', () => {
    const cs = [
      makeCandidate({
        id: 'half',
        nome: 'Metade',
        evaluations: [makeEvaluation({ veredicto: 'ajuda' }), makeEvaluation({ veredicto: 'nao_ajuda' })], // 50%
      }),
      makeCandidate({
        id: 'full',
        nome: 'Cheio',
        evaluations: [makeEvaluation({ veredicto: 'ajuda' })], // 100%
      }),
      makeCandidate({
        id: 'threequarters',
        nome: 'TresQuartos',
        evaluations: [
          makeEvaluation({ veredicto: 'ajuda' }),
          makeEvaluation({ veredicto: 'ajuda' }),
          makeEvaluation({ veredicto: 'ajuda' }),
          makeEvaluation({ veredicto: 'nao_ajuda' }),
        ], // 75%
      }),
    ];
    expect(buildRanking(cs).map((c) => c.id)).toEqual(['full', 'threequarters', 'half']);
  });

  it('em 100% vs 100% (2/2 vs 4/4), desempata por soma total (quem tem mais avaliações ganha)', () => {
    const cs = [
      makeCandidate({
        id: 'two',
        nome: 'Dois',
        evaluations: [makeEvaluation({ veredicto: 'ajuda' }), makeEvaluation({ veredicto: 'ajuda' })], // 2/2 = 100%, total 18
      }),
      makeCandidate({
        id: 'four',
        nome: 'Quatro',
        evaluations: [
          makeEvaluation({ veredicto: 'ajuda' }),
          makeEvaluation({ veredicto: 'ajuda' }),
          makeEvaluation({ veredicto: 'ajuda' }),
          makeEvaluation({ veredicto: 'ajuda' }),
        ], // 4/4 = 100%, total 36
      }),
    ];
    const ranking = buildRanking(cs);
    expect(ranking.map((c) => c.id)).toEqual(['four', 'two']);
  });

  it('empates de % com counts diferentes (1/2 vs 2/4) são tratados como iguais via cross-mult e caem para soma', () => {
    const cs = [
      makeCandidate({
        id: 'oneOfTwo',
        nome: 'A',
        evaluations: [
          makeEvaluation({
            veredicto: 'ajuda',
            comunicacao: 5,
            organizacao: 5,
            proatividade: 5,
            cultura: 5,
            elaboracaoPlano: 5,
            promptEngineering: 5,
            conhecimentoModelos: 5,
            web: 5,
            conhecimentoAplicacao: 5,
          }), // 45
          makeEvaluation({ veredicto: 'nao_ajuda' }), // 27 (defaults 3)
        ], // 1/2 = 50%, total 72
      }),
      makeCandidate({
        id: 'twoOfFour',
        nome: 'B',
        evaluations: [
          makeEvaluation({ veredicto: 'ajuda' }), // 27
          makeEvaluation({ veredicto: 'ajuda' }), // 27
          makeEvaluation({ veredicto: 'nao_ajuda' }), // 27
          makeEvaluation({ veredicto: 'nao_ajuda' }), // 27
        ], // 2/4 = 50%, total 108
      }),
    ];
    const ranking = buildRanking(cs);
    // ambos 50% (1/2 e 2/4) -> cross-mult = 0 -> desempate por soma total: twoOfFour (108) > oneOfTwo (72)
    expect(ranking.map((c) => c.id)).toEqual(['twoOfFour', 'oneOfTwo']);
  });

  it('em empate de % (cross-mult 0), ordena por soma total desc', () => {
    const cs = [
      makeCandidate({
        id: 'a',
        nome: 'Ana',
        evaluations: [makeEvaluation({ veredicto: 'ajuda', comunicacao: 3, organizacao: 3, proatividade: 3, cultura: 3 })], // 1/1=100%
      }),
      makeCandidate({
        id: 'b',
        nome: 'Bia',
        evaluations: [makeEvaluation({ veredicto: 'ajuda', comunicacao: 5, organizacao: 5, proatividade: 5, cultura: 5 })], // 1/1=100%, maior total
      }),
    ];
    expect(buildRanking(cs).map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('em empate de % e soma, ordena por média desc', () => {
    const cs = [
      makeCandidate({
        id: 'a',
        nome: 'Ana',
        evaluations: [
          makeEvaluation({ veredicto: 'ajuda', comunicacao: 5, organizacao: 5, proatividade: 5, cultura: 5, elaboracaoPlano: 5, promptEngineering: 5, conhecimentoModelos: 5, web: 5, conhecimentoAplicacao: 5 }), // 45
          makeEvaluation({ veredicto: 'ajuda', comunicacao: 1, organizacao: 1, proatividade: 1, cultura: 1, elaboracaoPlano: 1, promptEngineering: 1, conhecimentoModelos: 1, web: 1, conhecimentoAplicacao: 1 }), // 9 -> total 54, avg 27
        ],
      }),
      makeCandidate({
        id: 'b',
        nome: 'Bia',
        evaluations: [
          makeEvaluation({ veredicto: 'ajuda', comunicacao: 3, organizacao: 3, proatividade: 3, cultura: 3, elaboracaoPlano: 3, promptEngineering: 3, conhecimentoModelos: 3, web: 3, conhecimentoAplicacao: 3 }), // 27
          makeEvaluation({ veredicto: 'ajuda', comunicacao: 3, organizacao: 3, proatividade: 3, cultura: 3, elaboracaoPlano: 3, promptEngineering: 3, conhecimentoModelos: 3, web: 3, conhecimentoAplicacao: 3 }), // 27 -> total 54, avg 27
        ],
      }),
    ];
    const ranking = buildRanking(cs);
    expect(ranking[0].total).toBe(54);
    expect(ranking[1].total).toBe(54);
    expect(ranking[0].avg).toBe(ranking[1].avg);
    // ambos 100%, mesmo total e média -> nome asc
    expect(ranking.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('em empate total de %, soma, média, ordena por nome asc (pt-BR)', () => {
    const cs = [
      makeCandidate({
        id: 'z',
        nome: 'Zé',
        evaluations: [makeEvaluation({ veredicto: 'ajuda' })],
      }),
      makeCandidate({
        id: 'alvaro',
        nome: 'Álvaro',
        evaluations: [makeEvaluation({ veredicto: 'ajuda' })],
      }),
      makeCandidate({
        id: 'ana',
        nome: 'Ana',
        evaluations: [makeEvaluation({ veredicto: 'ajuda' })],
      }),
    ];
    expect(buildRanking(cs).map((c) => c.nome)).toEqual(['Álvaro', 'Ana', 'Zé']);
  });
});
