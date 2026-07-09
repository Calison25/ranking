import type { CSSProperties } from 'react';
import { calcCandidateTotal, MAX_EVALUATIONS } from '../../lib/domain/index.js';
import type { CandidateWithEvaluations } from '../../lib/domain/index.js';
import { linkHref } from '../utils/format.js';

interface CandidateRowProps {
  candidate: CandidateWithEvaluations;
  onEval: (id: string) => void;
  onRemove: (id: string) => void;
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '15px 18px',
};

const infoStyle: CSSProperties = { flex: 1, minWidth: 0 };

const nameLineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const nameStyle: CSSProperties = { fontWeight: 600, fontSize: 16, color: 'var(--ink)' };

const badgeBaseStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: '2px 10px',
  borderRadius: 20,
  whiteSpace: 'nowrap',
};

const metaLineStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  marginTop: 5,
  fontSize: 13,
  color: 'var(--muted)',
};

const totalWrapperStyle: CSSProperties = { textAlign: 'right', paddingRight: 4 };

const totalValueStyle: CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontSize: 26,
  lineHeight: 1,
  color: 'var(--ink)',
};

const totalLabelStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--faint)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginTop: 1,
};

const evalButtonBaseStyle: CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const removeButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 9,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--faint)',
  cursor: 'pointer',
  fontSize: 12,
  flexShrink: 0,
};

function badgeStyleFor(count: number): CSSProperties {
  if (count === 0) return { ...badgeBaseStyle, background: 'var(--chip)', color: 'var(--muted)' };
  if (count >= MAX_EVALUATIONS) return { ...badgeBaseStyle, background: 'var(--warnSoft)', color: 'var(--warn)' };
  return { ...badgeBaseStyle, background: 'var(--acSoft)', color: 'var(--ac)' };
}

function countLabelFor(count: number): string {
  if (count === 0) return 'Sem avaliações';
  return count === 1 ? '1 avaliação' : `${count} avaliações`;
}

export default function CandidateRow({ candidate, onEval, onRemove }: CandidateRowProps) {
  const count = candidate.evaluations.length;
  const total = calcCandidateTotal(candidate.evaluations);
  const disabled = count >= MAX_EVALUATIONS;
  const hasLinkedin = candidate.linkedin.trim().length > 0;

  const evalButtonStyle: CSSProperties = disabled
    ? { ...evalButtonBaseStyle, background: 'var(--chip)', color: 'var(--faint)', cursor: 'not-allowed', border: '1px solid var(--border)' }
    : { ...evalButtonBaseStyle, background: 'var(--ac)', color: '#fff', cursor: 'pointer', border: '1px solid var(--ac)' };

  return (
    <div style={rowStyle}>
      <div style={infoStyle}>
        <div style={nameLineStyle}>
          <span style={nameStyle}>{candidate.nome}</span>
          <span style={badgeStyleFor(count)}>
            {count} / {MAX_EVALUATIONS}
          </span>
        </div>
        <div style={metaLineStyle}>
          <span>{countLabelFor(count)}</span>
          {hasLinkedin && (
            <a href={linkHref(candidate.linkedin)} target="_blank" rel="noopener">
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>
      <div style={totalWrapperStyle}>
        <div style={totalValueStyle}>{total}</div>
        <div style={totalLabelStyle}>pontos</div>
      </div>
      <button onClick={() => onEval(candidate.id)} disabled={disabled} style={evalButtonStyle}>
        {disabled ? 'Limite atingido' : 'Avaliar'}
      </button>
      <button onClick={() => onRemove(candidate.id)} title="Remover candidato" style={removeButtonStyle}>
        ✕
      </button>
    </div>
  );
}
