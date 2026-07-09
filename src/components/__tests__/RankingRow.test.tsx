// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decorateCandidate } from '../../../lib/domain/index.js';
import type { CandidateWithEvaluations, CandidateWithStats } from '../../../lib/domain/index.js';
import { makeEvaluation } from '../../../lib/domain/__fixtures__/evaluation.js';
import RankingRow from '../RankingRow.js';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// React 18 exige este flag para reconhecer o ambiente jsdom como "act environment".
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function findByExactText(container: HTMLElement, text: string): HTMLElement {
  const el = Array.from(container.querySelectorAll<HTMLElement>('*')).find(
    (candidate) => candidate.textContent === text && candidate.children.length === 0,
  );
  if (!el) {
    throw new Error(`Elemento com texto "${text}" não encontrado`);
  }
  return el;
}

function Harness({ candidate }: { candidate: CandidateWithStats }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <RankingRow
      rank={0}
      candidate={candidate}
      expanded={expanded}
      onToggle={() => setExpanded((prev) => !prev)}
    />
  );
}

describe('RankingRow', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('mostra o agregado de veredicto sem expandir e, ao expandir, mostra Soft/Hard e o badge por avaliação', () => {
    const candidateBase: CandidateWithEvaluations = {
      id: 'c1',
      nome: 'Ana Silva',
      linkedin: '',
      createdAt: 1700000000000,
      evaluations: [
        makeEvaluation({
          id: 'e1',
          comunicacao: 4,
          organizacao: 3,
          proatividade: 5,
          cultura: 4,
          elaboracaoPlano: 3,
          promptEngineering: null,
          conhecimentoModelos: 4,
          web: null,
          conhecimentoAplicacao: 5,
          veredicto: 'ajuda',
          obs: '',
          date: 1700000000000,
        }),
        makeEvaluation({
          id: 'e2',
          veredicto: 'nao_ajuda',
          date: 1700000100000,
        }),
      ],
    };
    const candidate = decorateCandidate(candidateBase);

    act(() => {
      root.render(<Harness candidate={candidate} />);
    });

    // Agregado visível sem expandir (1 de 2 avaliações votou "ajuda").
    expect(container.textContent).toContain('1/2 vai ajudar');
    expect(container.textContent).not.toContain('Soft');
    expect(container.textContent).not.toContain('Hard');

    act(() => {
      findByExactText(container, 'Ver observações ▾').click();
    });

    expect(container.textContent).toContain('Soft');
    expect(container.textContent).toContain('Com 4 · Org 3 · Pro 5 · Cul 4');
    expect(container.textContent).toContain('Hard');
    expect(container.textContent).toContain('Plano 3 · Prompt n/a · Modelos 4 · Web n/a · App 5');
    expect(container.textContent).toContain('Vai ajudar');
    expect(container.textContent).toContain('Não vai ajudar');
  });
});
