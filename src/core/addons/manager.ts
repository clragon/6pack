import { AddonHost } from './host';
import { loadAddon } from './loader';
import { CATALOG, isEnabled, setEnabled } from './catalog';
import type { CatalogEntry } from './catalog';
import type { ActionRegistry } from '../actions/registry';
import type { PageContext } from '../context/types';
import { log } from '../log';

class AddonManager {
  private host?: AddonHost;

  init(registry: ActionRegistry, page: PageContext): void {
    this.host = new AddonHost(registry, page);
    this.host.publish();
    for (const entry of CATALOG) if (isEnabled(entry.id)) this.load(entry);
  }

  isEnabled(id: string): boolean {
    return isEnabled(id);
  }

  enable(entry: CatalogEntry): void {
    setEnabled(entry.id, true);
    this.load(entry);
  }

  disable(id: string): void {
    setEnabled(id, false);
    this.host?.unload(id);
  }

  private load(entry: CatalogEntry): void {
    loadAddon(entry.file).catch((error) =>
      log.error(`addon ${entry.id} failed to load: ${describe(error)}`),
    );
  }
}

export const addons = new AddonManager();

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
