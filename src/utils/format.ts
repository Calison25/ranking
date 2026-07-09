const PROTOCOL_RE = /^https?:\/\//i;

/** Formata um timestamp (ms) como 'dd/mm/aaaa'. */
export function formatDate(ts: number): string {
  const date = new Date(ts);
  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Prefixa 'https://' quando a URL não tiver protocolo explícito. */
export function linkHref(u: string): string {
  if (!u) return '';
  return PROTOCOL_RE.test(u) ? u : `https://${u}`;
}
