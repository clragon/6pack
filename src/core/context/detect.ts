import type { PageContext } from './types';

const POST_SHOW = /^\/posts\/(\d+)/;

export function detectContext(): PageContext {
  const match = window.location.pathname.match(POST_SHOW);
  if (match) return { kind: 'post', id: Number(match[1]) };
  return { kind: 'unknown' };
}
