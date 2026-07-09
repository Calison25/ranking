import type { CandidateWithEvaluations, CandidateWithStats, Evaluation } from './types.js';

export function calcCandidateTotal(evs: Evaluation[]): number {
  return evs.reduce((sum, e) => sum + (e.comunicacao ?? 0) + (e.tecnico ?? 0) + (e.softskill ?? 0), 0);
}

export function calcCandidateAvg(evs: Evaluation[]): number {
  return evs.length ? calcCandidateTotal(evs) / evs.length : 0;
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export function decorateCandidate(c: CandidateWithEvaluations): CandidateWithStats {
  return {
    ...c,
    total: calcCandidateTotal(c.evaluations),
    count: c.evaluations.length,
    avg: calcCandidateAvg(c.evaluations),
  };
}

export function buildRanking(cs: CandidateWithEvaluations[]): CandidateWithStats[] {
  return cs
    .map(decorateCandidate)
    .filter((c) => c.count > 0)
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.avg !== a.avg) return b.avg - a.avg;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
}
