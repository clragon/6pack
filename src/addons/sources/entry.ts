import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon, SixpackApi } from '../../core/addons/types';
import { sourcesAddon } from './index';

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
