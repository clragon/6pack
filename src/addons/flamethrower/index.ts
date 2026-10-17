import type { SixpackAddon } from '../../core/addons/types';
import { burnable } from './actions';
import { installMassBanChip } from './banChip';
import { captureBanForm } from './banCapture';
import { mountBanHint } from './banHint';
import { mountBurnControls } from './mount';
import { burntComments } from './postActions';
import { installBurnRunner } from './runner';

export const flamethrowerAddon: SixpackAddon = {
  id: 'flamethrower',
  name: 'Flamethrower',
  description:
    'Select comments, forum posts, blips or users and act on them together. Continues to work in the background.',
  actions: [burnable, burntComments],
  setup: (ctx) => {
    const disposers: Array<() => void> = [];
    let disposed = false;
    ctx.whenReady(() => {
      if (disposed) return;
      disposers.push(installBurnRunner(), mountBurnControls());
      // registerChipSource has no removal path, so the source outlives setup.
      installMassBanChip();
      if (location.pathname === '/bans/new') disposers.push(captureBanForm());
      if (location.pathname.startsWith('/bans/'))
        disposers.push(mountBanHint());
    });
    return () => {
      disposed = true;
      for (const dispose of disposers) dispose();
      disposers.length = 0;
    };
  },
};
