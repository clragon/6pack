import { h, render } from 'preact';
import { Flame } from 'lucide-preact';
import { massBan } from '../core/bans/massBan';
import { paletteStore } from '../core/palette/store';

// A small flame beside the ban-page heading while a template is pending: a hint
// that the palette (and its ban-template chip) is where the bulk action lives.
export function mountBanHint(): void {
  const template = massBan.get();
  if (!template) return;
  const heading = document.querySelector<HTMLElement>(
    '#c-bans #a-new h1, #c-bans #a-show h1',
  );
  if (!heading) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.title = 'Open the ban template';
  button.style.cssText =
    'display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; margin-left: 12px; padding: 4px 8px; border: none; border-radius: 4px; background: none; cursor: pointer; color: var(--palette-text-yellow, #ffd666); font-size: 13px; font-weight: 700;';
  const icon = document.createElement('span');
  icon.style.display = 'inline-flex';
  render(h(Flame, { size: 16, fill: 'currentColor' }), icon);
  const label = document.createElement('span');
  label.textContent = `Ban template (${template.userIds.length})`;
  button.append(icon, label);
  button.addEventListener('click', () => paletteStore.set(true));
  heading.appendChild(button);
}
