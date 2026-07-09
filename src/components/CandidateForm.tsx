import { useState } from 'react';
import type { ChangeEvent, CSSProperties, KeyboardEvent } from 'react';
import { LINKEDIN_MAX_LENGTH, NOME_MAX_LENGTH } from '../../lib/domain/index.js';

interface CandidateFormProps {
  onAdd: (input: { nome: string; linkedin: string }) => Promise<void>;
}

const formStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 15,
  padding: '16px 18px',
  marginBottom: 24,
};

const fieldStyle: CSSProperties = {
  flex: 2,
  minWidth: 190,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  letterSpacing: '.06em',
};

const optionalHintStyle: CSSProperties = {
  fontWeight: 500,
  textTransform: 'none',
  letterSpacing: 0,
};

const inputStyle: CSSProperties = {
  padding: '11px 13px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  color: 'var(--ink)',
  background: 'var(--surface)',
};

const addButtonStyle: CSSProperties = {
  padding: '11px 22px',
  background: 'var(--dark)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function CandidateForm({ onAdd }: CandidateFormProps) {
  const [nome, setNome] = useState('');
  const [linkedin, setLinkedin] = useState('');

  async function submit(): Promise<void> {
    const trimmedNome = nome.trim();
    if (!trimmedNome) return;
    try {
      await onAdd({ nome: trimmedNome, linkedin: linkedin.trim() });
      setNome('');
      setLinkedin('');
    } catch {
      // erro já refletido no banner global (estado `error` do hook useCandidates)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void submit();
  }

  return (
    <div style={formStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle}>NOME</label>
        <input
          value={nome}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setNome(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nome do candidato"
          maxLength={NOME_MAX_LENGTH}
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>
          LINKEDIN <span style={optionalHintStyle}>(opcional)</span>
        </label>
        <input
          value={linkedin}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setLinkedin(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="linkedin.com/in/..."
          maxLength={LINKEDIN_MAX_LENGTH}
          style={inputStyle}
        />
      </div>
      <button onClick={() => void submit()} style={addButtonStyle}>
        Adicionar
      </button>
    </div>
  );
}
