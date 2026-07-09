import type { CSSProperties } from 'react';
import type { CandidateWithEvaluations } from '../../lib/domain/index.js';
import CandidateRow from './CandidateRow.js';

interface CandidateListProps {
  candidates: CandidateWithEvaluations[];
  onEval: (id: string) => void;
  onRemove: (id: string) => void;
}

const countLineStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  margin: '0 4px 12px',
};

const countLabelStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--muted)',
  fontWeight: 600,
  letterSpacing: '.02em',
};

const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: '52px 20px',
  background: 'var(--surface)',
  border: '1px dashed var(--border)',
  borderRadius: 15,
  color: 'var(--muted)',
};

const emptyTitleStyle: CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontSize: 20,
  color: 'var(--ink)',
  marginBottom: 6,
};

const emptyBodyStyle: CSSProperties = { fontSize: 14 };

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

function countLine(total: number): string {
  return total === 1 ? '1 candidato' : `${total} candidatos`;
}

export default function CandidateList({ candidates, onEval, onRemove }: CandidateListProps) {
  return (
    <div>
      <div style={countLineStyle}>
        <span style={countLabelStyle}>{countLine(candidates.length)}</span>
      </div>

      {candidates.length === 0 && (
        <div style={emptyStateStyle}>
          <div style={emptyTitleStyle}>Nenhum candidato ainda</div>
          <div style={emptyBodyStyle}>Adicione o primeiro candidato no formulário acima.</div>
        </div>
      )}

      <div style={listStyle}>
        {candidates.map((candidate) => (
          <CandidateRow key={candidate.id} candidate={candidate} onEval={onEval} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
