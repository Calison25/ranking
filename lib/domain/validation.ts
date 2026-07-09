import {
  CRITERIA,
  LINKEDIN_MAX_LENGTH,
  NOME_MAX_LENGTH,
  NOTE_MAX,
  NOTE_MIN,
  OBS_MAX_LENGTH,
} from './constants.js';
import type { EvaluationCriterionKey } from './constants.js';
import type { CandidateInput, EvaluationInput, ValidationResult, Veredicto } from './types.js';

function isPlainObject(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

function isValidNote(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= NOTE_MIN && value <= NOTE_MAX;
}

function isVeredicto(value: unknown): value is Veredicto {
  return value === 'ajuda' || value === 'nao_ajuda';
}

function toTrimmedString(value: unknown): string {
  return String(value ?? '').trim();
}

export function validateCandidateInput(raw: unknown): ValidationResult<CandidateInput> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: 'Dados do candidato inválidos' };
  }

  const nome = toTrimmedString(raw.nome);
  if (!nome) {
    return { ok: false, error: 'Nome é obrigatório' };
  }
  if (nome.length > NOME_MAX_LENGTH) {
    return { ok: false, error: 'Nome muito longo (máximo 120 caracteres)' };
  }

  const linkedin = toTrimmedString(raw.linkedin);
  if (linkedin.length > LINKEDIN_MAX_LENGTH) {
    return { ok: false, error: 'LinkedIn muito longo (máximo 300 caracteres)' };
  }

  return { ok: true, value: { nome, linkedin } };
}

export function validateEvaluationInput(raw: unknown): ValidationResult<EvaluationInput> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: 'Dados da avaliação inválidos' };
  }

  const notes = {} as Record<EvaluationCriterionKey, number | null>;

  for (const criterion of CRITERIA) {
    const value = raw[criterion.key];
    if (criterion.section === 'soft') {
      if (!isValidNote(value)) {
        return { ok: false, error: `Nota de ${criterion.label} deve ser um inteiro entre 1 e 5` };
      }
      notes[criterion.key] = value;
    } else {
      if (value !== null && !isValidNote(value)) {
        return {
          ok: false,
          error: `Nota de ${criterion.label} deve ser "Não sei opinar" ou um inteiro entre 1 e 5`,
        };
      }
      notes[criterion.key] = value === null ? null : value;
    }
  }

  const { veredicto } = raw;
  if (!isVeredicto(veredicto)) {
    return { ok: false, error: 'Veredicto é obrigatório' };
  }

  const trimmedObs = toTrimmedString(raw.obs);
  if (trimmedObs.length > OBS_MAX_LENGTH) {
    return { ok: false, error: 'Observações muito longas (máximo 2000 caracteres)' };
  }

  return {
    ok: true,
    value: { ...notes, veredicto, obs: trimmedObs } as EvaluationInput,
  };
}
