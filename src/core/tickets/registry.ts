import { openChannel } from '../tabs/channel';
import type { TicketResponse } from './providers';

// A live view of the tickets open in the user's other e621 tabs, so a palette on
// any page can surface them as chips and act on them. Each tab that sits on a
// ticket page publishes itself; every tab keeps a reconciled map of what the
// others published. Reactive in the burnPile mould so the chip row re-renders the
// instant the set changes.
//
// Liveness is poll/announce, not heartbeats: a backgrounded tab throttles its
// timers (so a heartbeat would make a live tab look dead) but still runs message
// handlers, so we ask everyone to re-announce and treat silence as gone.

export interface OpenTicket {
  // Unique per tab/page-load; the address a close command is routed to.
  tabId: string;
  ticketId: number;
  // pending | partial | approved. Lets the chip skip an already-closed ticket.
  status: string;
  accused: { id: number; name: string } | null;
  claimant: { id: number; name: string } | null;
  responses: TicketResponse[];
  // The viewer can compose and close here (the response field is present). A tab
  // that only views the ticket still announces, but cannot be a close target.
  canHandle: boolean;
}

type Message =
  | { kind: 'announce'; ticket: OpenTicket }
  | { kind: 'leave'; tabId: string }
  | { kind: 'poll' };

// Window to gather announces after a poll before pruning the silent.
const POLL_WINDOW_MS = 250;

export const localTabId = crypto.randomUUID();

const channel = openChannel<Message>('tickets');

// Tickets others have announced, keyed by their tabId. Never holds our own.
const known = new Map<string, OpenTicket>();
// This tab's published ticket. Responses are read live (a provider can register
// after publish), so they are held apart and re-read on each announce.
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

// Only the latest poll's timer reconciles, so overlapping refreshes can't prune
// announces that arrived for a newer poll.
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

// Publish this tab's ticket and keep answering polls for it until the page goes
// away. Called once on a ticket page after the metadata is read.
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

// Ask every tab to re-announce, then drop any previously-known ticket that stayed
// silent (its tab closed or froze). Called when the palette opens.
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

// The open tickets worth showing as chips: this tab's own ticket plus the others',
// deduped by ticket id. The local copy is listed first so it wins the dedup, since
// it can close in-process without a cross-tab round trip.
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
