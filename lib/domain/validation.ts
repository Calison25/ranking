import { LINKEDIN_MAX_LENGTH, NOME_MAX_LENGTH, NOTE_MAX, NOTE_MIN, OBS_MAX_LENGTH } from './constants';
import type { CandidateInput, EvaluationInput, ValidationResult } from './types';

function isPlainObject(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

function isValidNote(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= NOTE_MIN && value <= NOTE_MAX;
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

  const { comunicacao, tecnico, softskill, obs } = raw;

  if (!isValidNote(comunicacao)) {
    return { ok: false, error: 'Nota de Comunicação deve ser um inteiro entre 1 e 5' };
  }
  if (tecnico !== null && !isValidNote(tecnico)) {
    return {
      ok: false,
      error: 'Nota de Conhecimento técnico deve ser "Não sei opinar" ou um inteiro entre 1 e 5',
    };
  }
  if (!isValidNote(softskill)) {
    return { ok: false, error: 'Nota de Soft skill deve ser um inteiro entre 1 e 5' };
  }

  const trimmedObs = toTrimmedString(obs);
  if (trimmedObs.length > OBS_MAX_LENGTH) {
    return { ok: false, error: 'Observações muito longas (máximo 2000 caracteres)' };
  }

  return {
    ok: true,
    value: { comunicacao, tecnico, softskill, obs: trimmedObs },
  };
}
