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

// Turns the cross-tab open-ticket registry into palette chips. Opening a chip
// lists its answer templates; choosing one confirms, then asks the owning tab to
// compose the faithful response and close, reporting the outcome.

function closeActions(ticket: OpenTicket): Action[] {
  if (ticket.templates.length === 0) {
    return [
      {
        id: `chip.ticket.${ticket.ticketId}.empty`,
        title: 'No templates on the ticket tab',
        run: () => {},
      },
    ];
  }
  return ticket.templates.map((template, index) => ({
    id: `chip.ticket.${ticket.ticketId}.close.${index}`,
    title: `Close: ${template.title}`,
    keywords: ['close', 'ticket', 'template', template.title],
    run: async ({ close }) => {
      const ok = await openConfirm({
        title: `Close ticket #${ticket.ticketId} with "${template.title}"?`,
        confirmLabel: 'Close',
      });
      if (!ok) return;
      close();
      const fire = progress(`Closing ticket #${ticket.ticketId}…`);
      try {
        await requestClose(ticket.tabId, ticket.ticketId, index);
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
