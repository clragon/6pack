import type { SixpackAddon } from './types';
import { flamethrowerAddon } from '../../addons/flamethrower';
import { navbarAddon } from '../../addons/navbar';
import { ticketsAddon } from '../../addons/tickets';

// 6pack itself, wearing the add-on contract so its actions, settings and DOM
// lifecycle travel the one path everything else does. No catalog entry, so no
// switch, no stored state and no unload. The Help manual still lists it.
export const ESSENTIAL: SixpackAddon[] = [ticketsAddon];

// An add-on compiled into 6pack, paired with the one-line pitch the add-on list
// shows. The pitch is held here because `SixpackAddon.description` carries the
// manual, which runs to a paragraph; manifest.json draws the same line for a
// managed add-on.
interface InbuiltAddon {
  addon: SixpackAddon;
  description: string;
  // Whether a fresh user starts with it on, as manifest.json carries for a
  // managed add-on.
  default?: boolean;
}

// Compiled in, so present in every build and registered straight through the
// host with no artifact to fetch. Being compiled in lets them import core
// directly rather than reaching it through the bridge.
export const INBUILT: InbuiltAddon[] = [
  {
    addon: flamethrowerAddon,
    description:
      'Select comments, forum posts and users, then act on them together',
    default: true,
  },
  { addon: navbarAddon, description: 'Put your own links in the top bar' },
];

export function inbuiltAddon(id: string): SixpackAddon | undefined {
  return INBUILT.find((entry) => entry.addon.id === id)?.addon;
}
