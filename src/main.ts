import { matchesTrigger, triggerIsModless } from './core/config';
import { detectContext } from './core/context/detect';
import { record } from './core/diag';
import { ActionRegistry } from './core/actions/registry';
import { addons } from './core/addons/manager';
import { mountPalette } from './core/palette/mount';
import { isConfirmActive } from './core/palette/confirm';
import { isDialogActive } from './core/palette/dialog';
import { deepActiveElement, isEditableElement } from './core/palette/focus';
import { captureStore, paletteStore } from './core/palette/store';
import { log } from './core/log';
import { whenReady } from './core/ready';
import { loadCurrentUser } from './site/user';
import { allActions } from './actions';

const page = detectContext();
record('page', page);

const registry = new ActionRegistry();
registry.register(...allActions);

// Publish the bridge and load enabled add-ons at document-start, before first paint.
addons.init(registry, page);

// The rest reads or mounts into the page, so it waits for the parse.
whenReady(() => {
  // Warm the permission cache so level-gated actions resolve on first open, and
  // record the resolved user as clean diagnostic rows.
  void loadCurrentUser().then((user) => {
    record('user', user ? `${user.name} #${user.id}` : 'anonymous');
    if (user) record('level', `${user.levelString} (${user.level})`);
  });

  mountPalette(page, () => registry.available(page));

  log.info(
    page.kind === 'post'
      ? `ready on post #${page.id}`
      : `ready on ${page.kind}`,
  );

  // Capture phase so the trigger wins over e621's own document-level key handler.
  window.addEventListener(
    'keydown',
    (event) => {
      // a prompt or dialog is open
      if (captureStore.isOpen() || isConfirmActive() || isDialogActive())
        return;
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
});
