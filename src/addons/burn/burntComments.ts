// e621 still renders burnt (hidden/deleted) comments inline for moderators. We can
// collapse them out of the thread to read the live conversation, then bring them
// back. State is per-page and lives only as long as the tab, mirroring legacy.
import { readBurnables } from './burnable';

let shown = true;
const listeners = new Set<() => void>();

function burntComments(): HTMLElement[] {
  return readBurnables()
    .filter((item) => item.burnt)
    .map((item) => item.el);
}

export function hasBurntComments(): boolean {
  return burntComments().length > 0;
}

export function burntCount(): number {
  return burntComments().length;
}

export function burntCommentsShown(): boolean {
  return shown;
}

export function toggleBurntComments(): boolean {
  shown = !shown;
  for (const el of burntComments()) {
    el.style.display = shown ? '' : 'none';
  }
  for (const listener of listeners) listener();
  return shown;
}

export function subscribeBurntComments(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
