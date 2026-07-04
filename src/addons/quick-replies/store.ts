import { readJson, writeJson } from '../../core/storage';

export interface Template {
  id: string;
  title: string;
  body: string;
  pinned?: boolean;
}

export interface ReplyStore {
  list(): Template[];
  pinned(): Template[];
  add(title: string, body: string): Template;
  update(
    id: string,
    patch: Partial<Pick<Template, 'title' | 'body' | 'pinned'>>,
  ): void;
  remove(id: string): void;
  move(id: string, delta: number): void;
  set(next: Template[]): void;
  subscribe(listener: () => void): () => void;
}

export function createStore(key: string, seed: () => Template[]): ReplyStore {
  const stored = readJson<Template[] | null>(key, null);
  let current: Template[];
  if (stored !== null) {
    current = stored;
  } else {
    current = seed();
    writeJson(key, current);
  }
  const listeners = new Set<() => void>();

  function persist(): void {
    writeJson(key, current);
    for (const listener of listeners) listener();
  }

  return {
    list: () => current,
    pinned: () => current.filter((t) => t.pinned),
    add(title, body) {
      const template: Template = { id: crypto.randomUUID(), title, body };
      current = [...current, template];
      persist();
      return template;
    },
    update(id, patch) {
      current = current.map((t) => (t.id === id ? { ...t, ...patch } : t));
      persist();
    },
    remove(id) {
      current = current.filter((t) => t.id !== id);
      persist();
    },
    move(id, delta) {
      const index = current.findIndex((t) => t.id === id);
      if (index === -1) return;
      const target = index + delta;
      if (target < 0 || target >= current.length) return;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      current = next;
      persist();
    },
    set(next) {
      current = next;
      persist();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
