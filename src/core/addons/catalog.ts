import { readJson, writeJson } from '../storage';
import manifest from '../../addons/manifest.json';

export interface CatalogEntry {
  id: string;
  name: string;
  description?: string;
  file: string; // artifact filename under the add-on base url
}

interface ManifestAddon {
  id: string;
  name: string;
  description: string;
  file: string;
}

// The add-on registry, derived from the single source of truth that the build
// reads too (scripts/build-addons.mjs), so a name or description lives in one
// place. A later phase fetches this from a repo's release instead of bundling it.
export const CATALOG: CatalogEntry[] = (manifest.addons as ManifestAddon[]).map(
  (addon) => ({
    id: addon.id,
    name: addon.name,
    description: addon.description,
    file: addon.file,
  }),
);

const KEY = 'addons.enabled';

export function enabledIds(): string[] {
  return readJson<string[]>(KEY, []);
}

export function isEnabled(id: string): boolean {
  return enabledIds().includes(id);
}

export function setEnabled(id: string, on: boolean): void {
  const ids = new Set(enabledIds());
  if (on) ids.add(id);
  else ids.delete(id);
  writeJson(KEY, [...ids]);
}
