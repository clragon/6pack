import { createListStore, type ListItem } from '../../core/store';
import { seedEntries } from './seeds';

// A destination the user keeps: shown in the top bar when pinned, and in the
// palette's jump list otherwise. `url` may carry %username% / %userid%,
// expanded at render time.
export interface NavEntry extends ListItem {
  url: string;
  // Key into the icon catalog, where an unknown or absent key falls back to the
  // link glyph.
  icon?: string;
}

// Pinned entries lead the list, in bar order. The rest trail in no order that
// matters, since the palette ranks them by use.
export const navStore = createListStore<NavEntry>(
  'sp.navbar.entries',
  seedEntries,
  { hoistPinned: true },
);
