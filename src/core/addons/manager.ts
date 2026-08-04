import { AddonHost } from './host';
import { loadAddon } from './loader';
import { EMBEDDED } from './embedded';
import { INBUILT } from './inbuilt';
import { CATALOG, isEnabled, setEnabled } from './catalog';
import type { CatalogEntry } from './catalog';
import type { ActionRegistry } from '../actions/registry';
import type { PageContext } from '../context/types';
import { log } from '../log';

// Owns the host and drives the managed lifecycle: publish the api, load enabled
// add-ons at boot, install/remove on demand. A singleton so the Add-ons command
// can reach it without threading the host through every call site.
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
    // Inbuilt: no artifact to fetch or unpack in any build.
    const inbuilt = INBUILT[entry.id];
    if (inbuilt) {
      this.host?.register(inbuilt);
      return;
    }
    // Fat build: the add-on is compiled in, so register its object straight
    // through the host with no fetch. The branch is dropped from a thin build,
    // which tree-shakes the embedded add-on code out with it.
    if (__FAT__) {
      const addon = EMBEDDED[entry.id];
      if (addon) this.host?.register(addon);
      else log.error(`addon ${entry.id} missing from fat bundle`);
      return;
    }
    // Relies on publish() having run so the artifact finds unsafeWindow.sixpack.
    if (entry.file) loadAddon(entry.id, entry.file);
    else log.error(`addon ${entry.id} has no artifact`);
  }
}

export const addons = new AddonManager();
