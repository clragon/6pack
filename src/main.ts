import { matchesTrigger, triggerIsModless } from './core/config';
import { detectContext } from './core/context/detect';
import { ActionRegistry } from './core/actions/registry';
import { mountPalette } from './core/palette/mount';
import { isConfirmActive } from './core/palette/confirm';
import { deepActiveElement, isEditableElement } from './core/palette/focus';
import { captureStore, paletteStore } from './core/palette/store';
import { log } from './core/log';
import { prefetchReportedDestination } from './site/ticket';
import { loadCurrentUser } from './site/user';
import { allActions } from './actions';

const page = detectContext();

const registry = new ActionRegistry();
registry.register(...allActions);

void loadCurrentUser();

if (page.kind === 'ticket') prefetchReportedDestination();

mountPalette(page, () => registry.available(page));

log.info(page.kind === 'post' ? `ready on post #${page.id}` : `ready on ${page.kind}`);

window.addEventListener(
  'keydown',
  (event) => {
    if (captureStore.isOpen() || isConfirmActive()) return;
    if (!matchesTrigger(event)) return;
    if (triggerIsModless() && isEditableElement(deepActiveElement())) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    paletteStore.toggle();
  },
  true,
);
