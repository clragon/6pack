import { readJson, writeJson } from './storage';

export interface ListItem {
  id: string;
  title: string;
  pinned?: boolean;
}

export interface ListStore<T extends ListItem> {
  list(): T[];
  pinned(): T[];
  add(item: Omit<T, 'id'>): T;
  update(id: string, patch: Partial<Omit<T, 'id'>>): void;
  remove(id: string): void;
  move(id: string, delta: number): void;
  moveTo(id: string, targetId: string): boolean;
  canMoveTo(id: string, targetId: string): boolean;
  setPinned(id: string, pinned: boolean): void;
  set(next: T[]): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}

export interface ListStoreOptions {
  hoistPinned?: boolean;
}

export function createListStore<T extends ListItem>(
  key: string,
  seed: () => T[],
  { hoistPinned = false }: ListStoreOptions = {},
): ListStore<T> {
  let loaded: T[] | null = null;
  const listeners = new Set<() => void>();

  function current(): T[] {
    if (loaded !== null) return loaded;
    const stored = readJson<T[] | null>(key, null);
    if (stored !== null) return (loaded = stored);
    const seeded = seed();
    writeJson(key, seeded);
    return (loaded = seeded);
  }

  function persist(next: T[]): void {
    loaded = next;
    writeJson(key, next);
    for (const listener of listeners) listener();
  }

  function split(list: T[]): T[] {
    if (!hoistPinned) return list;
    return [...list.filter((i) => i.pinned), ...list.filter((i) => !i.pinned)];
  }

  function pinnedCount(list: T[]): number {
    return list.filter((item) => item.pinned).length;
  }

  return {
    list: current,
    pinned: () => current().filter((item) => item.pinned),
    add(item) {
      const made = { ...item, id: crypto.randomUUID() } as T;
      const next = [...current()];
      next.splice(
        hoistPinned && made.pinned ? pinnedCount(next) : next.length,
        0,
        made,
      );
      persist(next);
      return made;
    },
    update(id, patch) {
      persist(current().map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    remove(id) {
      persist(current().filter((i) => i.id !== id));
    },
    move(id, delta) {
      const list = current();
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) return;
      const target = index + delta;
      if (target < 0 || target >= list.length) return;
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      persist(next);
    },
    canMoveTo(id, targetId) {
      const list = current();
      const from = list.find((item) => item.id === id);
      const to = list.find((item) => item.id === targetId);
      if (!from || !to || from === to) return false;
      return !hoistPinned || !!from.pinned === !!to.pinned;
    },
    moveTo(id, targetId) {
      const list = current();
      const from = list.findIndex((item) => item.id === id);
      const to = list.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0 || from === to) return false;
      if (hoistPinned && !!list[from].pinned !== !!list[to].pinned)
        return false;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      persist(next);
      return true;
    },
    setPinned(id, pinned) {
      const list = current();
      const index = list.findIndex((item) => item.id === id);
      if (index === -1 || !!list[index].pinned === pinned) return;
      if (!hoistPinned) {
        persist(list.map((i) => (i.id === id ? { ...i, pinned } : i)));
        return;
      }
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(pinnedCount(next), 0, { ...moved, pinned });
      persist(next);
    },
    set(next) {
      persist(split(next));
    },
    reset() {
      persist(seed());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
