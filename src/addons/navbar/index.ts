import type { SixpackAddon } from '../../core/addons/types';
import { navActions } from './actions';
import { mountBar } from './bar';

export const navbarAddon: SixpackAddon = {
  id: 'navbar',
  name: 'Navbar',
  description:
    "The top bar is assembled from a list the user maintains, each entry carrying a name and an icon. An entry retained without being pinned stays off the bar and remains reachable by name from the palette. An entry may address the signed-in account's own uploads or favorites.",
  actions: navActions,
  setup: (ctx) => {
    let disposed = false;
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      if (!disposed) teardown = mountBar();
    });
    return () => {
      disposed = true;
      teardown?.();
    };
  },
};
