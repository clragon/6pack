import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon, SixpackApi } from '../core/addons/types';

type Bridge = SixpackApi & { queue?: SixpackAddon[] };

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
