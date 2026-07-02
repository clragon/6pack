import { openChannel } from '../tabs/channel';
import { closeTicket } from '../api/tickets';
import { composeTicketResponse } from './providers';
import { localTabId } from './registry';

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

const REPLY_TIMEOUT_MS = 15000;

let handlerInstalled = false;

export function installTicketCommandHandler(): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  channel.subscribe((message) => {
    if (message.kind === 'request' && message.target === localTabId)
      void serve(message);
  });
}

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

export function requestClose(
  targetTabId: string,
  ticketId: number,
  providerId: string,
  optionId: string,
  options: { forceClaim?: boolean } = {},
): Promise<void> {
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
