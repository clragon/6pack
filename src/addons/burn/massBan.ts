import { readJson, writeJson } from '../../core/storage';

// A pending mass-ban: the users picked on /users, plus the ban[*] fields captured
// from the first ban's form once it's submitted. Persisted so it survives the
// navigation from /users to /bans/new to /bans/<id>, and reactive so the chip
// tracks it.
const KEY = 'sp.burn.massban';

export interface MassBan {
  userIds: number[];
  fields?: Record<string, string>;
}

let current = readJson<MassBan | null>(KEY, null);
const listeners = new Set<() => void>();

function persist(): void {
  writeJson(KEY, current);
  for (const listener of listeners) listener();
}

export const massBan = {
  get(): MassBan | null {
    return current;
  },
  start(userIds: number[]): void {
    current = { userIds };
    persist();
  },
  captureFields(fields: Record<string, string>): void {
    if (!current) return;
    current = { ...current, fields };
    persist();
  },
  clear(): void {
    if (!current) return;
    current = null;
    persist();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
