import { readJson, writeJson } from '../storage';
import { INBUILT } from './inbuilt';
import manifest from '../../addons/manifest.json';

export interface CatalogEntry {
  id: string;
  name: string;
  description?: string;
  file?: string;
  default: boolean;
}

interface ManifestAddon {
  id: string;
  name: string;
  description: string;
  default?: boolean;
}

export function artifactFile(id: string): string {
  // buildAddons in scripts/build-addons.mjs writes each artifact under this
  // same name.
  return `${id}.user.js`;
}

export const CATALOG: CatalogEntry[] = [
  ...INBUILT.map(
    (entry): CatalogEntry => ({
      id: entry.addon.id,
      name: entry.addon.name,
      description: entry.description,
      default: entry.default ?? false,
    }),
  ),
  ...(manifest.addons as ManifestAddon[]).map(
    (addon): CatalogEntry => ({
      id: addon.id,
      name: addon.name,
      description: addon.description,
      file: artifactFile(addon.id),
      default: addon.default ?? false,
    }),
  ),
];

const KEY = 'sp.core.addons.state';

function states(): Record<string, boolean> {
  return readJson<Record<string, boolean> | null>(KEY, null) ?? {};
}

export function isEnabled(id: string): boolean {
  return states()[id] ?? CATALOG.find((e) => e.id === id)?.default ?? false;
}

export function setEnabled(id: string, on: boolean): void {
  writeJson(KEY, { ...states(), [id]: on });
}
