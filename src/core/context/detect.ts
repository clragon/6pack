import type { PageContext } from './types';

const POST_SHOW = /^\/posts\/(\d+)/;
const TICKET_SHOW = /^\/tickets\/(\d+)/;

export function detectContext(): PageContext {
  const path = window.location.pathname;
  const post = path.match(POST_SHOW);
  if (post) return { kind: 'post', id: Number(post[1]) };
  const ticket = path.match(TICKET_SHOW);
  if (ticket) return { kind: 'ticket', id: Number(ticket[1]) };
  return { kind: 'unknown' };
}
