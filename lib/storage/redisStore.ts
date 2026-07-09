import { MAX_EVALUATIONS, genCandidateId, genEvaluationId } from '../domain/index.js';
import type {
  Candidate,
  CandidateInput,
  CandidateWithEvaluations,
  Evaluation,
  EvaluationInput,
} from '../domain/index.js';
import { getRedis } from '../redis.js';
import type { AddEvaluationResult, CandidateStore } from './store.js';

const CANDIDATES_KEY = 'candidates';
const evalsKey = (id: string): string => `evals:${id}`;

/**
 * Script Lua que garante ATOMICAMENTE existencia + limite + push numa unica
 * operacao no Redis (sem janela de corrida entre avaliadores simultaneos).
 *   -2 => candidato inexistente
 *   -1 => limite atingido
 *   n>=1 => novo tamanho da lista (sucesso)
 */
const ADD_EVALUATION_SCRIPT = `
if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 0 then return -2 end
local n = redis.call('LLEN', KEYS[2])
if n >= tonumber(ARGV[2]) then return -1 end
redis.call('RPUSH', KEYS[2], ARGV[3])
return n + 1
`;

/**
 * Adapter Upstash Redis.
 *
 * Modelo de dados:
 *  - hash `candidates`: field = id, value = candidato SEM evaluations
 *  - lista `evals:<id>`: cada elemento e uma avaliacao
 *
 * GOTCHA (automaticDeserialization do @upstash/redis): `hset`/`rpush` via
 * metodos do cliente serializam objetos na ESCRITA e `hgetall`/`lrange` fazem
 * JSON.parse na LEITURA. No EVAL o RPUSH recebe `JSON.stringify(ev)` como ARGV
 * (string bruta) — o Redis armazena essa string verbatim e `lrange<Evaluation>`
 * a reidrata na leitura. Ambos os lados (escrita manual no Lua e leitura
 * automatica) ficam consistentes.
 */
export function createRedisStore(): CandidateStore {
  const redis = getRedis();

  return {
    async listCandidates(): Promise<CandidateWithEvaluations[]> {
      const map = await redis.hgetall<Record<string, Candidate>>(CANDIDATES_KEY);
      if (!map) {
        return [];
      }
      const candidates = Object.values(map);
      const lists = await Promise.all(
        candidates.map((candidate) => redis.lrange<Evaluation>(evalsKey(candidate.id), 0, -1)),
      );
      return candidates.map((candidate, index) => ({ ...candidate, evaluations: lists[index] }));
    },

    async createCandidate(input: CandidateInput): Promise<CandidateWithEvaluations> {
      const candidate: Candidate = {
        id: genCandidateId(),
        nome: input.nome,
        linkedin: input.linkedin,
        createdAt: Date.now(),
      };
      // hset serializa o objeto (automaticDeserialization); guardado sem evaluations.
      await redis.hset(CANDIDATES_KEY, { [candidate.id]: candidate });
      return { ...candidate, evaluations: [] };
    },

    async deleteCandidate(id: string): Promise<boolean> {
      const removed = await redis.hdel(CANDIDATES_KEY, id);
      await redis.del(evalsKey(id));
      return removed > 0;
    },

    async addEvaluation(id: string, input: EvaluationInput): Promise<AddEvaluationResult> {
      const evaluation: Evaluation = {
        id: genEvaluationId(),
        comunicacao: input.comunicacao,
        tecnico: input.tecnico,
        softskill: input.softskill,
        obs: input.obs,
        date: Date.now(),
      };
      const result = await redis.eval<(string | number)[], number>(
        ADD_EVALUATION_SCRIPT,
        [CANDIDATES_KEY, evalsKey(id)],
        [id, MAX_EVALUATIONS, JSON.stringify(evaluation)],
      );
      if (result === -2) {
        return { ok: false, reason: 'not_found' };
      }
      if (result === -1) {
        return { ok: false, reason: 'limit' };
      }
      return { ok: true, evaluation };
    },
  };
}

let store: CandidateStore | undefined;

/** Singleton do store Redis usado pelas funcoes serverless. */
export function getRedisStore(): CandidateStore {
  store ??= createRedisStore();
  return store;
}
