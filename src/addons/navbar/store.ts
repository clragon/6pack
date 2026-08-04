import { readJson, writeJson } from '../../core/storage';
import { defaultEntries } from './seeds';

// A destination the user keeps: shown in the top bar when pinned, and in the
// palette's jump list otherwise. `url` may carry %username% / %userid%,
// expanded at render time.
export interface NavEntry {
  id: string;
  title: string;
  url: string;
  // Key into the icon catalog; an unknown or absent key falls back to the link
  // glyph.
  icon?: string;
  // Pinned entries make up the top bar, in this list's order.
  pinned?: boolean;
}

const KEY = 'sp.navbar.entries';

// A fresh install seeds e621's own bar plus the jumps worth having. An emptied
// list is not a fresh install, so removed entries stay removed.
function load(): NavEntry[] {
  const stored = readJson<NavEntry[] | null>(KEY, null);
  if (stored !== null) return stored;
  const seeded = defaultEntries();
  writeJson(KEY, seeded);
  return seeded;
}

// The seed is written on first use, so an add-on that is never enabled leaves
// storage untouched.
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

// Pinned entries lead the list, in bar order; the rest trail in no order that
// matters, since the palette ranks them by use. Every write keeps that split.
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

// Pinning parks the entry at the end of the bar; unpinning drops it at the head
// of the jumps, which is the same index either way.
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

// Put an entry where another one sits. Both surfaces that reorder (the drag and
// the keyboard) name a target rather than a distance, so neither can step over
// an entry the list is not showing. Crossing the split is refused; the caller
// learns whether anything moved.
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

// Restores the split for a list that may not respect it (an import), leaving
// the order within each run alone.
export function setEntries(next: NavEntry[]): void {
  persist([
    ...next.filter((entry) => entry.pinned),
    ...next.filter((entry) => !entry.pinned),
  ]);
}

// Back to the starter set, dropping everything the user added.
export function resetEntries(): void {
  persist(defaultEntries());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
