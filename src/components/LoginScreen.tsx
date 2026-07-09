import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { ApiError, login } from '../api/client.js';
import { storeToken } from '../auth/session.js';

interface LoginScreenProps {
  onSuccess: () => void;
}

const wrapperStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '36px 32px',
  animation: 'popIn .3s ease',
};

const badgeStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: 'var(--acSoft)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
};

const titleStyle: CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontSize: 26,
  fontWeight: 500,
  color: 'var(--ink)',
  margin: '16px 0 0',
};

const subtitleStyle: CSSProperties = {
  color: 'var(--muted)',
  fontSize: 14,
  margin: '8px 0 0',
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  marginTop: 24,
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  letterSpacing: '.06em',
  display: 'block',
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  color: 'var(--ink)',
  background: 'var(--surface)',
  boxSizing: 'border-box',
};

const errorStyle: CSSProperties = {
  background: 'var(--warnSoft)',
  color: 'var(--warn)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 600,
};

const submitButtonStyle: CSSProperties = {
  width: '100%',
  padding: '12px 22px',
  background: 'var(--dark)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Informe usuário e senha');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { token } = await login(trimmedUsername, password);
      storeToken(token);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao comunicar com o servidor');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={wrapperStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>🏆</div>
        <h1 style={titleStyle}>Classificador de Entrevistas</h1>
        <p style={subtitleStyle}>Acesso restrito. Entre com usuário e senha para continuar.</p>

        <form onSubmit={(event) => void handleSubmit(event)} style={formStyle}>
          <div>
            <label style={labelStyle}>USUÁRIO</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Usuário"
              autoFocus
              autoComplete="username"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>SENHA</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button type="submit" disabled={submitting} style={{ ...submitButtonStyle, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
