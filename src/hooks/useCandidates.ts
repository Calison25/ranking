import { useCallback, useEffect, useRef, useState } from 'react';
import type { CandidateWithEvaluations, EvaluationInput } from '../../lib/domain';
import { createCandidate, createEvaluation, deleteCandidate, fetchCandidates } from '../api/client';

export interface UseCandidatesResult {
  candidates: CandidateWithEvaluations[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addCandidate: (input: { nome: string; linkedin: string }) => Promise<void>;
  removeCandidate: (id: string) => Promise<void>;
  addEvaluation: (id: string, input: EvaluationInput) => Promise<void>;
}

function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Erro ao comunicar com o servidor';
}

export function useCandidates(): UseCandidatesResult {
  const [candidates, setCandidates] = useState<CandidateWithEvaluations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchCandidates();
      if (mountedRef.current) {
        setCandidates(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(extractErrorMessage(err));
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refetch().finally(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    });
  }, [refetch]);

  /**
   * Executa uma mutação e revalida a lista de candidatos em caso de sucesso.
   * Sempre re-lança o erro para o chamador tratar; opcionalmente popula o
   * estado `error` global (usado por addCandidate/removeCandidate, mas não
   * por addEvaluation — o modal de avaliação trata o erro localmente).
   */
  const runMutation = useCallback(
    async (mutation: () => Promise<unknown>, { recordError = false }: { recordError?: boolean } = {}) => {
      try {
        await mutation();
        await refetch();
      } catch (err) {
        if (recordError && mountedRef.current) {
          setError(extractErrorMessage(err));
        }
        throw err;
      }
    },
    [refetch],
  );

  const addCandidate = useCallback(
    (input: { nome: string; linkedin: string }) => runMutation(() => createCandidate(input), { recordError: true }),
    [runMutation],
  );

  const removeCandidate = useCallback(
    (id: string) => runMutation(() => deleteCandidate(id), { recordError: true }),
    [runMutation],
  );

  const addEvaluation = useCallback(
    (id: string, input: EvaluationInput) => runMutation(() => createEvaluation(id, input)),
    [runMutation],
  );

  return { candidates, loading, error, refetch, addCandidate, removeCandidate, addEvaluation };
}
