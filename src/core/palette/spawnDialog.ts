import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

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

const CHROME_STYLES = `
.sp-standalone-backdrop { position: fixed; inset: 0; z-index: 2147483647; display: flex; justify-content: center; align-items: flex-start; background: rgba(0,0,0,0.5); }
.sp-standalone-dialog { margin-top: 8vh; width: min(820px, 94vw); max-height: 84vh; display: flex; flex-direction: column; background: var(--color-section, #1b2433); border: 1px solid var(--color-table-border, #313d52); border-radius: 6px; box-shadow: 0 12px 44px rgba(0,0,0,0.55); overflow: hidden; color: var(--color-text, #b4c7d9); }
.sp-standalone-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--color-table-border, #313d52); }
.sp-standalone-crumbs { display: flex; align-items: center; gap: 4px; font-weight: 700; min-width: 0; }
.sp-standalone-crumb { padding: 0; font: inherit; font-weight: 700; color: inherit; background: none; border: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
button.sp-standalone-crumb { color: var(--color-text-muted, #9aa6bd); cursor: pointer; }
button.sp-standalone-crumb:hover { color: inherit; text-decoration: underline; }
.sp-standalone-arrow { color: var(--color-text-muted, #9aa6bd); }
.sp-standalone-x { background: none; border: none; color: inherit; font-size: 20px; line-height: 1; cursor: pointer; }
.sp-standalone-dialog .sp-dialog-body { display: flex; flex-direction: column; min-height: 0; flex: 1; overflow: hidden; }
`;
