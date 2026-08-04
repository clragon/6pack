import type { SixpackAddon } from './types';
import { navbarAddon } from '../../addons/navbar';

interface InbuiltAddon {
  addon: SixpackAddon;
  description: string;
}

export const INBUILT: InbuiltAddon[] = [
  { addon: navbarAddon, description: 'Put your own links in the top bar' },
];

export function inbuiltAddon(id: string): SixpackAddon | undefined {
  return INBUILT.find((entry) => entry.addon.id === id)?.addon;
}
