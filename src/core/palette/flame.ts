import { h, render } from 'preact';
import { Flame } from 'lucide-preact';

import { openPaletteAt } from './store';

// A flame button in page DOM (not the shadow root) that opens the palette at a
// given action group.

// Page-DOM icon buttons need a real :hover rule, not inline styles.
export const ICON_BTN_CLASS = 'sixpack-icon-btn';
const STYLE_ID = 'sixpack-icon-btn-style';

export function ensureIconButtonStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    `.${ICON_BTN_CLASS} { background: none; padding: 4px; border-radius: 4px; transition: background-color 0.15s ease; }` +
    `.${ICON_BTN_CLASS}:hover { background: var(--color-section-lighten-10, #2a3852); }` +
    // Inside the button: e621 sits these in tight, clipping containers, which
    // cut an outer ring off.
    `.${ICON_BTN_CLASS}:focus-visible { outline: 2px solid var(--palette-text-yellow, #ffd666); outline-offset: -2px; }`;
  document.head.appendChild(style);
}

// A flame button that opens the palette at `actionId`.
export function flameButton(
  actionId: string,
  opts: { title?: string } = {},
): HTMLButtonElement {
  ensureIconButtonStyles();
  const button = document.createElement('button');
  button.type = 'button';
  if (opts.title) button.title = opts.title;
  button.className = ICON_BTN_CLASS;
  button.style.cssText =
    'display: inline-flex; align-items: center; gap: 6px; border: none; cursor: pointer; color: var(--palette-text-yellow, #ffd666); font-weight: 700;';
  const icon = document.createElement('span');
  icon.style.display = 'inline-flex';
  render(h(Flame, { size: 16, fill: 'currentColor' }), icon);
  button.appendChild(icon);
  button.addEventListener('click', () => openPaletteAt(actionId));
  return button;
}
