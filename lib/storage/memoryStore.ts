import { MAX_EVALUATIONS, genCandidateId, genEvaluationId } from '../domain/index.js';
import type {
  Candidate,
  CandidateInput,
  CandidateWithEvaluations,
  Evaluation,
  EvaluationInput,
} from '../domain/index.js';
import type { AddEvaluationResult, CandidateStore } from './store.js';

/**
 * Store em memoria com a mesma semantica do adapter Redis. Usado pelo
 * dev-middleware (um por instancia do dev server) e pelos testes.
 *
 * A verificacao de existencia e de limite em addEvaluation e feita de forma
 * sincrona (sem `await` antes do push), o que garante atomicidade sob varias
 * chamadas concorrentes disparadas via Promise.all num unico event loop.
 */
export function createMemoryStore(): CandidateStore {
  const candidates = new Map<string, Candidate>();
  const evaluations = new Map<string, Evaluation[]>();

  return {
    async listCandidates(): Promise<CandidateWithEvaluations[]> {
      return [...candidates.values()].map((candidate) => ({
        ...candidate,
        evaluations: [...(evaluations.get(candidate.id) ?? [])],
      }));
    },

    async createCandidate(input: CandidateInput): Promise<CandidateWithEvaluations> {
      const candidate: Candidate = {
        id: genCandidateId(),
        nome: input.nome,
        linkedin: input.linkedin,
        createdAt: Date.now(),
      };
      candidates.set(candidate.id, candidate);
      evaluations.set(candidate.id, []);
      return { ...candidate, evaluations: [] };
    },

    async deleteCandidate(id: string): Promise<boolean> {
      const existed = candidates.delete(id);
      evaluations.delete(id);
      return existed;
    },

    async addEvaluation(id: string, input: EvaluationInput): Promise<AddEvaluationResult> {
      const list = evaluations.get(id);
      if (!candidates.has(id) || !list) {
        return { ok: false, reason: 'not_found' };
      }
      if (list.length >= MAX_EVALUATIONS) {
        return { ok: false, reason: 'limit' };
      }

      const evaluation: Evaluation = { id: genEvaluationId(), ...input, date: Date.now() };
      list.push(evaluation);
      return { ok: true, evaluation };
    },
  };
}
