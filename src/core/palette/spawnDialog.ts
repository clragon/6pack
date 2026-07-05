import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

import CHROME_STYLES from './chrome.css?inline';
import type { DialogSpec } from './dialog';
import { engageOverlay } from './overlay';

interface Host {
  openDialog?: (spec: DialogSpec) => () => void;
}

// Spawn a dialog through 6pack's palette when it is present, else as a standalone
// modal. Safe to import from an add-on: managed mode reaches the real palette via
// the runtime bridge, so no disconnected copy of the palette is bundled.
export function spawnDialog(spec: DialogSpec): () => void {
  const host = (unsafeWindow as unknown as { sixpack?: Host }).sixpack;
  if (host?.openDialog) return host.openDialog(spec);
  return standalone(spec);
}

const CHROME_ID = 'sixpack-standalone-dialog-style';

function ensureChrome(): void {
  if (document.getElementById(CHROME_ID)) return;
  const style = document.createElement('style');
  style.id = CHROME_ID;
  style.textContent = CHROME_STYLES;
  document.head.appendChild(style);
}

function standalone(spec: DialogSpec): () => void {
  ensureChrome();

  const backdrop = document.createElement('div');
  backdrop.className = 'sp-standalone-backdrop';
  const dialog = document.createElement('div');
  dialog.className = 'sp-standalone-dialog';
  if (spec.styles) {
    const style = document.createElement('style');
    style.textContent = spec.styles;
    dialog.appendChild(style);
  }

  let teardown: (() => void) | void;
  let releaseOverlay: (() => void) | undefined;
  const close = () => {
    teardown?.();
    backdrop.remove();
    releaseOverlay?.();
  };

  const header = document.createElement('div');
  header.className = 'sp-standalone-header';
  const crumbs = document.createElement('div');
  crumbs.className = 'sp-standalone-crumbs';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'sp-standalone-x';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', close);
  header.append(crumbs, closeBtn);

  // onClick crumbs navigate within the dialog; target crumbs are palette-only.
  const renderCrumbs = (trail: DialogSpec['trail']): void => {
    crumbs.replaceChildren();
    trail.forEach((crumb, index) => {
      const last = index === trail.length - 1;
      if (index > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'sp-standalone-arrow';
        arrow.textContent = '›';
        crumbs.append(arrow);
      }
      if (crumb.onClick && !last) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sp-standalone-crumb';
        button.textContent = crumb.title;
        button.addEventListener('click', crumb.onClick);
        crumbs.append(button);
      } else {
        const span = document.createElement('span');
        span.className =
          'sp-standalone-crumb' + (last ? ' sp-standalone-current' : '');
        span.textContent = crumb.title;
        crumbs.append(span);
      }
    });
  };
  renderCrumbs(spec.trail);

  const slot = document.createElement('div');
  slot.className = 'sp-dialog-body';
  dialog.append(header, slot);
  backdrop.appendChild(dialog);

  backdrop.addEventListener('mousedown', (event) => {
    if (event.target === backdrop) close();
  });
  dialog.addEventListener('mousedown', (event) => event.stopPropagation());
  // Swallow keys once content has handled them, so the page's hotkeys can't fire.
  backdrop.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') close();
  });

  document.body.appendChild(backdrop);
  releaseOverlay = engageOverlay(backdrop);
  teardown = spec.render(slot, close, renderCrumbs);
  return close;
}
