import { openChannel } from '../tabs/channel';
import { claimTicket, closeTicket, unclaimTicket } from '../api/tickets';
import { composeTicketResponse } from './providers';
import { localTabId } from './registry';

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
