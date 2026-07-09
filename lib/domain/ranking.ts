import { CRITERIA } from './constants.js';
import type { CandidateWithEvaluations, CandidateWithStats, Evaluation } from './types.js';

export function evaluationScore(e: Evaluation): number {
  return CRITERIA.reduce((sum, c) => sum + (e[c.key] ?? 0), 0);
}

export function calcCandidateTotal(evs: Evaluation[]): number {
  return evs.reduce((sum, e) => sum + evaluationScore(e), 0);
}

export function calcCandidateAvg(evs: Evaluation[]): number {
  return evs.length ? calcCandidateTotal(evs) / evs.length : 0;
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export interface VeredictoTally {
  ajuda: number;
  total: number;
}

export function tallyVeredicto(evs: Evaluation[]): VeredictoTally {
  return {
    ajuda: evs.filter((e) => e.veredicto === 'ajuda').length,
    total: evs.length,
  };
}

export function decorateCandidate(c: CandidateWithEvaluations): CandidateWithStats {
  const count = c.evaluations.length;
  const { ajuda } = tallyVeredicto(c.evaluations);
  return {
    ...c,
    total: calcCandidateTotal(c.evaluations),
    count,
    avg: calcCandidateAvg(c.evaluations),
    ajudaVotes: ajuda,
    ajudaPct: count ? ajuda / count : 0,
  };
}

export function buildRanking(cs: CandidateWithEvaluations[]): CandidateWithStats[] {
  return cs
    .map(decorateCandidate)
    .filter((c) => c.count > 0)
    .sort((a, b) => {
      const crossPct = b.ajudaVotes * a.count - a.ajudaVotes * b.count;
      if (crossPct !== 0) return crossPct;
      if (b.total !== a.total) return b.total - a.total;
      if (b.avg !== a.avg) return b.avg - a.avg;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
}
