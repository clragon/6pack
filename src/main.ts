import { matchesTrigger, triggerIsModless } from './core/config';
import { detectContext } from './core/context/detect';
import { ActionRegistry } from './core/actions/registry';
import { mountPalette } from './core/palette/mount';
import { isConfirmActive } from './core/palette/confirm';
import { deepActiveElement, isEditableElement } from './core/palette/focus';
import { captureStore, paletteStore } from './core/palette/store';
import { log } from './core/log';
import { loadCurrentUser } from './site/user';
import { allActions } from './actions';

const page = detectContext();

const registry = new ActionRegistry();
registry.register(...allActions);

// Warm the permission cache so level-gated actions resolve on first open.
void loadCurrentUser();

mountPalette(page, () => registry.available(page));

log.info(page.kind === 'post' ? `ready on post #${page.id}` : `ready on ${page.kind}`);

// Capture phase so the trigger wins over e621's own document-level key handler.
window.addEventListener(
  'keydown',
  (event) => {
    if (captureStore.isOpen() || isConfirmActive()) return; // a prompt is open
    if (!matchesTrigger(event)) return;
    // A modifier-less trigger (e.g. plain "Q") must not hijack typing in a
    // field; close with Esc instead.
    if (triggerIsModless() && isEditableElement(deepActiveElement())) return;
    event.preventDefault();
    // Stop e621's own hotkey handler from also seeing this key (its search-focus
    // hotkey scrolls the page to the top).
    event.stopImmediatePropagation();
    paletteStore.toggle();
  },
  true,
);
