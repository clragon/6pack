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
  description: 'Lets you claim or close a ticket that is open in another tab.',
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
