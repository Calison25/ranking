import { useState } from 'react';
import type { CSSProperties } from 'react';
import { buildRanking } from '../../lib/domain/index.js';
import type { CandidateWithEvaluations } from '../../lib/domain/index.js';
import RankingRow from './RankingRow.js';

interface RankingListProps {
  candidates: CandidateWithEvaluations[];
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  margin: '0 4px 14px',
};

const headerLabelStyle: CSSProperties = { fontSize: 13, color: 'var(--muted)', fontWeight: 600 };

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

const listStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };

export default function RankingList({ candidates }: RankingListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ranking = buildRanking(candidates);

  function toggle(id: string): void {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <span style={headerLabelStyle}>Ordenado por soma total de pontos</span>
      </div>

      {ranking.length === 0 && (
        <div style={emptyStateStyle}>
          <div style={emptyTitleStyle}>Sem avaliações ainda</div>
          <div style={emptyBodyStyle}>Avalie candidatos para que o ranking apareça aqui.</div>
        </div>
      )}

      <div style={listStyle}>
        {ranking.map((candidate, index) => (
          <RankingRow
            key={candidate.id}
            rank={index}
            candidate={candidate}
            expanded={!!expanded[candidate.id]}
            onToggle={() => toggle(candidate.id)}
          />
        ))}
      </div>
    </div>
  );
}
