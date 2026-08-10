import { createListStore, type ListItem } from '../../core/store';
import { seedEntries } from './seeds';

export interface NavEntry extends ListItem {
  url: string;
  icon?: string;
}

export const navStore = createListStore<NavEntry>(
  'sp.navbar.entries',
  seedEntries,
  { hoistPinned: true },
);
