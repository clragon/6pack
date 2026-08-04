import type { SixpackAddon } from '../../core/addons/types';
import { burnable } from './actions';
import { installMassBanChip } from './banChip';
import { captureBanForm } from './banCapture';
import { mountBanHint } from './banHint';
import { mountBurnControls } from './mount';
import { burntComments } from './postActions';
import { installBurnRunner } from './runner';

// Inbuilt: compiled into 6pack itself rather than fetched as an artifact, so it
// may import core directly (see core/addons/inbuilt).
export const burnAddon: SixpackAddon = {
  id: 'burn',
  name: 'Burner',
  description:
    'Comments, forum posts, blips and users are selected with a checkbox and acted on together. The pile survives while a page is read, and the palette holds the commands that work it: incinerate, mark, copy, clear. Work runs through a throttled queue that persists across reloads and is shared between tabs, so a long run continues where it stopped and reports what failed.',
  actions: [burnable, burntComments],
  setup: (ctx) => {
    const disposers: Array<() => void> = [];
    let disposed = false;
    ctx.whenReady(() => {
      if (disposed) return;
      disposers.push(installBurnRunner(), mountBurnControls());
      // A chip source has no removal path. It lists nothing with no template.
      installMassBanChip();
      // The ban template is carried across pages: the new-ban form records the
      // fields it was submitted with, and a later ban page offers them for the
      // rest of the pile.
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
