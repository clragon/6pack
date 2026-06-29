import type { Action } from '../core/actions/types';
import { navigateTo } from '../core/navigate';
import { navDefaults } from '../core/nav/defaults';
import {
  isHidden,
  listEntries,
  removeEntry,
  setHidden,
  upsertEntry,
} from '../core/nav/store';
import { openConfirm } from '../core/palette/confirm';
import { currentUser } from '../site/user';
import { notify } from '../site/toast';

// Reduce a same-origin URL to its path; a relative or foreign-origin URL is
// returned unchanged.
function toPath(url: string): string {
  try {
    const u = new URL(url, location.origin);
    return u.origin === location.origin ? u.pathname + u.search + u.hash : url;
  } catch {
    return url;
  }
}

function jumpChildren(): Action[] {
  const user = currentUser();
  const children: Action[] = [];

  for (const dest of navDefaults) {
    if (isHidden(dest.slug)) continue;
    const url = dest.url(user);
    if (url === null) continue;
    children.push({
      id: `nav.go.${dest.slug}`,
      title: dest.title,
      description: toPath(url),
      keywords: dest.keywords,
      run: () => navigateTo(url),
    });
  }

  for (const [url, label] of Object.entries(listEntries())) {
    children.push({
      id: `nav.go:${url}`,
      title: label,
      description: toPath(url),
      run: () => navigateTo(url),
    });
  }

  return children;
}

export const jumpTo: Action = {
  id: 'nav.jump-to',
  title: 'Jump to',
  description: 'Go to a place on the site',
  keywords: ['jump', 'go', 'goto', 'navigate', 'nav', 'open'],
  weight: 1,
  submenu: () => jumpChildren(),
};

const pinThisPage: Action = {
  id: 'nav.pin',
  title: 'Pin this page',
  description: 'Save this page as a jump',
  keywords: ['pin', 'save', 'add', 'bookmark', 'current'],
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
    upsertEntry(url, label);
    notify(`Pinned ${label}`);
  },
};

function entryGroup(url: string, label: string): Action {
  return {
    id: `nav.manage:${url}`,
    title: label,
    submenu: () => [
      {
        id: `nav.manage.edit:${url}`,
        title: 'Edit',
        keywords: ['edit', 'rename', 'change'],
        run: async () => {
          const result = await openConfirm({
            title: 'Edit jump',
            confirmLabel: 'Save',
            fields: [
              { key: 'label', label: 'Name', value: label },
              { key: 'url', label: 'URL', value: url },
            ],
          });
          if (!result) return;
          const raw = result.fields.url.trim();
          if (!raw) return;
          const nextUrl = toPath(raw);
          const nextLabel = result.fields.label.trim() || nextUrl;
          // URL is the identity: a changed URL drops the old key and writes anew.
          if (nextUrl !== url) removeEntry(url);
          upsertEntry(nextUrl, nextLabel);
          notify(`Saved ${nextLabel}`);
        },
      },
      {
        id: `nav.manage.remove:${url}`,
        title: 'Remove',
        keywords: ['remove', 'delete', 'unpin'],
        run: async () => {
          const result = await openConfirm({
            title: `Remove ${label}?`,
            detail: url,
            confirmLabel: 'Remove',
          });
          if (!result) return;
          removeEntry(url);
          notify(`Removed ${label}`);
        },
      },
    ],
  };
}

// On/off toggles for the built-in destinations; off hides one from the jump list.
// Only entries applicable to the current user appear.
const catalog: Action = {
  id: 'nav.manage.catalog',
  title: 'Catalog',
  description: 'Show or hide built-in jumps',
  keywords: ['catalog', 'built-in', 'builtin', 'defaults', 'show', 'hide'],
  submenu: () => {
    const user = currentUser();
    const items: Action[] = [];
    for (const dest of navDefaults) {
      const url = dest.url(user);
      if (url === null) continue;
      items.push({
        id: `nav.catalog:${dest.slug}`,
        title: dest.title,
        description: toPath(url),
        keywords: dest.keywords,
        checked: () => !isHidden(dest.slug),
        run: () => setHidden(dest.slug, !isHidden(dest.slug)),
      });
    }
    return items;
  },
};

export const manageJumps: Action = {
  id: 'nav.manage',
  title: 'Manage jumps',
  description: 'Pin this page, or edit your saved jumps',
  keywords: [
    'manage',
    'jumps',
    'pin',
    'edit',
    'bookmark',
    'save',
    'jump',
    'catalog',
    'built-in',
  ],
  submenu: () => [
    pinThisPage,
    ...Object.entries(listEntries()).map(([url, label]) =>
      entryGroup(url, label),
    ),
    catalog,
  ],
};
