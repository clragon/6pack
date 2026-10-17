import type { Action } from '../../core/actions/types';
import type { SixpackAddon } from '../../core/addons/types';
import type {
  TicketResponseOption,
  TicketResponseProvider,
} from '../../core/tickets/providers';
import {
  appealContext,
  dmailContext,
  ticketContext,
  type ReplyContext,
} from './context';
import { openManager } from './manager';
import { mountStrip } from './strip';
import { substitute } from './variables';

const CONTEXTS = [ticketContext, appealContext, dmailContext];

const onReplyPage = (): boolean =>
  /^\/tickets\/\d+/.test(location.pathname) ||
  /^\/appeals\/\d+/.test(location.pathname) ||
  location.pathname === '/dmails/new';

const activeContext = (): ReplyContext | undefined =>
  CONTEXTS.find((c) => c.field() !== null);

function insertTemplate(context: ReplyContext, body: string): void {
  const field = context.field();
  if (!field) return;
  field.value = substitute(body, context.variables);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.focus();
}

function makeActions(context: ReplyContext): Action[] {
  const here = (): boolean => context.field() !== null;
  return [
    {
      id: `${context.id}.replies`,
      title: context.label,
      description: 'Insert a saved template',
      keywords: [
        'template',
        'templates',
        'response',
        'reply',
        'macro',
        'canned',
      ],
      weight: 1,
      when: here,
      submenu: () =>
        context.store.list().map(({ id, title, body }) => ({
          id: `${context.id}.replies.use:${id}`,
          title: title || '(untitled)',
          run: () => insertTemplate(context, body),
        })),
    },
    {
      id: `${context.id}.replies.manage`,
      title: context.manageTitle,
      description: 'Edit, pin, import, or export your saved templates',
      keywords: ['manage', 'edit', 'new', 'pin', 'import', 'export'],
      when: here,
      run: () => openManager(context),
    },
    {
      id: `${context.id}.replies.save`,
      title: 'Save as template',
      description: 'Turn what you wrote into a saved template',
      keywords: ['save', 'new', 'add', 'capture'],
      when: here,
      run: () => {
        const body = context.field()?.value.trim();
        openManager(context, body || undefined);
      },
    },
  ];
}

const provider: TicketResponseProvider = {
  id: 'quick-replies',
  list: (): TicketResponseOption[] =>
    ticketContext.store
      .list()
      .map((t) => ({ id: t.id, title: t.title || '(untitled)' })),
  compose: (optionId) => {
    const template = ticketContext.store.list().find((t) => t.id === optionId);
    return template ? substitute(template.body, ticketContext.variables) : null;
  },
};

export const quickRepliesAddon: SixpackAddon = {
  id: 'quick-replies',
  name: 'Quick Replies',
  description: 'Saved replies for tickets, appeals and dmails.',
  when: onReplyPage,
  actions: CONTEXTS.flatMap(makeActions),
  ticketResponses: provider,
  setup: (ctx) => {
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      const context = activeContext();
      if (context) teardown = mountStrip(context);
    });
    return () => teardown?.();
  },
};
