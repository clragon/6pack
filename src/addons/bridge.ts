import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon, SixpackApi } from '../core/addons/types';
import { whenReady } from '../core/ready';
import { selfHost } from './selfhost';

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

  whenReady(() => {
    // AddonHost.publish sets version 1 at document-start, so a version 0 stub
    // at ready time means no 6pack runs in this page.
    if (host.sixpack!.version === 0) selfHost(addon);
  });
}
