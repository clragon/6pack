import { readJson, writeJson } from '../storage';

const KEY = 'massban';

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
