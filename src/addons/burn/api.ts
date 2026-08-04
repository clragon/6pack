import { transport } from '../../core/auth';
import type { BurnableType } from './burnable';

function base(type: BurnableType, id: string): string {
  return type === 'comment' ? `/comments/${id}` : `/forum_posts/${id}`;
}

export function hide(type: BurnableType, id: string): Promise<unknown> {
  return transport.post(`${base(type, id)}/hide.json`, {});
}

export function markWarning(
  type: BurnableType,
  id: string,
  recordType: string,
): Promise<unknown> {
  return transport.post(`${base(type, id)}/warning.json`, {
    record_type: recordType,
  });
}
