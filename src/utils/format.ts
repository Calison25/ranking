import { CRITERIA } from '../../lib/domain/index.js';
import type { CriterionSection, Evaluation, EvaluationCriterionKey } from '../../lib/domain/index.js';

const PROTOCOL_RE = /^https?:\/\//i;

/** Formata um timestamp (ms) como 'dd/mm/aaaa'. */
export function formatDate(ts: number): string {
  const date = new Date(ts);
  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Prefixa 'https://' quando a URL não tiver protocolo explícito. */
export function linkHref(u: string): string {
  if (!u) return '';
  return PROTOCOL_RE.test(u) ? u : `https://${u}`;
}

const SCORE_ABBR: Record<EvaluationCriterionKey, string> = {
  comunicacao: 'Com',
  organizacao: 'Org',
  proatividade: 'Pro',
  cultura: 'Cul',
  elaboracaoPlano: 'Plano',
  promptEngineering: 'Prompt',
  conhecimentoModelos: 'Modelos',
  web: 'Web',
  conhecimentoAplicacao: 'App',
};

/** Formata as notas de uma seção de critérios (soft/hard) em uma linha compacta: "Com 4 · Org 3". */
export function formatGroupScores(ev: Evaluation, section: CriterionSection): string {
  return CRITERIA.filter((criterion) => criterion.section === section)
    .map((criterion) => {
      const value = ev[criterion.key];
      return `${SCORE_ABBR[criterion.key]} ${value === null ? 'n/a' : value}`;
    })
    .join(' · ');
}

/** Formata o agregado de veredictos "vai ajudar" de um candidato, ex: "3/4 vai ajudar". */
export function formatAjudaAggregate(ajudaVotes: number, count: number): string {
  if (count === 0) return 'Sem avaliações';
  return `${ajudaVotes}/${count} vai ajudar`;
}
