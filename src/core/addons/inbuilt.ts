import type { SixpackAddon } from './types';
import { burnAddon } from '../../addons/burn';
import { navbarAddon } from '../../addons/navbar';

interface InbuiltAddon {
  addon: SixpackAddon;
  description: string;
  default?: boolean;
}

export const INBUILT: InbuiltAddon[] = [
  {
    addon: burnAddon,
    description:
      'Select comments, forum posts and users, then act on them together',
    default: true,
  },
  { addon: navbarAddon, description: 'Put your own links in the top bar' },
];

export function inbuiltAddon(id: string): SixpackAddon | undefined {
  return INBUILT.find((entry) => entry.addon.id === id)?.addon;
}
