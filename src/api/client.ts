import type { CandidateWithEvaluations, Evaluation, EvaluationInput } from '../../lib/domain/index.js';
import { clearStoredToken, getStoredToken } from '../auth/session.js';

const DEFAULT_ERROR_MESSAGE = 'Erro ao comunicar com o servidor';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body?.error ?? DEFAULT_ERROR_MESSAGE;
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
}

function withAuth(init?: RequestInit): RequestInit | undefined {
  const token = getStoredToken();
  if (!token) {
    return init;
  }
  return {
    ...init,
    headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, withAuth(init));

  if (response.status === 401) {
    clearStoredToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:expired'));
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

function candidatePath(id: string): string {
  return `/api/candidates/${encodeURIComponent(id)}`;
}

export function fetchCandidates(): Promise<CandidateWithEvaluations[]> {
  return request<CandidateWithEvaluations[]>('/api/candidates');
}

export function createCandidate(input: { nome: string; linkedin: string }): Promise<CandidateWithEvaluations> {
  return request<CandidateWithEvaluations>('/api/candidates', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function deleteCandidate(id: string): Promise<void> {
  await request<{ ok: true }>(candidatePath(id), { method: 'DELETE' });
}

export function createEvaluation(id: string, input: EvaluationInput): Promise<Evaluation> {
  return request<Evaluation>(`${candidatePath(id)}/evaluations`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export function login(username: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('/api/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ username, password }),
  });
}
