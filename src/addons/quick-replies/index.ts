import { h, render } from 'preact';
import { Flame } from 'lucide-preact';

import type { Action } from '../../core/actions/types';
import type { SixpackAddon } from '../../core/addons/types';
import type {
  TicketResponseOption,
  TicketResponseProvider,
} from '../../core/tickets/providers';
import { ensureStyles, openTemplatesManager } from './manager';
import { listTemplates, pinnedTemplates, subscribe } from './store';
import { substitute } from './variables';

const RESPONSE_FIELD = "textarea[name='ticket[response]']";

function responseField(): HTMLTextAreaElement | null {
  return document.querySelector<HTMLTextAreaElement>(RESPONSE_FIELD);
}

function insertTemplate(body: string): void {
  const field = responseField();
  if (!field) return;
  field.value = substitute(body);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.focus();
}

function captureResponse(): void {
  const body = responseField()?.value.trim();
  openTemplatesManager(body || undefined);
}

function mountStrip(): () => void {
  const field = responseField();
  const anchor = field?.closest('.dtext-formatter') ?? field;
  if (!anchor) return () => {};

  ensureStyles();
  const strip = document.createElement('div');
  strip.className = 'qr-strip';
  anchor.insertAdjacentElement('afterend', strip);

  let expanded = false;

  const draw = () => {
    strip.replaceChildren();
    const shown = expanded ? listTemplates() : pinnedTemplates();
    for (const template of shown) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'qr-strip-btn';
      button.textContent = template.title || '(untitled)';
      button.title = 'Insert this reply';
      button.addEventListener('click', () => insertTemplate(template.body));
      strip.append(button);
    }

    if (listTemplates().length > pinnedTemplates().length) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'qr-strip-more';
      more.textContent = expanded ? 'Less' : 'More';
      more.addEventListener('click', () => {
        expanded = !expanded;
        draw();
      });
      strip.append(more);
    }

    const flame = document.createElement('button');
    flame.type = 'button';
    flame.className = 'qr-strip-flame';
    flame.title = 'Manage';
    const icon = document.createElement('span');
    icon.style.display = 'inline-flex';
    render(h(Flame, { size: 16, fill: 'currentColor' }), icon);
    flame.appendChild(icon);
    const label = document.createElement('span');
    label.textContent = 'Quick replies';
    flame.appendChild(label);
    flame.addEventListener('click', () => openTemplatesManager());
    strip.append(flame);
  };

  draw();
  const unsubscribe = subscribe(draw);
  return () => {
    unsubscribe();
    strip.remove();
  };
}

const insertReply: Action = {
  id: 'ticket.replies',
  title: 'Quick replies',
  description: 'Insert a saved response',
  keywords: ['template', 'templates', 'response', 'reply', 'macro', 'canned'],
  weight: 1,
  when: () => responseField() !== null,
  submenu: () =>
    listTemplates().map(({ id, title, body }) => ({
      id: `ticket.replies.use:${id}`,
      title: title || '(untitled)',
      run: () => insertTemplate(body),
    })),
};

const manageReplies: Action = {
  id: 'ticket.replies.manage',
  title: 'Manage quick replies',
  description: 'Edit, pin, import, or export your saved responses',
  keywords: ['manage', 'edit', 'new', 'pin', 'import', 'export'],
  when: () => responseField() !== null,
  run: () => openTemplatesManager(),
};

const saveReply: Action = {
  id: 'ticket.replies.save',
  title: 'Save response as reply',
  description: 'Turn the response you wrote into a saved reply',
  keywords: ['save', 'new', 'add', 'capture'],
  when: () => responseField() !== null,
  run: captureResponse,
};

const provider: TicketResponseProvider = {
  id: 'quick-replies',
  list: (): TicketResponseOption[] =>
    listTemplates().map((t) => ({ id: t.id, title: t.title || '(untitled)' })),
  compose: (optionId) => {
    const template = listTemplates().find((t) => t.id === optionId);
    return template ? substitute(template.body) : null;
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
      teardown = mountStrip();
    });
    return () => teardown?.();
  },
};
