import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon, SixpackApi } from './types';
import type { ActionRegistry } from '../actions/registry';
import type { PageContext } from '../context/types';
import { settings } from '../settings';
import { whenReady } from '../ready';
import { registerTicketResponseProvider } from '../tickets/providers';
import { openDialog } from '../palette/dialog';
import { log } from '../log';

export class AddonHost {
  private readonly loaded = new Set<string>();
  private readonly teardowns = new Map<string, () => void>();

  readonly api: SixpackApi = {
    version: 1,
    register: (addon) => this.register(addon),
    openDialog: (spec) => openDialog(spec),
  };

  constructor(
    private readonly registry: ActionRegistry,
    private readonly page: PageContext,
  ) {}

  register(addon: SixpackAddon): void {
    if (this.loaded.has(addon.id)) {
      log.warn(`addon ${addon.id} already loaded, ignoring`);
      return;
    }
    this.loaded.add(addon.id);
    try {
      for (const spec of addon.settings ?? []) settings.define(spec);

      if (addon.actions) this.registry.register(...addon.actions);

      if (addon.ticketResponses)
        registerTicketResponseProvider(addon.ticketResponses);

      if (addon.setup && (!addon.when || addon.when(this.page))) {
        const teardown = addon.setup({ page: this.page, settings, whenReady });
        if (teardown) this.teardowns.set(addon.id, teardown);
      }

      log.info(`addon ${addon.id} loaded`);
    } catch (error) {
      log.error(`addon ${addon.id} failed to load: ${describe(error)}`);
    }
  }

  unload(id: string): void {
    const teardown = this.teardowns.get(id);
    if (!teardown) return;
    try {
      teardown();
    } catch (error) {
      log.error(`addon ${id} failed to unload: ${describe(error)}`);
    }
    this.teardowns.delete(id);
    this.loaded.delete(id);
  }

  publish(): void {
    const host = unsafeWindow as unknown as {
      sixpack?: SixpackApi & { queue?: SixpackAddon[] };
    };
    const queued = host.sixpack?.queue ?? [];
    host.sixpack = this.api;
    for (const addon of queued) this.register(addon);
  }
}

function describe(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}
