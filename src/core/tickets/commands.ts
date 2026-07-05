import { openChannel } from '../tabs/channel';
import { claimTicket, closeTicket, unclaimTicket } from '../api/tickets';
import { composeTicketResponse } from './providers';
import { localTabId } from './registry';

// Run a ticket action (close, claim, unclaim) on the tab that owns the ticket.
// Close must run there: only the owner can compose faithful response text from its
// providers and holds the session. Claim and unclaim run there too so the owning
// page reloads to its new state. Request/reply is correlated by id over the channel.

export type TicketOp =
  | { op: 'close'; providerId: string; optionId: string; forceClaim: boolean }
  | { op: 'claim' }
  | { op: 'unclaim' };

type Message =
  | {
      kind: 'request';
      id: string;
      target: string;
      ticketId: number;
      action: TicketOp;
    }
  | { kind: 'reply'; id: string; ok: boolean; error?: string };

const channel = openChannel<Message>('ticket-commands');

// Generous: the owner composes text and round-trips the API. Past this we assume
// the tab is gone.
const REPLY_TIMEOUT_MS = 15000;

let handlerInstalled = false;

// Serve requests addressed to this tab. Installed only where a ticket is
// published, since composing needs that page's response field and chips.
export function installTicketCommandHandler(): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  channel.subscribe((message) => {
    if (message.kind === 'request' && message.target === localTabId)
      void serve(message);
  });
}

async function perform(ticketId: number, action: TicketOp): Promise<void> {
  switch (action.op) {
    case 'close':
      return performClose(
        ticketId,
        action.providerId,
        action.optionId,
        action.forceClaim,
      );
    case 'claim':
      await claimTicket(ticketId);
      return;
    case 'unclaim':
      await unclaimTicket(ticketId);
      return;
  }
}

// Compose the faithful response on this (the owning) page and close the ticket.
// Throws on any failure. Shared by the remote handler and the in-process path.
async function performClose(
  ticketId: number,
  providerId: string,
  optionId: string,
  forceClaim: boolean,
): Promise<void> {
  const response = composeTicketResponse(providerId, optionId);
  if (response == null)
    throw new Error('That response is no longer available on the ticket tab');
  if (response.trim().length < 2)
    throw new Error('The composed response is empty');
  const result = (await closeTicket(ticketId, response, { forceClaim })) as {
    status?: string;
  } | null;
  // A claim held by another handler makes e621 redirect instead of updating, so a
  // bare 200 is not proof. Trust it only when the status actually moved.
  if (
    result &&
    typeof result.status === 'string' &&
    result.status !== 'approved'
  ) {
    throw new Error(
      'Ticket was not closed, it may be claimed by another handler',
    );
  }
}

// The action changed the ticket server-side, so reload to drop any stale prefill
// and show the new state. Deferred so a remote reply reaches the acting tab before
// this tab tears down.
function reloadAfterAction(): void {
  setTimeout(() => window.location.reload(), 100);
}

async function serve(
  request: Extract<Message, { kind: 'request' }>,
): Promise<void> {
  try {
    await perform(request.ticketId, request.action);
    channel.post({ kind: 'reply', id: request.id, ok: true });
    reloadAfterAction();
  } catch (error) {
    channel.post({
      kind: 'reply',
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Ask the owning tab to run the action; resolves on its reply, rejects on failure
// or silence. A ticket open in this very tab is handled in-process, since
// BroadcastChannel does not deliver a tab's own messages.
function requestAction(
  targetTabId: string,
  ticketId: number,
  action: TicketOp,
): Promise<void> {
  if (targetTabId === localTabId) {
    return perform(ticketId, action).then(reloadAfterAction);
  }
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const unsubscribe = channel.subscribe((message) => {
      if (message.kind !== 'reply' || message.id !== id) return;
      clearTimeout(timer);
      unsubscribe();
      if (message.ok) resolve();
      else reject(new Error(message.error ?? 'Ticket action failed'));
    });
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('The ticket tab did not respond, it may have closed'));
    }, REPLY_TIMEOUT_MS);
    channel.post({
      kind: 'request',
      id,
      target: targetTabId,
      ticketId,
      action,
    });
  });
}

export function requestClose(
  targetTabId: string,
  ticketId: number,
  providerId: string,
  optionId: string,
  options: { forceClaim?: boolean } = {},
): Promise<void> {
  return requestAction(targetTabId, ticketId, {
    op: 'close',
    providerId,
    optionId,
    forceClaim: !!options.forceClaim,
  });
}

export function requestClaim(
  targetTabId: string,
  ticketId: number,
): Promise<void> {
  return requestAction(targetTabId, ticketId, { op: 'claim' });
}

export function requestUnclaim(
  targetTabId: string,
  ticketId: number,
): Promise<void> {
  return requestAction(targetTabId, ticketId, { op: 'unclaim' });
}
