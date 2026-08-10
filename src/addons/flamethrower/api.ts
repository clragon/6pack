import { transport } from '../../core/auth';
import type { BurnableType } from './burnable';

function base(type: BurnableType, id: string): string {
  return type === 'comment' ? `/comments/${id}` : `/forum_posts/${id}`;
}

// Hide the item (the janitor "hide" member action). Reversible on the site.
export function hide(type: BurnableType, id: string): Promise<unknown> {
  return transport.post(`${base(type, id)}/hide.json`, {});
}

// Attach a warning record of the given severity ("warning" | "record" | "ban").
export function markWarning(
  type: BurnableType,
  id: string,
  recordType: string,
): Promise<unknown> {
  return transport.post(`${base(type, id)}/warning.json`, {
    record_type: recordType,
  });
}
