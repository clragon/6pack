import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

import type { ConfirmRequest, ConfirmResult } from './confirm';

interface Host {
  confirm?: (request: ConfirmRequest) => Promise<ConfirmResult | null>;
}

// Raise a confirm through 6pack's palette when present, else fall back to a
// native prompt. Safe to import from an add-on: managed mode reaches the real
// ConfirmPrompt via the runtime bridge, so no disconnected copy of the confirm
// singleton is bundled.
export function spawnConfirm(
  request: ConfirmRequest,
): Promise<ConfirmResult | null> {
  const host = (unsafeWindow as unknown as { sixpack?: Host }).sixpack;
  if (host?.confirm) return host.confirm(request);
  const text = request.detail
    ? `${request.title}\n\n${request.detail}`
    : request.title;
  return Promise.resolve(
    window.confirm(text) ? { fields: {}, options: {} } : null,
  );
}
