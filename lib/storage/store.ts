import type {
  CandidateInput,
  CandidateWithEvaluations,
  Evaluation,
  EvaluationInput,
} from '../domain/index.js';

export type AddEvaluationResult =
  | { ok: true; evaluation: Evaluation }
  | { ok: false; reason: 'not_found' | 'limit' };

export interface CandidateStore {
  listCandidates(): Promise<CandidateWithEvaluations[]>;
  createCandidate(input: CandidateInput): Promise<CandidateWithEvaluations>;
  deleteCandidate(id: string): Promise<boolean>; // true se existia
  addEvaluation(id: string, input: EvaluationInput): Promise<AddEvaluationResult>;
}
