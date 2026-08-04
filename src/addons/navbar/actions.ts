import type { Action } from '../../core/actions/types';
import { navigateTo } from '../../core/navigate';
import { openConfirm } from '../../core/palette/confirm';
import { notify } from '../../site/toast';
import { MANAGER_TITLE, openNavManager } from './manager';
import { expand } from './resolve';
import { addEntry, listEntries } from './store';
import { toPath } from './url';

const jumpTo: Action = {
  id: 'nav.jump-to',
  title: 'Jump to',
  description: 'Go to a place on the site',
  keywords: ['jump', 'go', 'goto', 'navigate', 'nav', 'open'],
  weight: 1,
  submenu: () =>
    listEntries().map((entry) => ({
      id: `nav.go:${entry.id}`,
      title: entry.title || entry.url,
      description: toPath(expand(entry.url)),
      run: () => navigateTo(expand(entry.url)),
    })),
};

const pinThisPage: Action = {
  id: 'nav.pin',
  title: 'Pin this page',
  description: 'Put this page in the top bar',
  keywords: ['pin', 'save', 'add', 'bookmark', 'current', 'bar', 'tab'],
  run: async () => {
    const result = await openConfirm({
      title: 'Pin this page',
      confirmLabel: 'Pin',
      fields: [
        { key: 'label', label: 'Name', value: document.title },
        { key: 'url', label: 'URL', value: toPath(location.href) },
      ],
    });
    if (!result) return;
    const raw = result.fields.url.trim();
    if (!raw) return;
    const url = toPath(raw);
    const label = result.fields.label.trim() || url;
    addEntry(label, url, true);
    notify(`Pinned ${label}`);
  },
};

const manageJumps: Action = {
  id: 'nav.manage',
  title: MANAGER_TITLE,
  description: 'Edit the top bar and your saved jumps',
  keywords: [
    'manage',
    'jumps',
    'nav',
    'navbar',
    'bar',
    'tabs',
    'edit',
    'bookmark',
    'pin',
    'reorder',
  ],
  run: () => openNavManager(),
};

export const navActions: Action[] = [jumpTo, pinThisPage, manageJumps];
