import { readBurnables } from './burnable';

let shown = true;

function burntComments(): HTMLElement[] {
  return readBurnables()
    .filter((item) => item.burnt)
    .map((item) => item.el);
}

export function hasBurntComments(): boolean {
  return burntComments().length > 0;
}

export function burntCommentsShown(): boolean {
  return shown;
}

export function toggleBurntComments(): boolean {
  shown = !shown;
  for (const el of burntComments()) {
    el.style.display = shown ? '' : 'none';
  }
  return shown;
}
