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
      ...settings.specs().map(
        (spec): Action => ({
          id: `settings.${spec.key}`,
          title: spec.label,
          description: spec.description,
          keywords: spec.keywords,
          checked: () => settings.get(spec.key),
          run: () => {
            settings.toggle(spec.key);
          },
        }),
      ),
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
