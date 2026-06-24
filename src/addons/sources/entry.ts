import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon, SixpackApi } from '../../core/addons/types';
import { sourcesAddon } from './index';

// The add-on's published artifact, built as a normal userscript. 6pack fetches
// and evals it (injecting unsafeWindow) for the managed path; the same file can
// also be installed standalone, where the manager provides unsafeWindow. Either
// way it reaches the host through the page window, the only object isolated
// userscript worlds share. The queue stub covers loading before 6pack publishes;
// 6pack drains it on boot. When 6pack evals it, its api is already published, so
// register runs straight away in 6pack's own world (no cross-world boundary).
type Bridge = SixpackApi & { queue?: SixpackAddon[] };
const host = unsafeWindow as unknown as { sixpack?: Bridge };
host.sixpack ??= {
  version: 0,
  queue: [],
  register(addon: SixpackAddon) {
    this.queue!.push(addon);
  },
};
host.sixpack.register(sourcesAddon);
