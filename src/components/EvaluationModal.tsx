import { useState } from 'react';
import type { ChangeEvent, CSSProperties, MouseEvent } from 'react';
import { CRITERIA, MAX_EVALUATIONS, NOTE_LABELS, NOTE_LEGEND, OBS_MAX_LENGTH } from '../../lib/domain';
import type { CandidateWithEvaluations, EvaluationInput } from '../../lib/domain';

type CriterionKey = (typeof CRITERIA)[number]['key'];
type ScoreValue = number | 'na' | null;
type Scores = Record<CriterionKey, ScoreValue>;

interface EvaluationModalProps {
  candidate: CandidateWithEvaluations;
  onClose: () => void;
  onSave: (input: EvaluationInput) => Promise<void>;
}

const INITIAL_SCORES: Scores = { comunicacao: null, tecnico: null, softskill: null };

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28,26,22,.42)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '40px 20px',
  zIndex: 50,
  overflow: 'auto',
  animation: 'fadeIn .15s ease',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 18,
  width: '100%',
  maxWidth: 520,
  padding: '26px 28px',
  animation: 'popIn .2s ease',
  boxShadow: '0 24px 60px rgba(30,26,20,.28)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
};

const nameStyle: CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontSize: 23,
  lineHeight: 1.1,
  color: 'var(--ink)',
};

const attemptStyle: CSSProperties = { fontSize: 13, color: 'var(--muted)', marginTop: 3 };

const closeButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 9,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--faint)',
  cursor: 'pointer',
  fontSize: 13,
  flexShrink: 0,
};

const legendStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  marginTop: 16,
  background: 'var(--soft)',
  border: '1px solid var(--border)',
  borderRadius: 9,
  padding: '9px 13px',
  textAlign: 'center',
};

const criteriaListStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 };

const criterionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 9,
  gap: 10,
};

const criterionLabelStyle: CSSProperties = { fontWeight: 600, fontSize: 15, color: 'var(--ink)' };
const criterionValLabelStyle: CSSProperties = { fontSize: 13, color: 'var(--ac)', fontWeight: 600 };

const buttonsRowStyle: CSSProperties = { display: 'flex', gap: 8 };

const noteBaseStyle: CSSProperties = {
  width: 46,
  height: 44,
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  border: '1px solid',
};

const naBaseStyle: CSSProperties = {
  marginTop: 8,
  padding: '8px 14px',
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  border: '1px solid',
};

const obsWrapperStyle: CSSProperties = { marginTop: 20 };
const obsLabelStyle: CSSProperties = { fontWeight: 600, fontSize: 13, color: 'var(--muted)' };
const textareaStyle: CSSProperties = {
  width: '100%',
  marginTop: 7,
  minHeight: 82,
  padding: '11px 13px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
  lineHeight: 1.5,
  background: 'var(--surface)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  padding: '10px 13px',
  background: 'var(--warnSoft)',
  color: 'var(--warn)',
  borderRadius: 9,
  fontSize: 13,
  fontWeight: 600,
};

const footerStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 };

const cancelButtonStyle: CSSProperties = {
  padding: '10px 18px',
  background: 'var(--surface)',
  color: 'var(--muted)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const saveBaseStyle: CSSProperties = { padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none' };

function isSet(value: ScoreValue): value is number | 'na' {
  return value === 'na' || (typeof value === 'number' && value > 0);
}

function valLabelFor(value: ScoreValue): string {
  if (value === 'na') return 'Não sei opinar';
  if (value === null) return '';
  return `${value} — ${NOTE_LABELS[value]}`;
}

export default function EvaluationModal({ candidate, onClose, onSave }: EvaluationModalProps) {
  const [scores, setScores] = useState<Scores>(INITIAL_SCORES);
  const [obs, setObs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const attemptNumber = candidate.evaluations.length + 1;
  const canSave = CRITERIA.every((criterion) => isSet(scores[criterion.key]));

  function setScore(key: CriterionKey, value: number | 'na'): void {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(): Promise<void> {
    if (!canSave || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const tecnicoValue = scores.tecnico;
      await onSave({
        comunicacao: scores.comunicacao as number,
        tecnico: tecnicoValue === 'na' ? null : (tecnicoValue as number),
        softskill: scores.softskill as number,
        obs: obs.trim(),
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar avaliação');
    } finally {
      setSubmitting(false);
    }
  }

  const saveStyle: CSSProperties = canSave
    ? { ...saveBaseStyle, background: 'var(--ac)', color: '#fff', cursor: 'pointer' }
    : { ...saveBaseStyle, background: 'var(--chip)', color: 'var(--faint)', cursor: 'not-allowed' };

  function stopPropagation(event: MouseEvent<HTMLDivElement>): void {
    event.stopPropagation();
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={stopPropagation}>
        <div style={headerStyle}>
          <div>
            <div style={nameStyle}>{candidate.nome}</div>
            <div style={attemptStyle}>
              Avaliação {attemptNumber} de {MAX_EVALUATIONS}
            </div>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            ✕
          </button>
        </div>

        <div style={legendStyle}>{NOTE_LEGEND}</div>

        <div style={criteriaListStyle}>
          {CRITERIA.map((criterion) => {
            const value = scores[criterion.key];
            return (
              <div key={criterion.key}>
                <div style={criterionHeaderStyle}>
                  <span style={criterionLabelStyle}>{criterion.label}</span>
                  <span style={criterionValLabelStyle}>{valLabelFor(value)}</span>
                </div>
                <div style={buttonsRowStyle}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const selected = value === n;
                    const buttonStyle: CSSProperties = selected
                      ? { ...noteBaseStyle, background: 'var(--ac)', color: '#fff', borderColor: 'var(--ac)' }
                      : { ...noteBaseStyle, background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--border)' };
                    return (
                      <button key={n} onClick={() => setScore(criterion.key, n)} style={buttonStyle}>
                        {n}
                      </button>
                    );
                  })}
                </div>
                {criterion.hasNA && (
                  <button
                    onClick={() => setScore(criterion.key, 'na')}
                    style={
                      value === 'na'
                        ? { ...naBaseStyle, background: 'var(--ac)', color: '#fff', borderColor: 'var(--ac)' }
                        : { ...naBaseStyle, background: 'var(--surface)', color: 'var(--muted)', borderColor: 'var(--border)' }
                    }
                  >
                    Não sei opinar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={obsWrapperStyle}>
          <label style={obsLabelStyle}>Observações</label>
          <textarea
            value={obs}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setObs(event.target.value)}
            placeholder="Anotações sobre o candidato (opcional)"
            maxLength={OBS_MAX_LENGTH}
            style={textareaStyle}
          />
        </div>

        {submitError && <div style={errorStyle}>{submitError}</div>}

        <div style={footerStyle}>
          <button onClick={onClose} style={cancelButtonStyle}>
            Cancelar
          </button>
          <button onClick={() => void handleSave()} disabled={!canSave || submitting} style={saveStyle}>
            Salvar avaliação
          </button>
        </div>
      </div>
    </div>
  );
}
