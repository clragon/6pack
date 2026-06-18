import type { Action } from '../core/actions/types';
import { settings } from '../core/settings';
import { captureStore } from '../core/palette/store';

export const settingsActions: Action[] = [
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure 6pack',
    keywords: ['settings', 'preferences', 'config', 'options'],
    hidden: true,
    weight: -1,
    submenu: () => [
      {
        id: 'settings.shortenSources',
        title: 'Shorten source links',
        description: 'Collapse known platform source links to their key detail',
        keywords: ['source', 'sources', 'link', 'links', 'shorten', 'short'],
        checked: () => settings.get('shortenSources'),
        run: () => {
          settings.toggle('shortenSources');
        },
      },
      {
        id: 'palette.rebind',
        title: 'Change palette hotkey',
        description: 'Press a new key combination to open this palette',
        keywords: ['hotkey', 'shortcut', 'keybind', 'rebind', 'trigger'],
        run: () => {
          captureStore.set(true);
        },
      },
    ],
  },
];
