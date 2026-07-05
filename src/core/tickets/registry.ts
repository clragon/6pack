import { openChannel } from '../tabs/channel';
import type { TicketResponse } from './providers';

export interface OpenTicket {
  tabId: string;
  ticketId: number;
  status: string;
  accused: { id: number; name: string } | null;
  claimant: { id: number; name: string } | null;
  responses: TicketResponse[];
  canHandle: boolean;
}

type Message =
  | { kind: 'announce'; ticket: OpenTicket }
  | { kind: 'leave'; tabId: string }
  | { kind: 'poll' };

const POLL_WINDOW_MS = 250;

export const localTabId = crypto.randomUUID();

const channel = openChannel<Message>('tickets');

const known = new Map<string, OpenTicket>();
let localTicket: Omit<OpenTicket, 'responses'> | null = null;
let localResponses: () => TicketResponse[] = () => [];

function currentLocal(): OpenTicket | null {
  return localTicket ? { ...localTicket, responses: localResponses() } : null;
}

function announce(): void {
  const ticket = currentLocal();
  if (ticket) channel.post({ kind: 'announce', ticket });
}

const listeners = new Set<() => void>();
function emit(): void {
  for (const listener of listeners) listener();
}

let pollToken = 0;
let seenThisPoll: Set<string> | null = null;

channel.subscribe((message) => {
  if (message.kind === 'announce') {
    known.set(message.ticket.tabId, message.ticket);
    seenThisPoll?.add(message.ticket.tabId);
    emit();
  } else if (message.kind === 'leave') {
    if (known.delete(message.tabId)) emit();
  } else if (message.kind === 'poll') {
    announce();
  }
});

export function publishOpenTicket(
  ticket: Omit<OpenTicket, 'tabId' | 'responses'>,
  responses: () => TicketResponse[],
): void {
  localTicket = { ...ticket, tabId: localTabId };
  localResponses = responses;
  announce();
  window.addEventListener('beforeunload', () => {
    channel.post({ kind: 'leave', tabId: localTabId });
  });
}

export function refreshOpenTickets(): void {
  const token = (pollToken += 1);
  const seen = new Set<string>();
  seenThisPoll = seen;
  channel.post({ kind: 'poll' });
  setTimeout(() => {
    if (token !== pollToken) return;
    seenThisPoll = null;
    let changed = false;
    for (const tabId of [...known.keys()]) {
      if (!seen.has(tabId)) {
        known.delete(tabId);
        changed = true;
      }
    }
    if (changed) emit();
  }, POLL_WINDOW_MS);
}

export function openTickets(): OpenTicket[] {
  const byTicket = new Map<number, OpenTicket>();
  const local = currentLocal();
  const all = local ? [local, ...known.values()] : [...known.values()];
  for (const ticket of all) {
    const existing = byTicket.get(ticket.ticketId);
    if (!existing || (ticket.canHandle && !existing.canHandle)) {
      byTicket.set(ticket.ticketId, ticket);
    }
  }
  return [...byTicket.values()];
}

export function subscribeOpenTickets(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
