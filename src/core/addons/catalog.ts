import { readJson, writeJson } from '../storage';

export interface CatalogEntry {
  id: string;
  name: string;
  description?: string;
  file: string;
}

export const CATALOG: CatalogEntry[] = [
  {
    id: 'sources',
    name: 'Source shortener',
    description: 'Collapse known platform source links to their key detail',
    file: 'source-shortener.user.js',
  },
];

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
