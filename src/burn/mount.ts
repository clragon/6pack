import { h, render } from 'preact';
import { Shield, ShieldOff } from 'lucide-preact';
import { burnPile, type BurnRef } from '../core/burn';
import {
  ensureIconButtonStyles,
  flameButton,
  ICON_BTN_CLASS,
} from '../core/palette/flame';
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
import { isModeratorPlus, loadCurrentUser } from '../site/user';

const CHECKBOX_CLASS = 'sixpack-burner';
const ALL_CLASS = 'sixpack-burner-all';
const COUNT_CLASS = 'sixpack-burner-count';
const REGION_ID = 'sixpack-burner-controls';

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

  const isRow = item.el.tagName === 'TR';
  const cell = document.createElement(isRow ? 'td' : 'div');
  cell.style.cssText = isRow
    ? 'padding: 0.25rem 0.5rem; cursor: pointer; text-align: right;'
    : [
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

  ensureIconButtonStyles();

  const region = document.createElement('div');
  region.id = REGION_ID;
  region.style.cssText =
    'display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin: 10px;';

  const burn = flameButton('burnable', { title: 'Incinerate selection' });
  const count = document.createElement('span');
  count.className = COUNT_CLASS;
  count.style.cssText = 'font-size: 13px; line-height: 16px;';
  burn.prepend(count);

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
    toggle.className = ICON_BTN_CLASS;
    toggle.style.cssText =
      'display: inline-flex; align-items: center; gap: 6px; border: none; cursor: pointer; color: var(--color-text, #cfd8e6); font-weight: 700;';
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
  if (config.type === 'user') {
    void loadCurrentUser().then(() => {
      if (isModeratorPlus()) mountControls();
    });
    return;
  }
  mountControls();
}

function mountControls(): void {
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
