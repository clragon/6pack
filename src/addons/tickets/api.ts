import { transport } from '../../core/auth';

export function closeTicket(
  id: number,
  response: string,
  options: { forceClaim?: boolean } = {},
): Promise<unknown> {
  return transport.put(`/tickets/${id}.json`, {
    // e621's Ticket status enum is pending, partial and approved, and approved
    // is the only closed one.
    'ticket[status]': 'approved',
    'ticket[response]': response,
    force_claim: options.forceClaim ? 'true' : undefined,
  });
}

export function claimTicket(id: number): Promise<unknown> {
  return transport.post(`/tickets/${id}/claim.json`, {});
}

export function unclaimTicket(id: number): Promise<unknown> {
  return transport.post(`/tickets/${id}/unclaim.json`, {});
}
