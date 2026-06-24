import { transport } from '../auth';

// The keys of fields are the ban form's own names, which
// BansController#ban_params in e621ng permits out of the nested ban param.
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
