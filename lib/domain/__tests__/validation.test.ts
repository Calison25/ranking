import { describe, expect, it } from 'vitest';
import { makeEvaluationInput } from '../__fixtures__/evaluation.js';
import { CRITERIA, LINKEDIN_MAX_LENGTH, NOME_MAX_LENGTH, OBS_MAX_LENGTH } from '../constants.js';
import { validateCandidateInput, validateEvaluationInput } from '../validation.js';

describe('validateCandidateInput', () => {
  it('rejeita raw null', () => {
    expect(validateCandidateInput(null).ok).toBe(false);
  });

  it('rejeita raw que não é objeto', () => {
    expect(validateCandidateInput('candidato').ok).toBe(false);
    expect(validateCandidateInput(42).ok).toBe(false);
  });

  it('rejeita nome vazio', () => {
    expect(validateCandidateInput({ nome: '', linkedin: '' })).toEqual({
      ok: false,
      error: 'Nome é obrigatório',
    });
  });

  it('rejeita nome só com espaços', () => {
    expect(validateCandidateInput({ nome: '   ', linkedin: '' })).toEqual({
      ok: false,
      error: 'Nome é obrigatório',
    });
  });

  it('aceita nome válido e faz trim', () => {
    const result = validateCandidateInput({ nome: '  Maria Silva  ', linkedin: '' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.nome).toBe('Maria Silva');
  });

  it('linkedin é opcional e é trimado', () => {
    expect(validateCandidateInput({ nome: 'Maria' })).toEqual({
      ok: true,
      value: { nome: 'Maria', linkedin: '' },
    });

    expect(validateCandidateInput({ nome: 'Maria', linkedin: '  linkedin.com/in/maria  ' })).toEqual({
      ok: true,
      value: { nome: 'Maria', linkedin: 'linkedin.com/in/maria' },
    });
  });

  it('aceita nome no limite exato de tamanho', () => {
    const nome = 'a'.repeat(NOME_MAX_LENGTH);
    const result = validateCandidateInput({ nome, linkedin: '' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.nome).toBe(nome);
  });

  it('rejeita nome 1 caractere acima do limite', () => {
    const nome = 'a'.repeat(NOME_MAX_LENGTH + 1);
    expect(validateCandidateInput({ nome, linkedin: '' })).toEqual({
      ok: false,
      error: 'Nome muito longo (máximo 120 caracteres)',
    });
  });

  it('aceita linkedin no limite exato de tamanho', () => {
    const linkedin = 'a'.repeat(LINKEDIN_MAX_LENGTH);
    const result = validateCandidateInput({ nome: 'Maria', linkedin });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.linkedin).toBe(linkedin);
  });

  it('rejeita linkedin 1 caractere acima do limite', () => {
    const linkedin = 'a'.repeat(LINKEDIN_MAX_LENGTH + 1);
    expect(validateCandidateInput({ nome: 'Maria', linkedin })).toEqual({
      ok: false,
      error: 'LinkedIn muito longo (máximo 300 caracteres)',
    });
  });
});

const softCriteria = CRITERIA.filter((c) => c.section === 'soft');
const hardCriteria = CRITERIA.filter((c) => c.section === 'hard');

describe('validateEvaluationInput', () => {
  const base = makeEvaluationInput();

  it('rejeita raw null', () => {
    expect(validateEvaluationInput(null).ok).toBe(false);
  });

  it('rejeita raw que não é objeto', () => {
    expect(validateEvaluationInput(42).ok).toBe(false);
  });

  describe.each(softCriteria)('critério soft $key ($label)', (criterion) => {
    it('rejeita 0', () => {
      expect(validateEvaluationInput({ ...base, [criterion.key]: 0 })).toEqual({
        ok: false,
        error: `Nota de ${criterion.label} deve ser um inteiro entre 1 e 5`,
      });
    });

    it('rejeita 6', () => {
      expect(validateEvaluationInput({ ...base, [criterion.key]: 6 })).toEqual({
        ok: false,
        error: `Nota de ${criterion.label} deve ser um inteiro entre 1 e 5`,
      });
    });

    it('rejeita 3.5 (não inteiro)', () => {
      expect(validateEvaluationInput({ ...base, [criterion.key]: 3.5 }).ok).toBe(false);
    });

    it('rejeita null', () => {
      expect(validateEvaluationInput({ ...base, [criterion.key]: null }).ok).toBe(false);
    });

    it('aceita 1..5', () => {
      for (let n = 1; n <= 5; n++) {
        expect(validateEvaluationInput({ ...base, [criterion.key]: n }).ok).toBe(true);
      }
    });
  });

  describe.each(hardCriteria)('critério hard $key ($label)', (criterion) => {
    it('aceita null', () => {
      const result = validateEvaluationInput({ ...base, [criterion.key]: null });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value[criterion.key]).toBeNull();
    });

    it('rejeita string "na"', () => {
      expect(validateEvaluationInput({ ...base, [criterion.key]: 'na' })).toEqual({
        ok: false,
        error: `Nota de ${criterion.label} deve ser "Não sei opinar" ou um inteiro entre 1 e 5`,
      });
    });

    it('rejeita 0', () => {
      expect(validateEvaluationInput({ ...base, [criterion.key]: 0 })).toEqual({
        ok: false,
        error: `Nota de ${criterion.label} deve ser "Não sei opinar" ou um inteiro entre 1 e 5`,
      });
    });

    it('rejeita 6', () => {
      expect(validateEvaluationInput({ ...base, [criterion.key]: 6 })).toEqual({
        ok: false,
        error: `Nota de ${criterion.label} deve ser "Não sei opinar" ou um inteiro entre 1 e 5`,
      });
    });

    it('aceita 1..5', () => {
      for (let n = 1; n <= 5; n++) {
        expect(validateEvaluationInput({ ...base, [criterion.key]: n }).ok).toBe(true);
      }
    });
  });

  it('rejeita veredicto ausente', () => {
    const { veredicto: _veredicto, ...rest } = base;
    expect(validateEvaluationInput(rest)).toEqual({
      ok: false,
      error: 'Veredicto é obrigatório',
    });
  });

  it('rejeita veredicto inválido ("sim")', () => {
    expect(validateEvaluationInput({ ...base, veredicto: 'sim' })).toEqual({
      ok: false,
      error: 'Veredicto é obrigatório',
    });
  });

  it('aceita veredicto "ajuda"', () => {
    const result = validateEvaluationInput({ ...base, veredicto: 'ajuda' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.veredicto).toBe('ajuda');
  });

  it('aceita veredicto "nao_ajuda"', () => {
    const result = validateEvaluationInput({ ...base, veredicto: 'nao_ajuda' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.veredicto).toBe('nao_ajuda');
  });

  it('obs é opcional, trimada e default vazio', () => {
    const { obs: _obs, ...rest } = base;
    const semObs = validateEvaluationInput(rest);
    expect(semObs.ok).toBe(true);
    if (semObs.ok) expect(semObs.value.obs).toBe('');

    const comObs = validateEvaluationInput({ ...base, obs: '  boa comunicação  ' });
    expect(comObs.ok).toBe(true);
    if (comObs.ok) expect(comObs.value.obs).toBe('boa comunicação');
  });

  it('aceita obs no limite exato de tamanho', () => {
    const obs = 'a'.repeat(OBS_MAX_LENGTH);
    const result = validateEvaluationInput({ ...base, obs });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.obs).toBe(obs);
  });

  it('rejeita obs 1 caractere acima do limite', () => {
    const obs = 'a'.repeat(OBS_MAX_LENGTH + 1);
    expect(validateEvaluationInput({ ...base, obs })).toEqual({
      ok: false,
      error: 'Observações muito longas (máximo 2000 caracteres)',
    });
  });

  it('input completo válido é aceito com os 9 campos + veredicto', () => {
    const result = validateEvaluationInput(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(base);
    }
  });
});
