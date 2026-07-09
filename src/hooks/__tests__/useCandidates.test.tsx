// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CandidateWithEvaluations } from '../../../lib/domain/index.js';
import { makeEvaluationInput } from '../../../lib/domain/__fixtures__/evaluation.js';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// React 18 exige este flag para reconhecer o ambiente jsdom como "act environment"
// (evita o warning "current testing environment is not configured to support act").
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../api/client.js', async () => {
  const actual = await vi.importActual<typeof import('../../api/client.js')>('../../api/client.js');
  return {
    ...actual,
    fetchCandidates: vi.fn(),
    createCandidate: vi.fn(),
    deleteCandidate: vi.fn(),
    createEvaluation: vi.fn(),
  };
});

import { ApiError, createCandidate, createEvaluation, deleteCandidate, fetchCandidates } from '../../api/client.js';
import { useCandidates } from '../useCandidates.js';

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createHookHarness<T>(useHook: () => T) {
  let latest: T | undefined;

  function Harness() {
    latest = useHook();
    return null;
  }

  return {
    Harness,
    get value(): T {
      if (latest === undefined) {
        throw new Error('Hook ainda não foi renderizado');
      }
      return latest;
    },
  };
}

const sampleCandidate: CandidateWithEvaluations = {
  id: '1',
  nome: 'Ana Silva',
  linkedin: 'https://linkedin.com/in/ana',
  createdAt: 1700000000000,
  evaluations: [],
};

const sampleEvaluationInput = makeEvaluationInput({
  comunicacao: 5,
  web: 4,
  elaboracaoPlano: 3,
  obs: 'ok',
});

describe('useCandidates', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.mocked(fetchCandidates).mockReset();
    vi.mocked(createCandidate).mockReset();
    vi.mocked(deleteCandidate).mockReset();
    vi.mocked(createEvaluation).mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('carrega candidatos no mount: loading vai de true para false e candidates é populado', async () => {
    vi.mocked(fetchCandidates).mockResolvedValue([sampleCandidate]);
    const harness = createHookHarness(useCandidates);

    act(() => {
      root.render(<harness.Harness />);
    });
    expect(harness.value.loading).toBe(true);

    await act(async () => {
      await flushPromises();
    });

    expect(harness.value.loading).toBe(false);
    expect(harness.value.candidates).toEqual([sampleCandidate]);
    expect(harness.value.error).toBeNull();
  });

  it('addCandidate revalida buscando candidatos novamente após o POST', async () => {
    vi.mocked(fetchCandidates).mockResolvedValue([]);
    vi.mocked(createCandidate).mockResolvedValue(sampleCandidate);
    const harness = createHookHarness(useCandidates);

    await act(async () => {
      root.render(<harness.Harness />);
      await flushPromises();
    });
    expect(fetchCandidates).toHaveBeenCalledTimes(1);

    await act(async () => {
      await harness.value.addCandidate({ nome: 'Ana Silva', linkedin: 'https://linkedin.com/in/ana' });
    });

    expect(createCandidate).toHaveBeenCalledWith({ nome: 'Ana Silva', linkedin: 'https://linkedin.com/in/ana' });
    expect(fetchCandidates).toHaveBeenCalledTimes(2);
  });

  it('popula error quando o fetch inicial falha', async () => {
    vi.mocked(fetchCandidates).mockRejectedValue(new ApiError(500, 'Erro ao comunicar com o servidor'));
    const harness = createHookHarness(useCandidates);

    await act(async () => {
      root.render(<harness.Harness />);
      await flushPromises();
    });

    expect(harness.value.loading).toBe(false);
    expect(harness.value.error).toBe('Erro ao comunicar com o servidor');
    expect(harness.value.candidates).toEqual([]);
  });

  it('addEvaluation re-lança o erro em falha (ex: 409 de limite) sem engolir', async () => {
    vi.mocked(fetchCandidates).mockResolvedValue([sampleCandidate]);
    vi.mocked(createEvaluation).mockRejectedValue(new ApiError(409, 'Limite de avaliações atingido'));
    const harness = createHookHarness(useCandidates);

    await act(async () => {
      root.render(<harness.Harness />);
      await flushPromises();
    });

    await act(async () => {
      await expect(harness.value.addEvaluation('1', sampleEvaluationInput)).rejects.toThrow(
        'Limite de avaliações atingido',
      );
    });

    expect(createEvaluation).toHaveBeenCalledWith('1', sampleEvaluationInput);
  });

  it('addCandidate re-lança E popula error em falha', async () => {
    vi.mocked(fetchCandidates).mockResolvedValue([]);
    vi.mocked(createCandidate).mockRejectedValue(new ApiError(400, 'Nome é obrigatório'));
    const harness = createHookHarness(useCandidates);

    await act(async () => {
      root.render(<harness.Harness />);
      await flushPromises();
    });

    await act(async () => {
      await expect(harness.value.addCandidate({ nome: '', linkedin: '' })).rejects.toThrow('Nome é obrigatório');
    });

    expect(harness.value.error).toBe('Nome é obrigatório');
  });

  it('removeCandidate re-lança E popula error em falha', async () => {
    vi.mocked(fetchCandidates).mockResolvedValue([sampleCandidate]);
    vi.mocked(deleteCandidate).mockRejectedValue(new ApiError(404, 'Candidato não encontrado'));
    const harness = createHookHarness(useCandidates);

    await act(async () => {
      root.render(<harness.Harness />);
      await flushPromises();
    });

    await act(async () => {
      await expect(harness.value.removeCandidate('1')).rejects.toThrow('Candidato não encontrado');
    });

    expect(harness.value.error).toBe('Candidato não encontrado');
  });
});
