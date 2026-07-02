import type { Action } from '../actions/types';
import { registerChipSource, type Chip } from '../palette/chips';
import { openConfirm } from '../palette/confirm';
import { notifyError, progress } from '../../site/toast';
import { requestClose } from './commands';
import {
  openTickets,
  refreshOpenTickets,
  subscribeOpenTickets,
  type OpenTicket,
} from './registry';

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
      { label: 'Status', value: ticket.status },
    ],
    open: () => closeActions(ticket),
  };
}

export function installTicketChips(): void {
  registerChipSource({
    list: () => openTickets().map(toChip),
    subscribe: subscribeOpenTickets,
    refresh: refreshOpenTickets,
  });
}
