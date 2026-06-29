import type { SixpackAddon } from '../core/addons/types';
import { detectContext } from '../core/context/detect';
import { whenReady } from '../core/ready';
import { settings } from '../core/settings';

export function selfHost(addon: SixpackAddon): void {
  const page = detectContext();
  for (const spec of addon.settings ?? []) settings.define(spec);
  if (addon.when && !addon.when(page)) return;
  addon.setup?.({ page, settings, whenReady });
}
