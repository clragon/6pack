import { h, render } from 'preact';
import { Shield, ShieldOff } from 'lucide-preact';
import { burnPile, type BurnRef } from '../core/burn';
import { openPaletteAt } from '../core/palette/store';
import {
  currentBurnableConfig,
  readBurnables,
  type Burnable,
} from '../site/burnable';
import {
  burntCommentsShown,
  burntCount,
  hasBurntComments,
  subscribeBurntComments,
  toggleBurntComments,
} from '../site/burntComments';

const CHECKBOX_CLASS = 'sixpack-burner';
const ALL_CLASS = 'sixpack-burner-all';
const COUNT_CLASS = 'sixpack-burner-count';
const REGION_ID = 'sixpack-burner-controls';

const FLAME_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';

function refOf(item: Burnable): BurnRef {
  return { type: item.type, id: item.id };
}

function injectCheckbox(item: Burnable): void {
  if (item.el.querySelector(`.${CHECKBOX_CLASS}`)) return;
  const ref = refOf(item);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = CHECKBOX_CLASS;
  checkbox.style.cursor = 'pointer';
  checkbox.checked = burnPile.has(ref);
  checkbox.addEventListener('change', () =>
    burnPile.toggle(ref, checkbox.checked),
  );

  const cell = document.createElement('div');
  cell.style.cssText = [
    'padding: 0.25rem 0.5rem;',
    'cursor: pointer;',
    'background-color: var(--color-section-lighten-5);',
    'grid-column: 3;',
  ].join(' ');
  cell.appendChild(checkbox);
  cell.addEventListener('click', (event) => {
    if (event.target === checkbox) return;
    checkbox.checked = !checkbox.checked;
    burnPile.toggle(ref, checkbox.checked);
  });

  item.el.appendChild(cell);
}

function refreshRegion(items: Burnable[], region: HTMLElement): void {
  const selected = items.filter((item) => burnPile.has(refOf(item))).length;
  const all = region.querySelector<HTMLInputElement>(`.${ALL_CLASS}`);
  if (all) {
    all.checked = selected > 0 && selected === items.length;
    all.indeterminate = selected > 0 && selected < items.length;
  }
  const count = region.querySelector(`.${COUNT_CLASS}`);
  if (count) count.textContent = selected > 0 ? String(selected) : '';
}

function renderRegion(items: Burnable[]): HTMLElement | null {
  const config = currentBurnableConfig();
  if (!config) return null;
  const anchor = document.querySelector(config.controls.selector);
  if (!anchor) return null;

  const region = document.createElement('div');
  region.id = REGION_ID;
  region.style.cssText =
    'display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin: 10px;';

  const burn = document.createElement('button');
  burn.type = 'button';
  burn.title = 'Incinerate selection';
  burn.style.cssText =
    'display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: var(--palette-text-yellow, #ffd666); font-weight: 700;';
  burn.innerHTML = FLAME_SVG;
  const count = document.createElement('span');
  count.className = COUNT_CLASS;
  count.style.cssText = 'font-size: 13px; line-height: 16px;';
  burn.prepend(count);
  burn.addEventListener('click', () => openPaletteAt('burnable'));

  const all = document.createElement('input');
  all.type = 'checkbox';
  all.className = ALL_CLASS;
  all.title = 'Select all';
  all.style.cursor = 'pointer';
  all.addEventListener('change', () => {
    if (all.checked) burnPile.set(items.map(refOf));
    else burnPile.clear();
  });

  if (hasBurntComments()) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.style.cssText =
      'display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-weight: 700;';
    const burntLabel = document.createElement('span');
    burntLabel.style.cssText = 'font-size: 13px; line-height: 16px;';
    burntLabel.textContent = String(burntCount());
    const icon = document.createElement('span');
    icon.style.display = 'inline-flex';
    const paint = () => {
      render(h(burntCommentsShown() ? ShieldOff : Shield, { size: 16 }), icon);
      toggle.title = burntCommentsShown()
        ? 'Hide burnt comments'
        : 'Show burnt comments';
    };
    paint();
    toggle.append(burntLabel, icon);
    toggle.addEventListener('click', () => toggleBurntComments());
    subscribeBurntComments(paint);
    region.append(toggle);
  }

  region.append(burn, all);
  anchor.insertAdjacentElement(config.controls.position, region);
  return region;
}

export function mountBurnControls(): void {
  const config = currentBurnableConfig();
  if (!config) return;
  const items = readBurnables(config);
  if (items.length === 0) return;

  for (const item of items) injectCheckbox(item);
  const region = renderRegion(items);
  if (!region) return;
  refreshRegion(items, region);

  burnPile.subscribe(() => {
    for (const item of items) {
      const checkbox = item.el.querySelector<HTMLInputElement>(
        `.${CHECKBOX_CLASS}`,
      );
      if (checkbox) checkbox.checked = burnPile.has(refOf(item));
    }
    refreshRegion(items, region);
  });
}
