import { readJson, writeJson } from './storage';

// A boolean preference an add-on (or core) contributes. The settings submenu
// renders one switch per registered spec, so registering a spec is all it takes
// to surface a toggle.
export interface SettingSpec {
  key: string; // namespaced, e.g. "sources.shorten"
  label: string;
  description?: string;
  keywords?: string[];
  default: boolean;
}

// Persisted user preferences, shared across all e621 pages via localStorage, and
// reactive so a toggle from the palette reflects on the page live. Specs are
// registered at boot (by core and add-ons); values are stored under their keys.
// A value with no surviving spec (an add-on that went away) just lies dormant.
const KEY = 'settings';

const specs = new Map<string, SettingSpec>();
let values: Record<string, boolean> = readJson<Record<string, boolean>>(
  KEY,
  {},
);
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export const settings = {
  // Register a spec. Re-registering the same key keeps the first definition (the
  // owner won the race); the stored value is untouched either way.
  define(spec: SettingSpec): void {
    if (specs.has(spec.key)) return;
    specs.set(spec.key, spec);
    notify();
  },
  specs(): SettingSpec[] {
    return [...specs.values()];
  },
  get(key: string): boolean {
    if (key in values) return values[key];
    return specs.get(key)?.default ?? false;
  },
  set(key: string, value: boolean): void {
    if (settings.get(key) === value) return;
    values = { ...values, [key]: value };
    writeJson(KEY, values);
    notify();
  },
  toggle(key: string): boolean {
    const next = !settings.get(key);
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
