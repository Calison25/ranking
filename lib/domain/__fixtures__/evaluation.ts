import type { Evaluation, EvaluationInput } from '../types.js';

export function makeEvaluationInput(overrides: Partial<EvaluationInput> = {}): EvaluationInput {
  return {
    comunicacao: 3,
    organizacao: 3,
    proatividade: 3,
    cultura: 3,
    elaboracaoPlano: 3,
    promptEngineering: 3,
    conhecimentoModelos: 3,
    web: 3,
    conhecimentoAplicacao: 3,
    veredicto: 'ajuda',
    obs: '',
    ...overrides,
  };
}

export function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    id: 'e1',
    ...makeEvaluationInput(),
    date: 0,
    ...overrides,
  };
}
