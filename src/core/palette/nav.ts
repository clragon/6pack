import { useEffect, useState } from 'preact/hooks';

import type { Action, SearchSpec } from '../actions/types';
import { paletteStore } from './store';

// A level in the palette's navigation stack. Shared so the nav store can capture
// and restore it, letting dialogs reopen the palette where they were launched.
export interface Level {
  title?: string;
  actions?: Action[];
  search?: SearchSpec;
  placeholder?: string;
  // Set when this level is a chip's menu, so the palette can keep that chip shown
  // and marked active while you're inside it.
  chipId?: string;
}

export interface Nav {
  // Root through the level the action was run from.
  stack: Level[];
  // Title of the action that ran (and may have opened a dialog).
  leaf: string;
}

let nav: Nav | null = null;
let pendingRestore: Level[] | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

// The palette records the path to an action before it runs, so a dialog the
// action opens can show the full trail and navigate back into the palette.
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

// Reopen the palette at a captured level (0 = root). Dialogs call this from a
// breadcrumb crumb to return to the selection they came from.
export function returnTo(levelIndex: number): void {
  if (!nav) return;
  pendingRestore = nav.stack.slice(0, levelIndex + 1);
  paletteStore.set(true);
}

// The palette consumes a pending restore stack when it opens, falling back to
// root when there is none.
export function takeRestore(): Level[] | null {
  const restore = pendingRestore;
  pendingRestore = null;
  return restore;
}
