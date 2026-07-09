// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CRITERIA } from '../../../lib/domain/index.js';
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

/** Localiza o bloco (container) de um critério pelo texto do seu label (ex: "Comunicação"). */
function findCriterionBlock(container: HTMLElement, criterionLabel: string): HTMLElement {
  const label = Array.from(container.querySelectorAll('span')).find((el) => el.textContent === criterionLabel);
  if (!label?.parentElement?.parentElement) {
    throw new Error(`Bloco do critério "${criterionLabel}" não encontrado`);
  }
  return label.parentElement.parentElement as HTMLElement;
}

/** Busca o botão de nota N (1-5) escopado dentro do bloco do critério informado. */
function findScoreButton(container: HTMLElement, criterionLabel: string, n: number): HTMLButtonElement {
  const block = findCriterionBlock(container, criterionLabel);
  return findButtonByText(block, String(n));
}

/** Busca o botão "Não sei opinar" escopado dentro do bloco do critério informado. */
function findNAButton(container: HTMLElement, criterionLabel: string): HTMLButtonElement {
  const block = findCriterionBlock(container, criterionLabel);
  return findButtonByText(block, 'Não sei opinar');
}

function findVeredictoRadio(container: HTMLElement, value: string): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(`input[name="veredicto"][value="${value}"]`);
  if (!input) {
    throw new Error(`Radio de veredicto "${value}" não encontrado`);
  }
  return input;
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Preenche todos os 9 critérios com nota 3, exceto as keys listadas em `skip`. */
function fillAllCriteria(container: HTMLElement, skip: string[] = []): void {
  act(() => {
    for (const criterion of CRITERIA) {
      if (skip.includes(criterion.key)) continue;
      findScoreButton(container, criterion.label, 3).click();
    }
  });
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

  it('mantém "Salvar avaliação" desabilitado até os 9 critérios + veredicto estarem definidos', () => {
    act(() => {
      root.render(<EvaluationModal candidate={sampleCandidate} onClose={onClose} onSave={onSave} />);
    });

    expect(findSaveButton(container).disabled).toBe(true);

    // Preenche 8 dos 9 critérios (deixa "Conhecimentos da Aplicação" pendente) + veredicto marcado
    fillAllCriteria(container, ['conhecimentoAplicacao']);
    act(() => {
      findVeredictoRadio(container, 'ajuda').click();
    });
    expect(findSaveButton(container).disabled).toBe(true);

    // Preenche o critério restante -> agora habilita
    act(() => {
      findScoreButton(container, 'Conhecimentos da Aplicação', 4).click();
    });
    expect(findSaveButton(container).disabled).toBe(false);
  });

  it('mantém "Salvar avaliação" desabilitado com os 9 critérios definidos mas sem veredicto selecionado', () => {
    act(() => {
      root.render(<EvaluationModal candidate={sampleCandidate} onClose={onClose} onSave={onSave} />);
    });

    fillAllCriteria(container);
    expect(findSaveButton(container).disabled).toBe(true);
  });

  it('monta o payload corretamente: notas soft numéricas, hard com NA vira null, veredicto e obs presentes', async () => {
    act(() => {
      root.render(<EvaluationModal candidate={sampleCandidate} onClose={onClose} onSave={onSave} />);
    });

    act(() => {
      findScoreButton(container, 'Comunicação', 5).click();
      findScoreButton(container, 'Organização', 4).click();
      findScoreButton(container, 'Proatividade', 3).click();
      findScoreButton(container, 'Cultura', 2).click();
      findScoreButton(container, 'Elaboração de Plano (IA)', 4).click();
      findScoreButton(container, 'Prompt Engineering (IA)', 3).click();
      findNAButton(container, 'Conhecimento de Modelos').click();
      findScoreButton(container, 'Web', 5).click();
      findScoreButton(container, 'Conhecimentos da Aplicação', 4).click();
    });

    const textarea = container.querySelector('textarea');
    if (!textarea) throw new Error('Textarea de observações não encontrada');
    act(() => {
      setTextareaValue(textarea, '  Bom candidato  ');
    });

    act(() => {
      findVeredictoRadio(container, 'ajuda').click();
    });

    expect(findSaveButton(container).disabled).toBe(false);

    await act(async () => {
      findSaveButton(container).click();
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledWith({
      comunicacao: 5,
      organizacao: 4,
      proatividade: 3,
      cultura: 2,
      elaboracaoPlano: 4,
      promptEngineering: 3,
      conhecimentoModelos: null,
      web: 5,
      conhecimentoAplicacao: 4,
      veredicto: 'ajuda',
      obs: 'Bom candidato',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('permite selecionar "Não vai ajudar a Agilize", enviando veredicto nao_ajuda no payload', async () => {
    act(() => {
      root.render(<EvaluationModal candidate={sampleCandidate} onClose={onClose} onSave={onSave} />);
    });

    fillAllCriteria(container);
    act(() => {
      findVeredictoRadio(container, 'nao_ajuda').click();
    });
    expect(findVeredictoRadio(container, 'nao_ajuda').checked).toBe(true);
    expect(findVeredictoRadio(container, 'ajuda').checked).toBe(false);
    expect(findSaveButton(container).disabled).toBe(false);

    await act(async () => {
      findSaveButton(container).click();
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ veredicto: 'nao_ajuda' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
