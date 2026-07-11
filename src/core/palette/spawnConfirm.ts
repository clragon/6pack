import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

import type { ConfirmRequest, ConfirmResult } from './confirm';

interface Host {
  confirm?: (request: ConfirmRequest) => Promise<ConfirmResult | null>;
}

export function spawnConfirm(
  request: ConfirmRequest,
): Promise<ConfirmResult | null> {
  const host = (unsafeWindow as unknown as { sixpack?: Host }).sixpack;
  // scripts/build-addons.mjs gives each add-on its own unrendered confirm.ts,
  // so the confirm that core/addons/host.ts publishes is the one that shows.
  if (host?.confirm) return host.confirm(request);
  const text = request.detail
    ? `${request.title}\n\n${request.detail}`
    : request.title;
  return Promise.resolve(
    window.confirm(text) ? { fields: {}, options: {} } : null,
  );
}
