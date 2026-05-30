import type { BurnableType } from '../site/burnable';

// A reference to one burnable item: enough to act on it (the DOM element is read
// live when needed, so refs survive re-renders).
export interface BurnRef {
  type: BurnableType;
  id: string;
}

// The burn pile: the set of currently-selected burnables. The userscript re-runs
// on every navigation, so the pile is naturally per-page. Reactive so checkboxes,
// the count, and the palette/chip stay in sync.
const pile = new Map<string, BurnRef>();
const listeners = new Set<() => void>();

function keyOf(ref: BurnRef): string {
  return `${ref.type}:${ref.id}`;
}

function emit(): void {
  for (const listener of listeners) listener();
}

export const burnPile = {
  has(ref: BurnRef): boolean {
    return pile.has(keyOf(ref));
  },
  toggle(ref: BurnRef, on?: boolean): void {
    const key = keyOf(ref);
    const want = on ?? !pile.has(key);
    if (want) pile.set(key, ref);
    else pile.delete(key);
    emit();
  },
  // Replace the pile wholesale (for select-all).
  set(refs: BurnRef[]): void {
    pile.clear();
    for (const ref of refs) pile.set(keyOf(ref), ref);
    emit();
  },
  clear(): void {
    if (pile.size === 0) return;
    pile.clear();
    emit();
  },
  items(): BurnRef[] {
    return [...pile.values()];
  },
  count(): number {
    return pile.size;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
