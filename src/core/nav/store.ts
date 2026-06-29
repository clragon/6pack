import { readJson, writeJson } from '../storage';

// User-pinned jump points, keyed by URL.
const KEY = 'nav.entries';

export type NavEntries = Record<string, string>;

export function listEntries(): NavEntries {
  return readJson<NavEntries>(KEY, {});
}

export function upsertEntry(url: string, label: string): void {
  writeJson(KEY, { ...listEntries(), [url]: label });
}

export function removeEntry(url: string): void {
  const entries = listEntries();
  if (!(url in entries)) return;
  const next = { ...entries };
  delete next[url];
  writeJson(KEY, next);
}

// Default slugs the user has hidden from the jump list.
const HIDDEN_KEY = 'nav.hidden';

export function isHidden(slug: string): boolean {
  return readJson<string[]>(HIDDEN_KEY, []).includes(slug);
}

export function setHidden(slug: string, hidden: boolean): void {
  const current = readJson<string[]>(HIDDEN_KEY, []);
  if (current.includes(slug) === hidden) return;
  writeJson(
    HIDDEN_KEY,
    hidden ? [...current, slug] : current.filter((s) => s !== slug),
  );
}
