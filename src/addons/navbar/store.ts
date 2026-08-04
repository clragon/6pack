import { readJson, writeJson } from '../../core/storage';
import { defaultEntries } from './seeds';

export interface NavEntry {
  id: string;
  title: string;
  url: string;
  icon?: string;
  pinned?: boolean;
}

const KEY = 'sp.navbar.entries';

function load(): NavEntry[] {
  const stored = readJson<NavEntry[] | null>(KEY, null);
  if (stored !== null) return stored;
  const seeded = defaultEntries();
  writeJson(KEY, seeded);
  return seeded;
}

let loaded: NavEntry[] | null = null;
function entries(): NavEntry[] {
  return (loaded ??= load());
}

const listeners = new Set<() => void>();

function persist(next: NavEntry[]): void {
  loaded = next;
  writeJson(KEY, next);
  for (const listener of listeners) listener();
}

export function listEntries(): NavEntry[] {
  return entries();
}

function pinnedCount(list: NavEntry[]): number {
  return list.filter((entry) => entry.pinned).length;
}

export function addEntry(title: string, url: string, pinned = false): NavEntry {
  const entry: NavEntry = { id: crypto.randomUUID(), title, url, pinned };
  const next = [...entries()];
  next.splice(pinned ? pinnedCount(next) : next.length, 0, entry);
  persist(next);
  return entry;
}

export function setPinned(id: string, pinned: boolean): void {
  const list = entries();
  const index = list.findIndex((entry) => entry.id === id);
  if (index === -1 || !!list[index].pinned === pinned) return;
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(pinnedCount(next), 0, { ...moved, pinned });
  persist(next);
}

export function updateEntry(
  id: string,
  patch: Partial<Pick<NavEntry, 'title' | 'url' | 'icon'>>,
): void {
  persist(entries().map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

export function removeEntry(id: string): void {
  persist(entries().filter((e) => e.id !== id));
}

export function moveEntryTo(id: string, targetId: string): boolean {
  const list = entries();
  const from = list.findIndex((entry) => entry.id === id);
  const to = list.findIndex((entry) => entry.id === targetId);
  if (from < 0 || to < 0 || from === to) return false;
  if (!!list[from].pinned !== !!list[to].pinned) return false;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  persist(next);
  return true;
}

export function setEntries(next: NavEntry[]): void {
  persist([
    ...next.filter((entry) => entry.pinned),
    ...next.filter((entry) => !entry.pinned),
  ]);
}

export function resetEntries(): void {
  persist(defaultEntries());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
