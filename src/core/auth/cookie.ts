import { readCsrfToken } from '../../site/csrf';
import type { Transport } from './types';

type Body = Record<string, string | number | boolean | null | undefined>;

async function send(method: string, path: string, body: Body): Promise<unknown> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value !== null && value !== undefined) form.append(key, String(value));
  }

  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': readCsrfToken() ?? '',
    },
    body: form,
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data as { reason?: string; message?: string } | null;
    throw new Error(detail?.reason || detail?.message || `HTTP ${response.status}`);
  }
  return data;
}

export const cookieTransport: Transport = {
  post: (path, body) => send('POST', path, body),
  put: (path, body) => send('PUT', path, body),
  del: (path, body) => send('DELETE', path, body),
};
