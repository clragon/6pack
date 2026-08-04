import { AddonHost } from './host';
import { loadAddon } from './loader';
import { EMBEDDED } from './embedded';
import { inbuiltAddon } from './inbuilt';
import { CATALOG, isEnabled, setEnabled } from './catalog';
import type { CatalogEntry } from './catalog';
import type { ActionRegistry } from '../actions/registry';
import type { PageContext } from '../context/types';
import { log } from '../log';

class AddonManager {
  private host?: AddonHost;
  private readonly failures = new Map<string, string>();

  init(registry: ActionRegistry, page: PageContext): void {
    this.host = new AddonHost(registry, page);
    this.host.publish();
    for (const entry of CATALOG) if (isEnabled(entry.id)) this.load(entry);
  }

  isEnabled(id: string): boolean {
    return isEnabled(id);
  }

  failure(id: string): string | undefined {
    return this.failures.get(id);
  }

  enable(entry: CatalogEntry): void {
    setEnabled(entry.id, true);
    this.failures.delete(entry.id);
    this.load(entry);
  }

  disable(id: string): void {
    setEnabled(id, false);
    this.failures.delete(id);
    this.host?.unload(id);
  }

  private load(entry: CatalogEntry): void {
    const inbuilt = inbuiltAddon(entry.id);
    if (inbuilt) {
      this.host?.register(inbuilt);
      return;
    }
    if (__FAT__) {
      const addon = EMBEDDED[entry.id];
      if (addon) this.host?.register(addon);
      else log.error(`addon ${entry.id} missing from fat bundle`);
      return;
    }
    if (entry.file) {
      loadAddon(entry.id, entry.file, (reason) =>
        this.failures.set(entry.id, reason),
      );
    } else {
      const reason = 'no artifact';
      log.error(`addon ${entry.id} has ${reason}`);
      this.failures.set(entry.id, reason);
    }
  }
}

export const addons = new AddonManager();
