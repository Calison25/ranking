// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CandidateWithEvaluations, EvaluationInput } from '../../../lib/domain/index.js';
import EvaluationModal from '../EvaluationModal.js';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// React 18 exige este flag para reconhecer o ambiente jsdom como "act environment"
// (evita o warning "current testing environment is not configured to support act").
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sampleCandidate: CandidateWithEvaluations = {
  id: 'c1',
  nome: 'Ana Silva',
  linkedin: '',
  createdAt: 1700000000000,
  evaluations: [],
};

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function findButtonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((el) => el.textContent === text);
  if (!button) {
    throw new Error(`Botão com texto "${text}" não encontrado`);
  }
  return button;
}

function findSaveButton(container: HTMLElement): HTMLButtonElement {
  return findButtonByText(container, 'Salvar avaliação');
}

/** Localiza o bloco do critério pelo texto do label (ex: "Comunicação") e retorna o botão de nota N dentro dele. */
function findScoreButton(container: HTMLElement, criterionLabel: string, n: number): HTMLButtonElement {
  const label = Array.from(container.querySelectorAll('span')).find((el) => el.textContent === criterionLabel);
  if (!label?.parentElement?.parentElement) {
    throw new Error(`Bloco do critério "${criterionLabel}" não encontrado`);
  }
  const criterionBlock = label.parentElement.parentElement;
  return findButtonByText(criterionBlock, String(n));
}

describe('EvaluationModal', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onClose: ReturnType<typeof vi.fn>;
  let onSave: ReturnType<typeof vi.fn<(input: EvaluationInput) => Promise<void>>>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onClose = vi.fn();
    onSave = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('mantém "Salvar avaliação" desabilitado até os 3 critérios estarem definidos, incluindo NA no técnico', async () => {
    act(() => {
      root.render(<EvaluationModal candidate={sampleCandidate} onClose={onClose} onSave={onSave} />);
    });

    expect(findSaveButton(container).disabled).toBe(true);

    act(() => {
      findScoreButton(container, 'Comunicação', 5).click();
    });
    expect(findSaveButton(container).disabled).toBe(true);

    // Conhecimento técnico -> seleciona "Não sei opinar" (única ocorrência desse botão)
    act(() => {
      findButtonByText(container, 'Não sei opinar').click();
    });
    expect(findSaveButton(container).disabled).toBe(true);

    act(() => {
      findScoreButton(container, 'Soft skill', 3).click();
    });
    expect(findSaveButton(container).disabled).toBe(false);
  });

  it('ao salvar com NA no técnico, envia tecnico:null no payload', async () => {
    act(() => {
      root.render(<EvaluationModal candidate={sampleCandidate} onClose={onClose} onSave={onSave} />);
    });

    act(() => {
      findScoreButton(container, 'Comunicação', 4).click();
    });
    act(() => {
      findButtonByText(container, 'Não sei opinar').click();
    });
    act(() => {
      findScoreButton(container, 'Soft skill', 2).click();
    });

    expect(findSaveButton(container).disabled).toBe(false);

    await act(async () => {
      findSaveButton(container).click();
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledWith({
      comunicacao: 4,
      tecnico: null,
      softskill: 2,
      obs: '',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
