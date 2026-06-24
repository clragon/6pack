import type { Action } from '../core/actions/types';
import { addons } from '../core/addons/manager';
import { CATALOG } from '../core/addons/catalog';

export const addonsActions: Action[] = [
  {
    id: 'addons',
    title: 'Add-ons',
    description: 'Install and manage add-ons',
    keywords: [
      'addon',
      'addons',
      'extension',
      'extensions',
      'plugin',
      'install',
    ],
    hidden: true,
    weight: -1,
    submenu: () =>
      CATALOG.map((entry) => ({
        id: `addons.${entry.id}`,
        title: entry.name,
        description: entry.description,
        submenuOnly: true,
        checked: () => addons.isEnabled(entry.id),
        run: () => {
          if (addons.isEnabled(entry.id)) addons.disable(entry.id);
          else addons.enable(entry);
        },
      })),
  },
];
