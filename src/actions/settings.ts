import type { Action } from '../core/actions/types';
import { captureStore } from '../core/palette/store';

export const settingsActions: Action[] = [
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure the palette',
    keywords: ['settings', 'preferences', 'config', 'options'],
    hidden: true,
    weight: -1,
    submenu: () => [
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
