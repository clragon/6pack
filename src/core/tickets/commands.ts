import { openChannel } from '../tabs/channel';
import { closeTicket } from '../api/tickets';
import { composeTicketResponse } from './providers';
import { localTabId } from './registry';

// The close-from-another-tab protocol. The acting tab asks the tab that owns the
// ticket to close it: only the owner can compose faithful response text from its
// providers (RE621's greeting + %reporterName% transform, say) and holds the
// session it was opened under. Request/reply is correlated by id over its own
// channel.

type Message =
  | {
      kind: 'request';
      id: string;
      target: string;
      ticketId: number;
      providerId: string;
      optionId: string;
      forceClaim: boolean;
    }
  | { kind: 'reply'; id: string; ok: boolean; error?: string };

const channel = openChannel<Message>('ticket-commands');

// Generous: the owner composes text and round-trips the API. Past this we assume
// the tab is gone.
const REPLY_TIMEOUT_MS = 15000;

let handlerInstalled = false;

// Serve close requests addressed to this tab. Installed only where a ticket is
// published, since composing needs that page's response field and chips.
export function installTicketCommandHandler(): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  channel.subscribe((message) => {
    if (message.kind === 'request' && message.target === localTabId)
      void serve(message);
  });
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

// Composing left the response field filled, and the ticket is now closed, so
// reload to drop the stale prefill and show the closed state. Deferred so a remote
// reply reaches the acting tab before this tab tears down.
function reloadAfterClose(): void {
  setTimeout(() => window.location.reload(), 100);
}

async function serve(
  request: Extract<Message, { kind: 'request' }>,
): Promise<void> {
  try {
    await performClose(
      request.ticketId,
      request.providerId,
      request.optionId,
      request.forceClaim,
    );
    channel.post({ kind: 'reply', id: request.id, ok: true });
    reloadAfterClose();
  } catch (error) {
    channel.post({
      kind: 'reply',
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Ask the owning tab to close the ticket with the chosen template; resolves on its
// reply, rejects on failure or silence.
export function requestClose(
  targetTabId: string,
  ticketId: number,
  providerId: string,
  optionId: string,
  options: { forceClaim?: boolean } = {},
): Promise<void> {
  // The ticket is open in this very tab: close it directly, since BroadcastChannel
  // does not deliver a tab's own messages and a self-addressed request would hang.
  if (targetTabId === localTabId) {
    return performClose(
      ticketId,
      providerId,
      optionId,
      !!options.forceClaim,
    ).then(reloadAfterClose);
  }
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const unsubscribe = channel.subscribe((message) => {
      if (message.kind !== 'reply' || message.id !== id) return;
      clearTimeout(timer);
      unsubscribe();
      if (message.ok) resolve();
      else reject(new Error(message.error ?? 'Close failed'));
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
      providerId,
      optionId,
      forceClaim: !!options.forceClaim,
    });
  });
}
