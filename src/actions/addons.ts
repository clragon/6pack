import type { Action } from '../core/actions/types';
import { addons } from '../core/addons/manager';
import { CATALOG } from '../core/addons/catalog';

// Hidden until searched. Lists known add-ons as switches, where flipping one
// installs it (load now) or removes it (tear down now). State persists, so an
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
      CATALOG.map((entry) => {
        // An add-on that is on but not running says so in place of its pitch,
        // which is otherwise the only sign that the switch and reality differ.
        const failure = addons.failure(entry.id);
        return {
          id: `addons.${entry.id}`,
          title: entry.name,
          description: failure ? `Not loaded: ${failure}` : entry.description,
          submenuOnly: true,
          checked: () => addons.isEnabled(entry.id),
          run: () => {
            if (addons.isEnabled(entry.id)) addons.disable(entry.id);
            else addons.enable(entry);
          },
        };
      }),
  },
];
