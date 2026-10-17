import type { PageContext } from './types';

const POST_SHOW = /^\/posts\/(\d+)/;
const TICKET_SHOW = /^\/tickets\/(\d+)/;
const USER_SHOW = /^\/users\/(\d+)/;

export function detectContext(): PageContext {
  const path = window.location.pathname;
  const post = path.match(POST_SHOW);
  if (post) return { kind: 'post', id: Number(post[1]) };
  const ticket = path.match(TICKET_SHOW);
  if (ticket) return { kind: 'ticket', id: Number(ticket[1]) };
  const user = path.match(USER_SHOW);
  if (user) return { kind: 'user', id: Number(user[1]) };
  if (path === '/user_feedbacks') {
    const raw = new URLSearchParams(window.location.search).get(
      'search[user_id]',
    );
    return {
      kind: 'userFeedbacks',
      userId: raw && /^\d+$/.test(raw) ? Number(raw) : null,
    };
  }
  if (path === '/post_replacements') {
    const raw = new URLSearchParams(window.location.search).get(
      'search[post_id]',
    );
    return {
      kind: 'postReplacements',
      postId: raw && /^\d+$/.test(raw) ? Number(raw) : null,
    };
  }
  if (path === '/post_replacements/new') {
    const raw = new URLSearchParams(window.location.search).get('post_id');
    return {
      kind: 'postReplacement',
      postId: raw && /^\d+$/.test(raw) ? Number(raw) : null,
    };
  }
  if (path === '/uploads/new') return { kind: 'upload' };
  return { kind: 'unknown' };
}
