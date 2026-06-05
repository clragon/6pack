import { transport } from '../auth';

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
