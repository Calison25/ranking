const SUFFIX_LENGTH = 4;

function randomSuffix(length: number): string {
  let suffix = '';
  while (suffix.length < length) {
    suffix += Math.random().toString(36).slice(2);
  }
  return suffix.slice(0, length);
}

export function genCandidateId(): string {
  return 'c' + Date.now().toString(36) + randomSuffix(SUFFIX_LENGTH);
}

export function genEvaluationId(): string {
  return 'e' + Date.now().toString(36) + randomSuffix(SUFFIX_LENGTH);
}
