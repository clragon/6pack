import { transport } from '../auth';

// Create a ban for one user with a set of ban fields captured from the first
// ban's form. The fields keep e621's own names, so new ones (e.g. deny login)
// carry through without us naming them, and bracketed keys replay what the
// form posts (Rails nests them back into a ban param).
export function createBan(
  userId: number,
  fields: Record<string, string>,
): Promise<unknown> {
  const body: Record<string, string | number> = { 'ban[user_id]': userId };
  for (const [field, value] of Object.entries(fields)) {
    body[`ban[${field}]`] = value;
  }
  return transport.post('/bans', body);
}
