import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon } from './types';
import type { ActionRegistry } from '../actions/registry';
import type { PageContext } from '../context/types';
import { settings } from '../settings';
import { log } from '../log';

// The shape a third-party userscript pokes onto the page window. Before 6pack
// boots, `register` is a stub that queues; 6pack swaps in the live one and
// drains. Either load order works: 6pack-first means the queue is empty.
export interface SixpackBridge {
  version: number;
  register(addon: SixpackAddon): void;
  queue?: SixpackAddon[];
}

export class AddonHost {
  private readonly loaded = new Set<string>();
  private readonly teardowns = new Map<string, () => void>();

  constructor(
    private readonly registry: ActionRegistry,
    private readonly page: PageContext,
  ) {}

  // Take an add-on into the running palette: define its settings, fold its
  // actions into the registry, and run its setup on a matching page. A throw in
  // any one add-on is contained so it can't take the palette down with it.
  register(addon: SixpackAddon): void {
    if (this.loaded.has(addon.id)) {
      log.warn(`addon ${addon.id} already loaded, ignoring`);
      return;
    }
    this.loaded.add(addon.id);
    try {
      for (const spec of addon.settings ?? []) settings.define(spec);

      if (addon.actions) {
        const actions =
          typeof addon.actions === 'function'
            ? addon.actions(this.page)
            : addon.actions;
        this.registry.register(...actions);
      }

      if (addon.setup && (!addon.when || addon.when(this.page))) {
        const teardown = addon.setup({ page: this.page });
        if (teardown) this.teardowns.set(addon.id, teardown);
      }

      log.info(`addon ${addon.id} loaded`);
    } catch (error) {
      log.error(`addon ${addon.id} failed to load: ${describe(error)}`);
    }
  }

  // Publish the live bridge on the page window (the only object isolated
  // userscript worlds share) and drain anything a third-party hook queued while
  // waiting for us.
  publish(): void {
    const host = unsafeWindow as unknown as { sixpack?: SixpackBridge };
    const queued = host.sixpack?.queue ?? [];
    host.sixpack = { version: 1, register: (addon) => this.register(addon) };
    for (const addon of queued) this.register(addon);
  }
}

function describe(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}
