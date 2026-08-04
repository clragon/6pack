import type { SixpackAddon } from '../../core/addons/types';
import { navActions } from './actions';
import { mountBar } from './bar';

// Inbuilt: compiled into 6pack itself rather than fetched as an artifact, so it
// may import core directly (see core/addons/inbuilt). Enabling it takes over
// e621's ribbon; disabling returns the ribbon, though its commands linger in the
// registry until the page reloads.
export const navbarAddon: SixpackAddon = {
  id: 'navbar',
  name: 'Navbar',
  description: 'Put your own links in the top bar',
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
