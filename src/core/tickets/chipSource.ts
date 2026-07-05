import type { Action } from '../actions/types';
import { registerChipSource, type Chip } from '../palette/chips';
import { openConfirm } from '../palette/confirm';
import { notifyError, progress } from '../../site/toast';
import { currentUserId } from '../../site/user';
import { requestClaim, requestClose, requestUnclaim } from './commands';
import {
  openTickets,
  refreshOpenTickets,
  subscribeOpenTickets,
  type OpenTicket,
} from './registry';

// Turns the cross-tab open-ticket registry into palette chips. Opening a chip
// lists its answer templates; choosing one confirms, then asks the owning tab to
// compose the faithful response and close, reporting the outcome.

function opAction(
  ticket: OpenTicket,
  verb: 'Claim' | 'Unclaim',
  request: (tabId: string, ticketId: number) => Promise<void>,
): Action {
  return {
    id: `chip.ticket.${ticket.ticketId}.${verb.toLowerCase()}`,
    title: `${verb} ticket`,
    keywords: [verb.toLowerCase(), 'ticket', 'claim'],
    run: async ({ close }) => {
      close();
      const fire = progress(`${verb}ing ticket #${ticket.ticketId}…`);
      try {
        await request(ticket.tabId, ticket.ticketId);
        fire.finish(`${verb}ed ticket #${ticket.ticketId}.`);
      } catch (error) {
        fire.finish(
          `Could not ${verb.toLowerCase()} ticket #${ticket.ticketId}.`,
        );
        notifyError(error instanceof Error ? error.message : `${verb} failed`);
      }
    },
  };
}

function claimActions(ticket: OpenTicket): Action[] {
  const me = currentUserId();
  if (ticket.claimant === null)
    return [opAction(ticket, 'Claim', requestClaim)];
  if (me !== null && ticket.claimant.id === me)
    return [opAction(ticket, 'Unclaim', requestUnclaim)];
  return [];
}

function closeActions(ticket: OpenTicket): Action[] {
  if (ticket.responses.length === 0) {
    return [
      {
        id: `chip.ticket.${ticket.ticketId}.empty`,
        title: 'No responses on the ticket tab',
        run: () => {},
      },
    ];
  }
  return ticket.responses.map((response) => ({
    id: `chip.ticket.${ticket.ticketId}.close.${response.providerId}.${response.optionId}`,
    title: `Close: ${response.title}`,
    keywords: ['close', 'ticket', 'template', response.title],
    run: async ({ close }) => {
      const ok = await openConfirm({
        title: `Close ticket #${ticket.ticketId} with "${response.title}"?`,
        confirmLabel: 'Close',
      });
      if (!ok) return;
      close();
      const fire = progress(`Closing ticket #${ticket.ticketId}…`);
      try {
        await requestClose(
          ticket.tabId,
          ticket.ticketId,
          response.providerId,
          response.optionId,
        );
        fire.finish(`Closed ticket #${ticket.ticketId}.`);
      } catch (error) {
        fire.finish(`Could not close ticket #${ticket.ticketId}.`);
        notifyError(error instanceof Error ? error.message : 'Close failed');
      }
    },
  }));
}

function toChip(ticket: OpenTicket): Chip {
  return {
    id: `chip.ticket.${ticket.ticketId}`,
    label: `Ticket #${ticket.ticketId}`,
    info: [
      ...(ticket.accused
        ? [{ label: 'Accused', value: ticket.accused.name }]
        : []),
      ...(ticket.claimant
        ? [{ label: 'Claimed by', value: ticket.claimant.name }]
        : []),
      { label: 'Status', value: ticket.status },
    ],
    open: () => [...claimActions(ticket), ...closeActions(ticket)],
  };
}

export function installTicketChips(): void {
  registerChipSource({
    list: () => openTickets().map(toChip),
    subscribe: subscribeOpenTickets,
    refresh: refreshOpenTickets,
  });
}
