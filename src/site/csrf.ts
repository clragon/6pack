// Rails embeds the CSRF token in a meta tag; e621's own POSTs send it back as
// the X-CSRF-Token header.
export function readCsrfToken(): string | null {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  return meta?.content ?? null;
}
