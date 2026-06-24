import type { Action } from '../core/actions/types';
import { addons } from '../core/addons/manager';
import { CATALOG } from '../core/addons/catalog';

// Hidden until searched. Lists known add-ons as switches; flipping one installs
// it (fetch + load now) or removes it (tear down now). State persists, so an
// enabled add-on loads on its own next visit.
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
        // Installing/removing is a deliberate act: only reachable by drilling into
        // Add-ons, never surfaced or run from the root via reach-in.
        submenuOnly: true,
        checked: () => addons.isEnabled(entry.id),
        run: () => {
          if (addons.isEnabled(entry.id)) addons.disable(entry.id);
          else addons.enable(entry);
        },
      })),
  },
];
