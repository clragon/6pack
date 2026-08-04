import type { SixpackAddon } from '../../core/addons/types';
import { navActions } from './actions';
import { mountBar } from './bar';

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
