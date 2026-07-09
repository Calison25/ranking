import { describe, expect, it } from 'vitest';
import { makeEvaluation } from '../../../lib/domain/__fixtures__/evaluation.js';
import { formatAjudaAggregate, formatGroupScores } from '../format.js';

describe('formatGroupScores', () => {
  it('formata os critérios soft com abreviações', () => {
    const ev = makeEvaluation({ comunicacao: 4, organizacao: 3, proatividade: 5, cultura: 4 });

    expect(formatGroupScores(ev, 'soft')).toBe('Com 4 · Org 3 · Pro 5 · Cul 4');
  });

  it('formata os critérios hard, usando "n/a" para valores null', () => {
    const ev = makeEvaluation({
      elaboracaoPlano: 3,
      promptEngineering: null,
      conhecimentoModelos: 4,
      web: null,
      conhecimentoAplicacao: 5,
    });

    expect(formatGroupScores(ev, 'hard')).toBe('Plano 3 · Prompt n/a · Modelos 4 · Web n/a · App 5');
  });
});

describe('formatAjudaAggregate', () => {
  it('formata a fração de votos "vai ajudar"', () => {
    expect(formatAjudaAggregate(3, 4)).toBe('3/4 vai ajudar');
  });

  it('retorna mensagem defensiva quando count é 0', () => {
    expect(formatAjudaAggregate(0, 0)).toBe('Sem avaliações');
  });
});
