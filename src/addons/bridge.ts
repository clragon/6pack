import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon, SixpackApi } from '../core/addons/types';
import { whenReady } from '../core/ready';
import { selfHost } from './selfhost';

// The pre-publish stub only queues registrations, so it carries version/register
// plus the queue, and 6pack's real api (with openDialog) replaces it on publish.
type Bridge = Pick<SixpackApi, 'version' | 'register'> & {
  queue?: SixpackAddon[];
  openDialog?: SixpackApi['openDialog'];
};

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

  // Standalone fallback: 6pack publishes its real api (version 1) at
  // document-start, so a surviving version 0 stub at ready-time means no 6pack
  // is here to drain the queue. Run the add-on solo. When 6pack is present it
  // owns the add-on (managed eval, or this registration as a third-party hook),
  // so we step aside.
  whenReady(() => {
    if (host.sixpack!.version === 0) selfHost(addon);
  });
}
