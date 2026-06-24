import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon, SixpackApi } from '../core/addons/types';

type Bridge = SixpackApi & { queue?: SixpackAddon[] };

// Hand an add-on to 6pack through the page window, the only object isolated
// userscript worlds share. The queue stub covers loading before 6pack publishes;
// 6pack drains it on boot. When 6pack evals the artifact itself, its api is
// already published, so this registers straight away in 6pack's own world.
export function registerAddon(addon: SixpackAddon): void {
  const host = unsafeWindow as unknown as { sixpack?: Bridge };
  host.sixpack ??= {
    version: 0,
    queue: [],
    register(queued: SixpackAddon) {
      this.queue!.push(queued);
    },
  };
  host.sixpack.register(addon);
}
