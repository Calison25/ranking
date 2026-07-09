import type { CSSProperties } from 'react';
import { round1, VEREDICTO_BADGE } from '../../lib/domain/index.js';
import type { CandidateWithStats, Veredicto } from '../../lib/domain/index.js';
import { formatAjudaAggregate, formatDate, formatGroupScores } from '../utils/format.js';

interface RankingRowProps {
  rank: number;
  candidate: CandidateWithStats;
  expanded: boolean;
  onToggle: () => void;
}

const MEDAL_COLORS = ['#c08a2c', '#9a9ca6', '#b06a38'];

const rowBaseStyle: CSSProperties = { borderRadius: 14, padding: '16px 20px', background: 'var(--surface)' };

const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer' };

const rankBaseStyle: CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontSize: 30,
  fontWeight: 500,
  width: 44,
  textAlign: 'center',
  flexShrink: 0,
};

const infoStyle: CSSProperties = { flex: 1, minWidth: 0 };
const nameRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
const nameStyle: CSSProperties = { fontWeight: 600, fontSize: 17, color: 'var(--ink)' };
const metaStyle: CSSProperties = { fontSize: 13, color: 'var(--muted)', marginTop: 2 };

const statsRowStyle: CSSProperties = { display: 'flex', gap: 20 };
const valueWrapperStyle: CSSProperties = { textAlign: 'right' };
const valueStyle: CSSProperties = { fontFamily: "'Newsreader', serif", fontSize: 31, lineHeight: 1, color: 'var(--ink)' };
const valueUnitStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--faint)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginTop: 1,
};

const metaWarnStyle: CSSProperties = { color: 'var(--warn)', fontWeight: 600 };

const toggleLabelStyle: CSSProperties = {
  color: 'var(--ac)',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  minWidth: 130,
  textAlign: 'right',
};

const panelStyle: CSSProperties = {
  marginTop: 15,
  paddingTop: 15,
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 11,
  animation: 'fadeIn .2s ease',
};

const obsCardStyle: CSSProperties = {
  background: 'var(--soft)',
  border: '1px solid var(--border)',
  borderRadius: 11,
  padding: '12px 15px',
};

const obsHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  fontSize: 12,
  color: 'var(--muted)',
  marginBottom: 8,
  flexWrap: 'wrap',
};

const scoreLinesStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 };
const scoreLineStyle: CSSProperties = { fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 6 };
const scoreLineLabelStyle: CSSProperties = { fontWeight: 600 };

const obsTextStyle: CSSProperties = { fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 };
const obsTextEmptyStyle: CSSProperties = { fontSize: 14, color: 'var(--faint)', fontStyle: 'italic', lineHeight: 1.5 };

/** Pill compacto usado tanto no agregado do candidato quanto no veredicto por avaliação. */
function pillStyle(positive: boolean): CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 999,
    background: positive ? 'var(--acSoft)' : 'var(--warnSoft)',
    color: positive ? 'var(--ac)' : 'var(--warn)',
  };
}

function veredictoPillStyle(veredicto: Veredicto): CSSProperties {
  return pillStyle(veredicto === 'ajuda');
}

export default function RankingRow({ rank, candidate, expanded, onToggle }: RankingRowProps) {
  const isTop = rank < 3;
  const rankLabel = `${rank + 1 < 10 ? '0' : ''}${rank + 1}`;
  const rankStyle: CSSProperties = { ...rankBaseStyle, color: isTop ? MEDAL_COLORS[rank] : 'var(--faint)' };
  const rowStyle: CSSProperties = {
    ...rowBaseStyle,
    border: isTop ? '1px solid var(--acSoft)' : '1px solid var(--border)',
  };
  const evaluationWord = candidate.count === 1 ? 'avaliação' : 'avaliações';
  const metaLabel = `${candidate.count} ${evaluationWord} · média ${round1(candidate.avg)}`;
  const negativeVotes = candidate.count - candidate.ajudaVotes;
  const negativeVoteWord = negativeVotes === 1 ? 'voto' : 'votos';
  const ajudaUnanimous = candidate.ajudaVotes === candidate.count;
  const ajudaPctValue = Math.round(candidate.ajudaPct * 100);

  return (
    <div style={rowStyle}>
      <div style={headerStyle} onClick={onToggle}>
        <div style={rankStyle}>{rankLabel}</div>
        <div style={infoStyle}>
          <div style={nameRowStyle}>
            <span style={nameStyle}>{candidate.nome}</span>
            <span style={pillStyle(ajudaUnanimous)}>
              {formatAjudaAggregate(candidate.ajudaVotes, candidate.count)}
            </span>
          </div>
          <div style={metaStyle}>
            {metaLabel}
            {negativeVotes > 0 && (
              <span style={metaWarnStyle}>
                {' '}
                · {negativeVotes} {negativeVoteWord} "não vai ajudar"
              </span>
            )}
          </div>
        </div>
        <div style={statsRowStyle}>
          <div style={valueWrapperStyle}>
            <div style={{ ...valueStyle, color: ajudaUnanimous ? 'var(--ac)' : 'var(--warn)' }}>{ajudaPctValue}%</div>
            <div style={valueUnitStyle}>vai ajudar</div>
          </div>
          <div style={valueWrapperStyle}>
            <div style={valueStyle}>{candidate.total}</div>
            <div style={valueUnitStyle}>pontos</div>
          </div>
        </div>
        <div style={toggleLabelStyle}>{expanded ? 'Ocultar observações ▲' : 'Ver observações ▾'}</div>
      </div>

      {expanded && (
        <div style={panelStyle}>
          {candidate.evaluations.map((evaluation) => (
            <div key={evaluation.id} style={obsCardStyle}>
              <div style={obsHeaderStyle}>
                <span style={veredictoPillStyle(evaluation.veredicto)}>
                  {VEREDICTO_BADGE[evaluation.veredicto]}
                </span>
                <span>{formatDate(evaluation.date)}</span>
              </div>
              <div style={scoreLinesStyle}>
                <div style={scoreLineStyle}>
                  <span style={scoreLineLabelStyle}>Soft</span>
                  <span>{formatGroupScores(evaluation, 'soft')}</span>
                </div>
                <div style={scoreLineStyle}>
                  <span style={scoreLineLabelStyle}>Hard</span>
                  <span>{formatGroupScores(evaluation, 'hard')}</span>
                </div>
              </div>
              <div style={evaluation.obs ? obsTextStyle : obsTextEmptyStyle}>
                {evaluation.obs ? evaluation.obs : 'Sem observação registrada.'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
