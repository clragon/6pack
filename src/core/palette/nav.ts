import { useEffect, useState } from 'preact/hooks';

import type { Action, SearchSpec } from '../actions/types';
import { paletteStore } from './store';

export interface Level {
  title?: string;
  actions?: Action[];
  search?: SearchSpec;
  placeholder?: string;
}

export interface Nav {
  stack: Level[];
  leaf: string;
}

let nav: Nav | null = null;
let pendingRestore: Level[] | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function captureNav(stack: Level[], leaf: string): void {
  nav = { stack, leaf };
  emit();
}

export function useNav(): Nav | null {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return nav;
}

export function returnTo(levelIndex: number): void {
  if (!nav) return;
  pendingRestore = nav.stack.slice(0, levelIndex + 1);
  paletteStore.set(true);
}

export function takeRestore(): Level[] | null {
  const restore = pendingRestore;
  pendingRestore = null;
  return restore;
}
