import type { Action } from '../../core/actions/types';
import type { SixpackAddon } from '../../core/addons/types';
import type {
  TicketResponseOption,
  TicketResponseProvider,
} from '../../core/tickets/providers';
import { ticketContext, type ReplyContext } from './context';
import { openManager } from './manager';
import { mountStrip } from './strip';
import { substitute } from './variables';

// Expands the template against its context and drops it into the field, letting
// e621's field listeners react via a synthetic input event.
function insertTemplate(context: ReplyContext, body: string): void {
  const field = context.field();
  if (!field) return;
  field.value = substitute(body, context.variables);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.focus();
}

const store = ticketContext.store;
const hasField = (): boolean => ticketContext.field() !== null;

// Palette mirror of the on-page strip: pick a saved reply to drop into the
// response box. Just the replies, nothing about managing them.
const insertReply: Action = {
  id: 'ticket.replies',
  title: 'Quick replies',
  description: 'Insert a saved response',
  keywords: ['template', 'templates', 'response', 'reply', 'macro', 'canned'],
  weight: 1,
  when: hasField,
  submenu: () =>
    store.list().map(({ id, title, body }) => ({
      id: `ticket.replies.use:${id}`,
      title: title || '(untitled)',
      run: () => insertTemplate(ticketContext, body),
    })),
};

const manageReplies: Action = {
  id: 'ticket.replies.manage',
  title: 'Manage quick replies',
  description: 'Edit, pin, import, or export your saved responses',
  keywords: ['manage', 'edit', 'new', 'pin', 'import', 'export'],
  when: hasField,
  run: () => openManager(ticketContext),
};

const saveReply: Action = {
  id: 'ticket.replies.save',
  title: 'Save response as reply',
  description: 'Turn the response you wrote into a saved reply',
  keywords: ['save', 'new', 'add', 'capture'],
  when: hasField,
  run: () => {
    const body = ticketContext.field()?.value.trim();
    openManager(ticketContext, body || undefined);
  },
};

// Offers the saved replies as ticket close responses; compose expands a template
// against this ticket, the same text the strip would insert.
const provider: TicketResponseProvider = {
  id: 'quick-replies',
  list: (): TicketResponseOption[] =>
    store.list().map((t) => ({ id: t.id, title: t.title || '(untitled)' })),
  compose: (optionId) => {
    const template = store.list().find((t) => t.id === optionId);
    return template ? substitute(template.body, ticketContext.variables) : null;
  },
};

export const quickRepliesAddon: SixpackAddon = {
  id: 'quick-replies',
  name: 'Quick Replies',
  when: (page) => page.kind === 'ticket',
  actions: [insertReply, manageReplies, saveReply],
  ticketResponses: provider,
  setup: (ctx) => {
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      teardown = mountStrip(ticketContext);
    });
    return () => teardown?.();
  },
};
