import { readJson, writeJson } from '../storage';
import manifest from '../../addons/manifest.json';

export interface CatalogEntry {
  id: string;
  name: string;
  description?: string;
  file: string; // artifact filename under the add-on base url
  // Whether a fresh user starts with the add-on on.
  default: boolean;
}

interface ManifestAddon {
  id: string;
  name: string;
  description: string;
  file: string;
  default?: boolean;
}

// The add-on registry, derived from the manifest the build reads too
// (scripts/build-addons.mjs).
export const CATALOG: CatalogEntry[] = (manifest.addons as ManifestAddon[]).map(
  (addon) => ({
    id: addon.id,
    name: addon.name,
    description: addon.description,
    file: addon.file,
    default: addon.default ?? false,
  }),
);

const KEY = 'sp.addons.state';

// Explicit per-add-on choices. A missing id means the user never chose, so its
// catalog default decides.
function states(): Record<string, boolean> {
  return readJson<Record<string, boolean> | null>(KEY, null) ?? {};
}

export function isEnabled(id: string): boolean {
  return states()[id] ?? CATALOG.find((e) => e.id === id)?.default ?? false;
}

export function setEnabled(id: string, on: boolean): void {
  writeJson(KEY, { ...states(), [id]: on });
}
