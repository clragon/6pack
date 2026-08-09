import type { SixpackAddon } from '../../core/addons/types';
import { listTicketResponses } from '../../core/tickets/providers';
import {
  canComposeResponse,
  prefetchReportedDestination,
  readAccused,
  readClaimant,
  readTicketStatus,
} from '../../site/ticket';
import { ticketActions } from './actions';
import { installTicketChips } from './chipSource';
import { installTicketCommandHandler } from './commands';
import { publishOpenTicket } from './registry';

export const ticketsAddon: SixpackAddon = {
  id: 'tickets',
  name: 'Tickets',
  description:
    'A ticket open in one tab is reachable from every other tab: the palette lists it as a chip, and it can be claimed, unclaimed or closed from wherever the user is. Closing composes the reply on the tab that holds the ticket, drawing on the responses every add-on offers. On a ticket itself, the reported content resolves ahead of the click, and the accused is one command away from their own activity.',
  actions: ticketActions,
  setup: (ctx) => {
    ctx.whenReady(() => {
      installTicketChips();

      const page = ctx.page;
      if (page.kind !== 'ticket') return;
      prefetchReportedDestination();

      if (!canComposeResponse()) return;
      const status = readTicketStatus();
      if (status === 'approved') return;
      publishOpenTicket(
        {
          ticketId: page.id,
          status: status ?? 'pending',
          accused: readAccused(),
          claimant: readClaimant(),
          canHandle: true,
        },
        () => listTicketResponses(),
      );
      installTicketCommandHandler();
    });
  },
};
