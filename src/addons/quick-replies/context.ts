import { createStore, type ReplyStore } from './store';
import {
  seedAppealReplies,
  seedDmailReplies,
  seedTicketReplies,
} from './seeds';
import {
  APPEAL_VARIABLES,
  DMAIL_VARIABLES,
  TICKET_VARIABLES,
  type TemplateVariable,
} from './variables';

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

export const appealContext: ReplyContext = {
  id: 'appeal',
  label: 'Quick appeals',
  manageTitle: 'Manage quick appeals',
  exportName: 'quick-appeals.json',
  addLabel: 'New reply',
  emptyHint: 'Select a reply, or add a new one.',
  bodyPlaceholder: 'Body. Click a variable below to insert it.',
  store: createStore('sp.quick-replies.appeal', seedAppealReplies),
  variables: APPEAL_VARIABLES,
  field: () =>
    document.querySelector<HTMLTextAreaElement>(
      "textarea[name='appeal[response]']",
    ),
};

export const dmailContext: ReplyContext = {
  id: 'dmail',
  label: 'Quick dmails',
  manageTitle: 'Manage quick dmails',
  exportName: 'quick-dmails.json',
  addLabel: 'New dmail',
  emptyHint: 'Select a template, or add a new one.',
  bodyPlaceholder: 'Body. Click a variable below to insert it.',
  store: createStore('sp.quick-replies.dmail', seedDmailReplies),
  variables: DMAIL_VARIABLES,
  field: () =>
    document.querySelector<HTMLTextAreaElement>(
      "form.new_dmail textarea[name='dmail[body]']",
    ),
};
