import type { BurnableType } from './burnable';

export interface BurnRef {
  type: BurnableType;
  id: string;
}

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
