export interface Candidate {
  id: string;
  nome: string;
  linkedin: string;
  createdAt: number;
}

export type Veredicto = 'ajuda' | 'nao_ajuda';

export interface Evaluation {
  id: string;
  comunicacao: number;
  organizacao: number;
  proatividade: number;
  cultura: number;
  elaboracaoPlano: number | null;
  promptEngineering: number | null;
  conhecimentoModelos: number | null;
  web: number | null;
  conhecimentoAplicacao: number | null;
  veredicto: Veredicto;
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
  organizacao: number;
  proatividade: number;
  cultura: number;
  elaboracaoPlano: number | null;
  promptEngineering: number | null;
  conhecimentoModelos: number | null;
  web: number | null;
  conhecimentoAplicacao: number | null;
  veredicto: Veredicto;
  obs: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type CandidateWithStats = CandidateWithEvaluations & {
  total: number;
  count: number;
  avg: number;
  ajudaVotes: number;
  ajudaPct: number;
};
