import { readJson, writeJson } from '../storage';
import manifest from '../../addons/manifest.json';

export interface CatalogEntry {
  id: string;
  name: string;
  description?: string;
  file: string;
}

interface ManifestAddon {
  id: string;
  name: string;
  description: string;
  file: string;
}

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
