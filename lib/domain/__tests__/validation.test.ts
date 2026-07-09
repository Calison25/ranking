import { describe, expect, it } from 'vitest';
import { LINKEDIN_MAX_LENGTH, NOME_MAX_LENGTH, OBS_MAX_LENGTH } from '../constants';
import { validateCandidateInput, validateEvaluationInput } from '../validation';

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

describe('validateEvaluationInput', () => {
  const base = { comunicacao: 3, tecnico: 3, softskill: 3, obs: '' };

  it('rejeita raw null', () => {
    expect(validateEvaluationInput(null).ok).toBe(false);
  });

  it('rejeita raw que não é objeto', () => {
    expect(validateEvaluationInput(42).ok).toBe(false);
  });

  it('rejeita nota de comunicação fora de 1-5 (0)', () => {
    expect(validateEvaluationInput({ ...base, comunicacao: 0 }).ok).toBe(false);
  });

  it('rejeita nota de comunicação fora de 1-5 (6)', () => {
    expect(validateEvaluationInput({ ...base, comunicacao: 6 }).ok).toBe(false);
  });

  it('rejeita nota não inteira (3.5)', () => {
    expect(validateEvaluationInput({ ...base, softskill: 3.5 }).ok).toBe(false);
  });

  it('aceita tecnico null', () => {
    const result = validateEvaluationInput({ ...base, tecnico: null });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tecnico).toBeNull();
  });

  it('rejeita tecnico undefined', () => {
    const { tecnico: _tecnico, ...rest } = base;
    expect(validateEvaluationInput(rest).ok).toBe(false);
  });

  it('rejeita tecnico como string "na"', () => {
    expect(validateEvaluationInput({ ...base, tecnico: 'na' }).ok).toBe(false);
  });

  it('rejeita tecnico fora de 1-5 (0 e 6)', () => {
    expect(validateEvaluationInput({ ...base, tecnico: 0 }).ok).toBe(false);
    expect(validateEvaluationInput({ ...base, tecnico: 6 }).ok).toBe(false);
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

  it('mensagens de erro são específicas por campo', () => {
    expect(validateEvaluationInput({ ...base, comunicacao: 0 })).toEqual({
      ok: false,
      error: 'Nota de Comunicação deve ser um inteiro entre 1 e 5',
    });
    expect(validateEvaluationInput({ ...base, softskill: 0 })).toEqual({
      ok: false,
      error: 'Nota de Soft skill deve ser um inteiro entre 1 e 5',
    });
    expect(validateEvaluationInput({ ...base, tecnico: 6 }).ok).toBe(false);
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
});
