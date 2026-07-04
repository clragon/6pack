import { createStore, type ReplyStore } from './store';
import { seedTicketReplies } from './seeds';
import { TICKET_VARIABLES, type TemplateVariable } from './variables';

export interface ReplyContext {
  id: string;
  label: string;
  manageTitle: string;
  exportName: string;
  addLabel: string;
  emptyHint: string;
  bodyPlaceholder: string;
  store: ReplyStore;
  variables: TemplateVariable[];
  field: () => HTMLTextAreaElement | null;
}

export const ticketContext: ReplyContext = {
  id: 'ticket',
  label: 'Quick replies',
  manageTitle: 'Manage quick replies',
  exportName: 'quick-replies.json',
  addLabel: 'New reply',
  emptyHint: 'Select a reply, or add a new one.',
  bodyPlaceholder: 'Body. Click a variable below to insert it.',
  store: createStore('sp.quick-replies.ticket', seedTicketReplies),
  variables: TICKET_VARIABLES,
  field: () =>
    document.querySelector<HTMLTextAreaElement>(
      "textarea[name='ticket[response]']",
    ),
};
