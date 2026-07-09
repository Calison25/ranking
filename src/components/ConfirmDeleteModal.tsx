import type { CSSProperties, MouseEvent } from 'react';

interface ConfirmDeleteModalProps {
  nome: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28,26,22,.42)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  zIndex: 60,
  animation: 'fadeIn .15s ease',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 16,
  width: '100%',
  maxWidth: 400,
  padding: '24px 26px',
  animation: 'popIn .2s ease',
  boxShadow: '0 24px 60px rgba(30,26,20,.28)',
};

const titleStyle: CSSProperties = { fontFamily: "'Newsreader', serif", fontSize: 21, color: 'var(--ink)' };

const bodyStyle: CSSProperties = { margin: '10px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 };

const nameHighlightStyle: CSSProperties = { color: 'var(--ink)' };

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

const removeButtonStyle: CSSProperties = {
  padding: '10px 18px',
  background: '#c0392b',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function ConfirmDeleteModal({ nome, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  function stopPropagation(event: MouseEvent<HTMLDivElement>): void {
    event.stopPropagation();
  }

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={cardStyle} onClick={stopPropagation}>
        <div style={titleStyle}>Remover candidato</div>
        <p style={bodyStyle}>
          Tem certeza que deseja remover <strong style={nameHighlightStyle}>{nome}</strong> e todas as suas
          avaliações? Esta ação não pode ser desfeita.
        </p>
        <div style={footerStyle}>
          <button onClick={onCancel} style={cancelButtonStyle}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={removeButtonStyle}>
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
