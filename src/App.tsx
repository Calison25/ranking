import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import CandidateForm from './components/CandidateForm.js';
import CandidateList from './components/CandidateList.js';
import ConfirmDeleteModal from './components/ConfirmDeleteModal.js';
import EvaluationModal from './components/EvaluationModal.js';
import LoginScreen from './components/LoginScreen.js';
import RankingList from './components/RankingList.js';
import { clearStoredToken, getStoredToken } from './auth/session.js';
import { useCandidates } from './hooks/useCandidates.js';

type View = 'candidatos' | 'ranking';

const containerStyle: CSSProperties = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: '44px 24px 90px',
};

const headerRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 28,
  flexWrap: 'wrap',
};

const titleStyle: CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontWeight: 500,
  fontSize: 36,
  lineHeight: 1.05,
  margin: 0,
  letterSpacing: '-.01em',
  color: 'var(--ink)',
};

const subtitleStyle: CSSProperties = {
  margin: '9px 0 0',
  color: 'var(--muted)',
  fontSize: 15,
  maxWidth: '46ch',
};

const tabsWrapperStyle: CSSProperties = {
  display: 'inline-flex',
  background: 'var(--chip)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 4,
  gap: 4,
};

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const logoutButtonStyle: CSSProperties = {
  padding: '9px 16px',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--muted)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const tabBaseStyle: CSSProperties = {
  padding: '8px 18px',
  borderRadius: 9,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const tabActiveStyle: CSSProperties = { ...tabBaseStyle, background: 'var(--dark)', color: '#fff' };
const tabInactiveStyle: CSSProperties = { ...tabBaseStyle, background: 'transparent', color: 'var(--muted)' };

const discreetStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: '52px 20px',
  background: 'var(--surface)',
  border: '1px dashed var(--border)',
  borderRadius: 15,
  color: 'var(--muted)',
};

const errorBannerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  background: 'var(--warnSoft)',
  color: 'var(--warn)',
  borderRadius: 12,
  padding: '13px 16px',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 20,
};

const retryButtonStyle: CSSProperties = {
  padding: '8px 16px',
  background: 'var(--surface)',
  color: 'var(--warn)',
  border: '1px solid var(--warn)',
  borderRadius: 9,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
};

function ClassifierApp({ onLogout }: { onLogout: () => void }) {
  const { candidates, loading, error, refetch, addCandidate, removeCandidate, addEvaluation } = useCandidates();
  const [view, setView] = useState<View>('candidatos');
  const [evalFor, setEvalFor] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const evalCandidate = evalFor ? (candidates.find((c) => c.id === evalFor) ?? null) : null;
  const confirmCandidate = confirmDel ? (candidates.find((c) => c.id === confirmDel) ?? null) : null;

  async function handleConfirmDelete(): Promise<void> {
    if (!confirmDel) return;
    try {
      await removeCandidate(confirmDel);
    } catch {
      // erro já refletido no banner global (estado `error` do hook useCandidates)
    } finally {
      setConfirmDel(null);
    }
  }

  return (
    <div style={containerStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>Classificador de Entrevistas</h1>
          <p style={subtitleStyle}>
            Cadastre candidatos, registre até 4 avaliações por pessoa e acompanhe o ranking geral.
          </p>
        </div>
        <div style={headerActionsStyle}>
          <div style={tabsWrapperStyle}>
            <button
              onClick={() => setView('candidatos')}
              style={view === 'candidatos' ? tabActiveStyle : tabInactiveStyle}
            >
              Candidatos
            </button>
            <button onClick={() => setView('ranking')} style={view === 'ranking' ? tabActiveStyle : tabInactiveStyle}>
              Ranking
            </button>
          </div>
          <button onClick={onLogout} style={logoutButtonStyle}>
            Sair
          </button>
        </div>
      </div>

      {loading ? (
        <div style={discreetStateStyle}>Carregando...</div>
      ) : (
        <>
          {error && (
            <div style={errorBannerStyle}>
              <span>{error}</span>
              <button onClick={() => void refetch()} style={retryButtonStyle}>
                Tentar novamente
              </button>
            </div>
          )}

          {view === 'candidatos' ? (
            <>
              <CandidateForm onAdd={addCandidate} />
              <CandidateList candidates={candidates} onEval={setEvalFor} onRemove={setConfirmDel} />
            </>
          ) : (
            <RankingList candidates={candidates} />
          )}
        </>
      )}

      {evalCandidate && (
        <EvaluationModal
          key={evalCandidate.id}
          candidate={evalCandidate}
          onClose={() => setEvalFor(null)}
          onSave={(input) => addEvaluation(evalCandidate.id, input)}
        />
      )}

      {confirmCandidate && (
        <ConfirmDeleteModal
          nome={confirmCandidate.nome}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => getStoredToken() !== null);

  useEffect(() => {
    function handleExpired(): void {
      setAuthenticated(false);
    }
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  function handleLogout(): void {
    clearStoredToken();
    setAuthenticated(false);
  }

  if (!authenticated) {
    return <LoginScreen onSuccess={() => setAuthenticated(true)} />;
  }
  return <ClassifierApp onLogout={handleLogout} />;
}
