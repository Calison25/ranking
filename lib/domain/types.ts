export interface Candidate {
  id: string;
  nome: string;
  linkedin: string;
  createdAt: number;
}

export interface Evaluation {
  id: string;
  comunicacao: number;
  tecnico: number | null;
  softskill: number;
  obs: string;
  date: number;
}

export interface CandidateWithEvaluations extends Candidate {
  evaluations: Evaluation[];
}

export interface CandidateInput {
  nome: string;
  linkedin: string;
}

export interface EvaluationInput {
  comunicacao: number;
  tecnico: number | null;
  softskill: number;
  obs: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type CandidateWithStats = CandidateWithEvaluations & { total: number; count: number; avg: number };
