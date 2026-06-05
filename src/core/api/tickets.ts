import { transport } from '../auth';

// Closing a ticket is the `approved` status (the lone closed state; pending and
// partial are both open). The update is moderator-gated server-side and the
// response must be at least 2 chars. force_claim overrides a claim held by
// another handler, mirroring e621's "submit again to force" resubmit.
export function closeTicket(
  id: number,
  response: string,
  options: { forceClaim?: boolean } = {},
): Promise<unknown> {
  return transport.put(`/tickets/${id}.json`, {
    'ticket[status]': 'approved',
    'ticket[response]': response,
    force_claim: options.forceClaim ? 'true' : undefined,
  });
}
