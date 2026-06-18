import { readJson, writeJson } from './storage';

export interface Settings {
  shortenSources: boolean;
}

const KEY = 'settings';

const DEFAULTS: Settings = {
  shortenSources: false,
};

let current: Settings = { ...DEFAULTS, ...readJson<Partial<Settings>>(KEY, {}) };
const listeners = new Set<() => void>();

export const settings = {
  get<K extends keyof Settings>(key: K): Settings[K] {
    return current[key];
  },
  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    if (current[key] === value) return;
    current = { ...current, [key]: value };
    writeJson(KEY, current);
    for (const listener of listeners) listener();
  },
  toggle(key: keyof Settings): boolean {
    const next = !current[key];
    settings.set(key, next);
    return next;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
