import { readJson, writeJson } from './storage';

export interface SettingSpec {
  key: string;
  label: string;
  description?: string;
  keywords?: string[];
  default: boolean;
}

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
